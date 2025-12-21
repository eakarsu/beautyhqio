import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { COMMISSION_RATES, SUBSCRIPTION_PRICING, getRecommendedPlan } from "@/lib/commission";
import { SubscriptionPlan } from "@prisma/client";

// GET /api/business/subscription - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get or create subscription
    let subscription = await prisma.businessSubscription.findUnique({
      where: { businessId: user.business.id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // If no subscription exists, create a default STARTER subscription
    if (!subscription) {
      subscription = await prisma.businessSubscription.create({
        data: {
          businessId: user.business.id,
          plan: "STARTER",
          status: "ACTIVE",
          monthlyPrice: 0,
          marketplaceCommissionPct: COMMISSION_RATES.STARTER,
        },
        include: {
          invoices: true,
        },
      });
    }

    // Get lead stats for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const leadStats = await prisma.marketplaceLead.aggregate({
      where: {
        businessId: user.business.id,
        status: "COMPLETED",
        completedAt: { gte: startOfMonth },
      },
      _count: { id: true },
      _sum: { commissionAmount: true },
    });

    // Calculate recommended plan
    const monthlyLeadRevenue = Number(leadStats._sum.commissionAmount || 0) *
      (100 / COMMISSION_RATES[subscription.plan as SubscriptionPlan]);
    const recommendedPlan = getRecommendedPlan(monthlyLeadRevenue);

    return NextResponse.json({
      subscription: {
        ...subscription,
        monthlyPrice: Number(subscription.monthlyPrice),
        marketplaceCommissionPct: Number(subscription.marketplaceCommissionPct),
      },
      stats: {
        leadsThisMonth: leadStats._count.id,
        commissionThisMonth: Number(leadStats._sum.commissionAmount || 0),
        estimatedMonthlyRevenue: monthlyLeadRevenue,
      },
      plans: Object.entries(SUBSCRIPTION_PRICING).map(([plan, price]) => ({
        plan,
        price,
        commissionRate: COMMISSION_RATES[plan as SubscriptionPlan],
        isCurrentPlan: plan === subscription.plan,
        isRecommended: plan === recommendedPlan,
      })),
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST /api/business/subscription - Create or start subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json();
    const { plan } = body as { plan: SubscriptionPlan };

    if (!plan || !Object.keys(SUBSCRIPTION_PRICING).includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const price = SUBSCRIPTION_PRICING[plan];
    const commissionRate = COMMISSION_RATES[plan];

    // Check if subscription already exists
    const existingSubscription = await prisma.businessSubscription.findUnique({
      where: { businessId: user.business.id },
    });

    if (existingSubscription) {
      // Update existing subscription
      const subscription = await prisma.businessSubscription.update({
        where: { businessId: user.business.id },
        data: {
          plan,
          status: "ACTIVE",
          monthlyPrice: price,
          marketplaceCommissionPct: commissionRate,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({ subscription });
    }

    // Create new subscription
    const subscription = await prisma.businessSubscription.create({
      data: {
        businessId: user.business.id,
        plan,
        status: "ACTIVE",
        monthlyPrice: price,
        marketplaceCommissionPct: commissionRate,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// PUT /api/business/subscription - Upgrade/downgrade subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json();
    const { plan } = body as { plan: SubscriptionPlan };

    if (!plan || !Object.keys(SUBSCRIPTION_PRICING).includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const price = SUBSCRIPTION_PRICING[plan];
    const commissionRate = COMMISSION_RATES[plan];

    const subscription = await prisma.businessSubscription.update({
      where: { businessId: user.business.id },
      data: {
        plan,
        monthlyPrice: price,
        marketplaceCommissionPct: commissionRate,
      },
    });

    return NextResponse.json({
      subscription: {
        ...subscription,
        monthlyPrice: Number(subscription.monthlyPrice),
        marketplaceCommissionPct: Number(subscription.marketplaceCommissionPct),
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/subscription - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json();
    const { reason } = body as { reason?: string };

    // Downgrade to STARTER (free) instead of fully cancelling
    const subscription = await prisma.businessSubscription.update({
      where: { businessId: user.business.id },
      data: {
        plan: "STARTER",
        monthlyPrice: 0,
        marketplaceCommissionPct: COMMISSION_RATES.STARTER,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    return NextResponse.json({
      subscription,
      message: "Subscription cancelled. You have been downgraded to the free tier.",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
