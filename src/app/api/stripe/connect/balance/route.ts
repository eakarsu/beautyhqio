import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-12-15.clover",
  });
}

// Get balance for a staff member's Stripe Connect account
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff?.stripeAccountId) {
      return NextResponse.json({
        available: 0,
        pending: 0,
        currency: "usd",
      });
    }

    const stripe = getStripe();

    // Get balance for the connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: staff.stripeAccountId,
    });

    // Sum up available and pending amounts (assuming USD)
    const available = balance.available
      .filter((b) => b.currency === "usd")
      .reduce((sum, b) => sum + b.amount, 0) / 100;

    const pending = balance.pending
      .filter((b) => b.currency === "usd")
      .reduce((sum, b) => sum + b.amount, 0) / 100;

    return NextResponse.json({
      available,
      pending,
      currency: "usd",
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Failed to get balance" },
      { status: 500 }
    );
  }
}
