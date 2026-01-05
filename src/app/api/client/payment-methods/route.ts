import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

// GET /api/client/payment-methods - Get client's saved payment methods
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profile
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email },
        ],
      },
    });

    if (!client?.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: client.stripeCustomerId,
      type: "card",
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(client.stripeCustomerId);
    const defaultPaymentMethodId =
      typeof customer !== "string" && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : null;

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || "card",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethodId,
      })),
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ paymentMethods: [] });
  }
}

// POST /api/client/payment-methods - Add a new payment method
export async function POST() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create client profile
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email },
        ],
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Create Stripe customer if needed
    if (!client.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email || undefined,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { clientId: client.id },
      });

      client = await prisma.client.update({
        where: { id: client.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    }

    // Create setup intent for adding a card
    const setupIntent = await stripe.setupIntents.create({
      customer: client.stripeCustomerId!,
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
