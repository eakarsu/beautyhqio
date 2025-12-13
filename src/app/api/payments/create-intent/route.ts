import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent, getOrCreateCustomer } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// POST /api/payments/create-intent - Create a payment intent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, clientId, description, transactionId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer if clientId provided
    let stripeCustomerId: string | undefined;

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { email: true, firstName: true, lastName: true, phone: true },
      });

      if (client && client.email) {
        const stripeCustomer = await getOrCreateCustomer(
          client.email,
          `${client.firstName} ${client.lastName}`,
          client.phone || undefined
        );
        stripeCustomerId = stripeCustomer.id;
      }
    }

    // Create payment intent
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      customerId: stripeCustomerId,
      description: description || "Beauty & Wellness Payment",
      metadata: {
        clientId: clientId || "",
        transactionId: transactionId || "",
      },
    });

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
