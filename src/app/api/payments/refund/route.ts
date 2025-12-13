import { NextRequest, NextResponse } from "next/server";
import { createRefund } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// POST /api/payments/refund - Process a refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, amount, reason, transactionId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required" },
        { status: 400 }
      );
    }

    // Create refund in Stripe
    const refund = await createRefund(
      paymentIntentId,
      amount ? Math.round(amount * 100) : undefined,
      reason
    );

    // Update transaction if provided
    if (transactionId) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: amount ? "COMPLETED" : "REFUNDED", // Partial vs full refund
        },
      });

      // Create activity log
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { clientId: true },
      });

      if (transaction?.clientId) {
        await prisma.activity.create({
          data: {
            clientId: transaction.clientId,
            type: "PURCHASE",
            title: "Refund processed",
            description: `$${(refund.amount / 100).toFixed(2)} refunded`,
            metadata: {
              refundId: refund.id,
              transactionId,
              amount: refund.amount / 100,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
