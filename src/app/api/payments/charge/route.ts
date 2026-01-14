import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-12-18.acacia" as any,
  });
}

// POST /api/payments/charge - Charge a saved payment method
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, clientId, paymentMethodId, staffId, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    // Get client's Stripe customer ID
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.stripeCustomerId) {
      return NextResponse.json({ error: "Client has no Stripe customer ID" }, { status: 400 });
    }

    // Create and confirm payment intent with the saved payment method
    const paymentIntent = await getStripe().paymentIntents.create({
      amount, // amount in cents
      currency: "usd",
      customer: client.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `POS Payment for ${client.firstName} ${client.lastName}`,
      metadata: {
        clientId,
        staffId: staffId || "",
        businessId: user.businessId || "",
        ...metadata,
      },
    });

    if (paymentIntent.status === "succeeded") {
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Payment failed with status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error charging payment method:", error);

    // Handle Stripe-specific errors
    if (error.type === "StripeCardError") {
      return NextResponse.json({
        success: false,
        error: error.message || "Card was declined",
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
