import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  COMMISSION_RATES,
  SUBSCRIPTION_PRICING,
  getRecommendedPlan,
} from "@/lib/commission";
import {
  beginBusinessBilling,
  BillingError,
  reconcileBusinessCheckout,
  syncBusinessSubscription,
  effectiveSubscription,
} from "@/lib/business-billing";
import { boundedBody, OperationError } from "@/lib/operations/core";
import { SubscriptionPlan } from "@prisma/client";

// GET /api/business/subscription - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });

    if (
      !user?.isActive ||
      !user.business ||
      !["OWNER", "MANAGER"].includes(user.role)
    ) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
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
      subscription = await prisma.businessSubscription.upsert({
        where: { businessId: user.business.id },
        update: {},
        create: {
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

    subscription = effectiveSubscription(subscription);
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
    const monthlyLeadRevenue =
      COMMISSION_RATES[subscription.plan] > 0
        ? (Number(leadStats._sum.commissionAmount || 0) * 100) /
          COMMISSION_RATES[subscription.plan]
        : null;
    const recommendedPlan =
      monthlyLeadRevenue === null
        ? null
        : getRecommendedPlan(monthlyLeadRevenue);

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
      billingAttempts: await prisma.businessBillingAttempt.findMany({
        where: { businessId: user.business.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          plan: true,
          status: true,
          providerSessionId: true,
          providerSubscriptionId: true,
          lastError: true,
          createdAt: true,
        },
      }),
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
      { status: 500 },
    );
  }
}

// Plan selection opens provider checkout or the billing portal. It never grants a paid plan.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });
    if (!user?.isActive || !user.business)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    if (user.role !== "OWNER")
      return NextResponse.json(
        { error: "Only the business owner can manage billing" },
        { status: 403 },
      );
    const body = await boundedBody(request);
    if (body.action === "reconcile" || body.action === "expire") {
      if (
        typeof body.id !== "string" ||
        typeof body.sessionId !== "string" ||
        body.id.length > 191 ||
        body.sessionId.length > 191
      )
        throw new BillingError(
          "Choose a billing request and its provider session ID",
          400,
        );
      return NextResponse.json(
        await reconcileBusinessCheckout(
          user.business.id,
          body.id,
          body.sessionId,
          body.action === "expire",
        ),
      );
    }
    if (body.action === "refresh") {
      const stored = await prisma.businessSubscription.findUnique({
        where: { businessId: user.business.id },
      });
      if (stored?.stripeSubscriptionId)
        await syncBusinessSubscription(stored.stripeSubscriptionId);
      return NextResponse.json({ refreshed: !!stored?.stripeSubscriptionId });
    }
    if (
      !body ||
      typeof body.plan !== "string" ||
      !Object.hasOwn(SUBSCRIPTION_PRICING, body.plan)
    )
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    return NextResponse.json(
      await beginBusinessBilling(
        user.business.id,
        user.email,
        body.plan as SubscriptionPlan,
        request.headers.get("Idempotency-Key") || "",
        user.id,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof BillingError || error instanceof OperationError
            ? error.message
            : "Billing could not complete. Your plan has not been changed; retry later.",
      },
      {
        status:
          error instanceof BillingError || error instanceof OperationError
            ? error.status
            : 503,
      },
    );
  }
}
export const PUT = POST;
export async function DELETE(request: NextRequest) {
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ plan: "STARTER" }),
    }),
  );
}
