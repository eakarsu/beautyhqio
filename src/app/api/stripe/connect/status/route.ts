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

// Get Stripe Connect account status for a staff member
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

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (!staff.stripeAccountId) {
      return NextResponse.json({
        status: "not_connected",
        payoutsEnabled: false,
        chargesEnabled: false,
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(staff.stripeAccountId);

    // Determine status
    let status = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      status = "active";
    } else if (account.requirements?.disabled_reason) {
      status = "restricted";
    }

    // Update status in database if changed
    if (status !== staff.stripeAccountStatus) {
      await prisma.staff.update({
        where: { id: staffId },
        data: { stripeAccountStatus: status },
      });
    }

    return NextResponse.json({
      status,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      requirements: account.requirements,
      balance: null, // Will fetch separately if needed
    });
  } catch (error) {
    console.error("Stripe Connect status error:", error);
    return NextResponse.json(
      { error: "Failed to get account status" },
      { status: 500 }
    );
  }
}
