import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/my-subscription - Get current user's salon subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Platform admin and clients don't have subscriptions
    if (session.user.isPlatformAdmin || session.user.isClient) {
      return NextResponse.json({ error: "Not applicable" }, { status: 400 });
    }

    // Get user with their business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });

    if (!user?.businessId || !user.business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    // Get subscription for this specific business
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId: user.businessId },
    });

    if (!subscription) {
      // Return default STARTER subscription info
      return NextResponse.json({
        subscription: {
          id: null,
          plan: "STARTER",
          status: "ACTIVE",
          monthlyPrice: 0,
          commissionRate: 9,
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        monthlyPrice: Number(subscription.monthlyPrice),
        commissionRate: Number(subscription.marketplaceCommissionPct),
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching my subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
