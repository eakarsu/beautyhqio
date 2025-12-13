import { NextRequest, NextResponse } from "next/server";
import { getPaymentIntent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// POST /api/payments/confirm - Confirm payment was successful and update records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, transactionId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required" },
        { status: 400 }
      );
    }

    // Get payment intent from Stripe
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not successful. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Update transaction if provided
    if (transactionId) {
      await prisma.transactionPayment.create({
        data: {
          transactionId,
          method: "CREDIT_CARD",
          amount: paymentIntent.amount / 100, // Convert from cents
          reference: paymentIntent.id,
          stripePaymentId: paymentIntent.id,
        },
      });

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
