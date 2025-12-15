import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover",
  });
}

// GET - List all saved payment methods
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });

    if (!user?.business.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.business.stripeCustomerId,
      type: "card",
    });

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false, // Can be enhanced to track default
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a payment method
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing payment method:", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}
