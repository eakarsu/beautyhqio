import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/checkout - Process checkout/sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      locationId,
      clientId,
      staffId,
      items,
      paymentMethod,
      subtotal,
      tax,
      discount,
      tip,
      total,
      giftCardCode,
      loyaltyPointsUsed,
      notes,
    } = body;

    // Get locationId - use provided or get default location
    let finalLocationId = locationId;
    if (!finalLocationId) {
      const defaultLocation = await prisma.location.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (defaultLocation) {
        finalLocationId = defaultLocation.id;
      } else {
        return NextResponse.json(
          { error: "No location found. Please create a location first." },
          { status: 400 }
        );
      }
    }

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: "SALE",
          status: "COMPLETED",
          date: new Date(),
          locationId: finalLocationId,
          clientId,
          staffId,
          subtotal: new Decimal(subtotal),
          taxAmount: new Decimal(tax || 0),
          discountAmount: new Decimal(discount || 0),
          tipAmount: new Decimal(tip || 0),
          totalAmount: new Decimal(total),
          notes,
        },
      });

      // Create line items
      for (const item of items) {
        await tx.transactionLineItem.create({
          data: {
            transactionId: transaction.id,
            type: item.serviceId ? "SERVICE" : item.productId ? "PRODUCT" : "OTHER",
            name: item.name,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.total),
            serviceId: item.serviceId,
            productId: item.productId,
            performedById: item.staffId,
          },
        });

        // Reduce product inventory if product
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantityOnHand: { decrement: item.quantity || 1 },
            },
          });
        }
      }

      // Create payment record
      await tx.transactionPayment.create({
        data: {
          transactionId: transaction.id,
          method: paymentMethod || "CASH",
          amount: new Decimal(total),
        },
      });

      // Handle gift card payment
      if (giftCardCode) {
        const giftCard = await tx.giftCard.findUnique({
          where: { code: giftCardCode },
        });

        if (giftCard && giftCard.status === "ACTIVE") {
          const gcAmount = Math.min(Number(giftCard.currentBalance), total);
          await tx.giftCard.update({
            where: { code: giftCardCode },
            data: {
              currentBalance: { decrement: gcAmount },
              status: Number(giftCard.currentBalance) - gcAmount === 0 ? "FULLY_REDEEMED" : "ACTIVE",
            },
          });

          await tx.giftCardUsage.create({
            data: {
              giftCardId: giftCard.id,
              amount: new Decimal(gcAmount),
              balanceAfter: new Decimal(Number(giftCard.currentBalance) - gcAmount),
            },
          });
        }
      }

      // Handle loyalty points redemption
      if (loyaltyPointsUsed && clientId) {
        const loyaltyAccount = await tx.loyaltyAccount.findUnique({
          where: { clientId },
        });

        if (loyaltyAccount && loyaltyAccount.pointsBalance >= loyaltyPointsUsed) {
          await tx.loyaltyAccount.update({
            where: { clientId },
            data: {
              pointsBalance: { decrement: loyaltyPointsUsed },
            },
          });

          await tx.loyaltyTransaction.create({
            data: {
              accountId: loyaltyAccount.id,
              type: "REDEMPTION",
              points: -loyaltyPointsUsed,
              description: `Redeemed for purchase`,
            },
          });
        }
      }

      // Earn loyalty points for the purchase
      if (clientId) {
        const loyaltyProgram = await tx.loyaltyProgram.findFirst({
          where: { isActive: true },
        });

        if (loyaltyProgram) {
          let loyaltyAccount = await tx.loyaltyAccount.findUnique({
            where: { clientId },
          });

          if (!loyaltyAccount) {
            loyaltyAccount = await tx.loyaltyAccount.create({
              data: {
                clientId,
                programId: loyaltyProgram.id,
                tier: "Bronze",
                pointsBalance: 0,
                lifetimePoints: 0,
              },
            });
          }

          const pointsEarned = Math.floor(total * Number(loyaltyProgram.pointsPerDollar));

          await tx.loyaltyAccount.update({
            where: { id: loyaltyAccount.id },
            data: {
              pointsBalance: { increment: pointsEarned },
              lifetimePoints: { increment: pointsEarned },
            },
          });

          await tx.loyaltyTransaction.create({
            data: {
              accountId: loyaltyAccount.id,
              type: "EARN",
              points: pointsEarned,
              description: `Earned from purchase`,
            },
          });
        }
      }

      // Create activity record for client purchase
      if (clientId) {
        await tx.activity.create({
          data: {
            clientId,
            type: "PURCHASE",
            title: `Completed purchase - $${total.toFixed(2)}`,
            description: `${items.length} item(s) purchased`,
            metadata: { transactionId: transaction.id, total, itemCount: items.length },
          },
        });
      }

      return transaction;
    });

    // Fetch the complete transaction with relations
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        lineItems: true,
        payments: true,
        client: true,
        staff: true,
        location: true,
      },
    });

    return NextResponse.json(completeTransaction, { status: 201 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}

// GET /api/checkout - Get recent transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (locationId) where.locationId = locationId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        lineItems: true,
        payments: true,
        client: true,
        staff: true,
        location: true,
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
