import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const money = z.number().finite().nonnegative().max(1_000_000);
const checkoutSchema = z.object({
  locationId: z.string().min(1).optional(), clientId: z.string().min(1).nullish(), staffId: z.string().min(1),
  items: z.array(z.object({ name: z.string().min(1), description: z.string().optional(), quantity: z.number().int().positive().max(1000).default(1), unitPrice: money, total: money,
    serviceId: z.string().min(1).optional(), productId: z.string().min(1).optional(), staffId: z.string().min(1).optional() })).min(1).max(100),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "GIFT_CARD", "PREPAID_PACKAGE", "POINTS", "APPLE_PAY", "GOOGLE_PAY", "OTHER"]).optional(),
  subtotal: money, tax: money.optional(), discount: money.optional(), tip: money.optional(), total: money,
  giftCardCode: z.string().min(1).optional(), loyaltyPointsUsed: z.number().int().nonnegative().optional(), notes: z.string().max(2000).optional(),
});

// POST /api/checkout - Process checkout/sale
export async function POST(request: NextRequest) {
  try {
    const actor = await requireRoles(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    if (actor instanceof NextResponse) return actor;
    if (!actor.isPlatformAdmin && !actor.businessId) return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    const body = checkoutSchema.parse(await request.json().catch(() => null));
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
        where: { isActive: true, businessId: actor.businessId || "__none__" },
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

    const location = await prisma.location.findFirst({ where: { id: finalLocationId, isActive: true, ...(actor.isPlatformAdmin ? {} : { businessId: actor.businessId! }) } });
    if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    const businessId = location.businessId;
    const staffIds = [...new Set([staffId, ...items.flatMap(item => item.staffId ? [item.staffId] : [])])];
    const productIds = [...new Set(items.flatMap(item => item.productId ? [item.productId] : []))];
    const serviceIds = [...new Set(items.flatMap(item => item.serviceId ? [item.serviceId] : []))];
    const [staffCount, productCount, serviceCount, clientCount, giftCardCount] = await Promise.all([
      prisma.staff.count({ where: { id: { in: staffIds }, location: { businessId }, isActive: true } }),
      prisma.product.count({ where: { id: { in: productIds }, businessId } }),
      prisma.service.count({ where: { id: { in: serviceIds }, businessId } }),
      clientId ? prisma.client.count({ where: { id: clientId, businessId } }) : Promise.resolve(1),
      giftCardCode ? prisma.giftCard.count({ where: { code: giftCardCode, businessId } }) : Promise.resolve(1),
    ]);
    if (staffCount !== staffIds.length || productCount !== productIds.length || serviceCount !== serviceIds.length || !clientCount || !giftCardCount) return NextResponse.json({ error: "Checkout resources must belong to this business" }, { status: 403 });
    const cents = (value: number) => Math.round(value * 100);
    if (items.some(item => cents(item.total) !== cents(item.unitPrice) * item.quantity) || cents(subtotal) !== items.reduce((sum, item) => sum + cents(item.total), 0) || cents(total) !== cents(subtotal) + cents(tax || 0) + cents(tip || 0) - cents(discount || 0)) return NextResponse.json({ error: "Checkout totals do not match line items" }, { status: 422 });

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
          where: { isActive: true, businessId },
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
    if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
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
    const actor = await requireRoles(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    if (actor instanceof NextResponse) return actor;
    if (!actor.isPlatformAdmin && !actor.businessId) return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = actor.isPlatformAdmin ? {} : { location: { businessId: actor.businessId! } };
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
