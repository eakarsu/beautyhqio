import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/checkout/[id] - Get transaction details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            service: true,
            product: true,
          },
        },
        payments: true,
        client: true,
        staff: true,
        location: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// POST /api/checkout/[id]/refund - Refund transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, itemIds } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Calculate refund amount
    let refundAmount = 0;
    const itemsToRefund = itemIds
      ? transaction.lineItems.filter((item) => itemIds.includes(item.id))
      : transaction.lineItems;

    for (const item of itemsToRefund) {
      refundAmount += Number(item.totalPrice);
    }

    // Create refund transaction
    const refundTxNumber = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const refundTransaction = await prisma.transaction.create({
      data: {
        transactionNumber: refundTxNumber,
        type: "REFUND",
        status: "COMPLETED",
        date: new Date(),
        locationId: transaction.locationId,
        clientId: transaction.clientId,
        staffId: transaction.staffId,
        subtotal: new Decimal(-refundAmount),
        taxAmount: new Decimal(0),
        discountAmount: new Decimal(0),
        tipAmount: new Decimal(0),
        totalAmount: new Decimal(-refundAmount),
        notes: reason || `Refund for transaction ${transaction.transactionNumber}`,
      },
    });

    // Restore product inventory for refunded items
    for (const item of itemsToRefund) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantityOnHand: { increment: item.quantity },
          },
        });
      }
    }

    // Create activity if client exists
    if (transaction.clientId) {
      await prisma.activity.create({
        data: {
          clientId: transaction.clientId,
          type: "PURCHASE",
          title: `Refund processed - $${refundAmount.toFixed(2)}`,
          description: reason || "Transaction refunded",
          metadata: { originalTransactionId: id, refundTransactionId: refundTransaction.id, refundAmount },
        },
      });
    }

    return NextResponse.json({
      originalTransaction: transaction,
      refundTransaction,
      refundAmount,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
