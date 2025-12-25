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

// Transfer funds to a staff member's Stripe Connect account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { staffId, amount, description, type } = body;

    if (!staffId || !amount) {
      return NextResponse.json(
        { error: "Staff ID and amount required" },
        { status: 400 }
      );
    }

    // Get staff with Connect account
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (!staff.stripeAccountId) {
      return NextResponse.json(
        { error: "Staff has no connected Stripe account" },
        { status: 400 }
      );
    }

    if (staff.stripeAccountStatus !== "active") {
      return NextResponse.json(
        { error: "Staff Stripe account is not active" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      destination: staff.stripeAccountId,
      description: description || `Payment to ${staff.displayName || staff.user.firstName}`,
      metadata: {
        staffId: staff.id,
        type: type || "payout", // tip, commission, salary, bonus, payout
      },
    });

    // Record the payout in database (optional - create a Payout model)
    // For now we'll just return the transfer info

    return NextResponse.json({
      transferId: transfer.id,
      amount: amount,
      status: transfer.reversed ? "reversed" : "completed",
    });
  } catch (error) {
    console.error("Stripe transfer error:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}

// Get transfer history for a staff member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff?.stripeAccountId) {
      return NextResponse.json({ transfers: [] });
    }

    const stripe = getStripe();

    // Get transfers to this connected account
    const transfers = await stripe.transfers.list({
      destination: staff.stripeAccountId,
      limit,
    });

    const formattedTransfers = transfers.data.map((t) => ({
      id: t.id,
      amount: t.amount / 100,
      currency: t.currency,
      description: t.description,
      type: t.metadata?.type || "payout",
      created: new Date(t.created * 1000).toISOString(),
      reversed: t.reversed,
    }));

    return NextResponse.json({ transfers: formattedTransfers });
  } catch (error) {
    console.error("Get transfers error:", error);
    return NextResponse.json(
      { error: "Failed to get transfers" },
      { status: 500 }
    );
  }
}
