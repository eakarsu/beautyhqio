import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover",
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;

    // Get client
    const client = await prisma.client.findFirst({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let stripeCustomerId = client.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email || undefined,
        name: `${client.firstName} ${client.lastName}`,
        phone: client.phone || undefined,
        metadata: {
          clientId: client.id,
        },
      });
      stripeCustomerId = customer.id;

      // Save to database
      await prisma.client.update({
        where: { id: clientId },
        data: { stripeCustomerId },
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      metadata: {
        clientId: client.id,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    });
  } catch (error) {
    console.error("Client setup intent error:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
