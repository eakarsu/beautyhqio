import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

// GET /api/staff/me/stripe-connect - Get Stripe Connect status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // If connected, get account details from Stripe
    if (staff.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(staff.stripeAccountId);

        return NextResponse.json({
          connected: true,
          accountId: staff.stripeAccountId,
          status: staff.stripeAccountStatus,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });
      } catch {
        return NextResponse.json({
          connected: false,
          status: "not_connected",
        });
      }
    }

    return NextResponse.json({
      connected: false,
      status: staff.stripeAccountStatus || "not_connected",
    });
  } catch (error) {
    console.error("Error fetching Stripe Connect status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

// POST /api/staff/me/stripe-connect - Create Stripe Connect onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    let accountId = staff.stripeAccountId;

    // Create Stripe Connect account if not exists
    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: staff.user.email,
          capabilities: {
            transfers: { requested: true },
          },
          business_type: "individual",
          individual: {
            first_name: staff.user.firstName,
            last_name: staff.user.lastName,
            email: staff.user.email,
          },
          metadata: {
            staffId: staff.id,
            userId: session.user.id,
          },
        });

        accountId = account.id;

        // Save account ID to database
        await prisma.staff.update({
          where: { id: staff.id },
          data: {
            stripeAccountId: accountId,
            stripeAccountStatus: "pending",
          },
        });
      } catch (stripeError: any) {
        // Check if Connect is not enabled
        if (stripeError.type === "StripeInvalidRequestError" &&
            stripeError.message?.includes("signed up for Connect")) {
          return NextResponse.json(
            {
              error: "Stripe Connect not enabled",
              message: "Stripe Connect needs to be enabled in your Stripe dashboard. Please use the bank account option instead, or ask your administrator to enable Stripe Connect.",
              connectRequired: true
            },
            { status: 400 }
          );
        }
        throw stripeError;
      }
    }

    // Create account link for onboarding
    const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/staff/settings?stripe=refresh`,
      return_url: `${origin}/staff/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating Stripe Connect link:", error);
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/me/stripe-connect - Disconnect Stripe account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Clear Stripe account from database
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        stripeAccountId: null,
        stripeAccountStatus: "not_connected",
        payoutMethod: "manual",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Stripe:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
