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

// Create Stripe Connect account and generate onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { staffId } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 });
    }

    // Get staff member with user info
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let accountId = staff.stripeAccountId;

    // Create Stripe Connect Express account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: staff.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          staffId: staff.id,
          userId: staff.userId,
        },
      });

      accountId = account.id;

      // Save account ID to database
      await prisma.staff.update({
        where: { id: staffId },
        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
        },
      });
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/staff/${staffId}?connect=refresh`,
      return_url: `${baseUrl}/staff/${staffId}?connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (error) {
    console.error("Stripe Connect onboard error:", error);
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    );
  }
}
