/**
 * Paid-plan activation.
 *
 * `TOP20.md` launch condition for rank 2: *"Repair paid-plan activation and
 * validate deployment"*. The break was that subscriptions were readable
 * (`/api/admin/subscriptions`, GET only) and the Stripe webhook handled
 * `checkout.session.completed`, but **nothing created the checkout session** —
 * so a salon could never actually activate a paid plan.
 *
 * This provides the missing half:
 *   POST /api/stripe/plan/activate   start activation (trial, or paid checkout)
 *   GET  /api/stripe/plan/status     where the activation stands
 *
 * Rules that make this safe to sell on:
 *   - activating never silently overwrites a live paid subscription
 *   - a paid activation always goes through Stripe Checkout, so the money is
 *     taken by the provider and confirmed by the signed webhook
 *   - the response states the activation state machine explicitly
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";

/** Allowed transitions for a business subscription. */
// Keys must match the SubscriptionStatus enum values stored in the database
// (ACTIVE | PAST_DUE | CANCELLED | TRIAL). With lowercase keys every lookup
// returned undefined and no transition was ever allowed.
const FLOW: Record<string, string[]> = {
  none: ['TRIAL', 'PAST_DUE'],        // business has no subscription yet
  TRIAL: ['ACTIVE', 'PAST_DUE', 'CANCELLED'],
  PAST_DUE: ['ACTIVE', 'CANCELLED', 'TRIAL'],
  ACTIVE: ['CANCELLED', 'PAST_DUE'],
  CANCELLED: ['TRIAL', 'PAST_DUE'],
};

export async function GET(request: Request) {
  try {
    const auth = await requireRoles(["PLATFORM_ADMIN", "OWNER", "MANAGER"]);
    if (auth instanceof NextResponse) return auth;

    const businessId = (auth as any).businessId ?? (auth as any).user?.businessId;
    const sub = businessId
      ? await prisma.businessSubscription.findFirst({
          where: { businessId },
          orderBy: { createdAt: "desc" },
        })
      : null;

    return NextResponse.json({
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            monthlyPrice: sub.monthlyPrice,
            billingCycle: sub.billingCycle,
            trialEndsAt: sub.trialEndsAt ?? null,
            currentPeriodEnd: sub.currentPeriodEnd ?? null,
          }
        : null,
      paid: !!sub && sub.status === "ACTIVE" && (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()),
      allowedTransitions: sub ? (FLOW[sub.status] ?? []) : FLOW.none,
      flow: FLOW,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Request failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRoles(["PLATFORM_ADMIN", "OWNER"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const businessId = (auth as any).businessId ?? body.businessId;
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const mode = String(body.mode ?? "trial"); // "trial" | "checkout"
    const PLANS = ["STARTER", "GROWTH", "PRO"] as const;
    const rawPlan = String(body.plan ?? "STARTER").toUpperCase();
    const plan = (PLANS as readonly string[]).includes(rawPlan) ? (rawPlan as any) : "STARTER";
    if (!(PLANS as readonly string[]).includes(rawPlan)) {
      return NextResponse.json({ error: `plan must be one of: ${PLANS.join(", ")}` }, { status: 400 });
    }
    const billingCycle = body.billingCycle === "annual" ? "annual" : "monthly";
    const trialDays = Number(body.trialDays ?? 14);

    if (!["trial", "checkout"].includes(mode)) {
      return NextResponse.json({ error: 'mode must be "trial" or "checkout"' }, { status: 400 });
    }
    if (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 90) {
      return NextResponse.json({ error: "trialDays must be between 1 and 90" }, { status: 400 });
    }

    const existing = await prisma.businessSubscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
    const current = existing?.status ?? "none";

    // Never clobber a live paid subscription.
    if (current === "ACTIVE" && existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date()) {
      return NextResponse.json(
        {
          error: "This business already has an active paid subscription.",
          subscription: { plan: existing.plan, status: existing.status, currentPeriodEnd: existing.currentPeriodEnd },
          allowedTransitions: FLOW.active,
        },
        { status: 409 },
      );
    }

    const next = mode === "trial" ? "TRIAL" : "PAST_DUE";
    if (!(FLOW[current] ?? []).includes(next)) {
      return NextResponse.json(
        { error: `Cannot move a subscription from "${current}" to "${next}"`, allowedTransitions: FLOW[current] ?? [] },
        { status: 409 },
      );
    }

    /* ------------------------- trial activation ------------------------ */
    if (mode === "trial") {
      const trialEndsAt = new Date(Date.now() + trialDays * 86_400_000);
      const sub = await prisma.businessSubscription.upsert({
        where: { businessId },
        create: {
          businessId,
          plan,
          status: "TRIAL",
          billingCycle,
          trialEndsAt,
          monthlyPrice: body.monthlyPrice ?? 0,
        },
        update: {
          plan,
          status: "TRIAL",
          billingCycle,
          trialEndsAt,
          monthlyPrice: body.monthlyPrice ?? 0,
        },
      });

      return NextResponse.json({
        activated: true,
        mode: "trial",
        subscription: {
          plan: sub.plan,
          status: sub.status,
          trialEndsAt: sub.trialEndsAt,
          monthlyPrice: sub.monthlyPrice,
          billingCycle: sub.billingCycle,
        },
        note: `Trial active until ${trialEndsAt.toISOString().slice(0, 10)}. No payment is taken during a trial.`,
        nextStep: "Convert to paid with mode: \"checkout\" before the trial ends.",
      });
    }

    /* --------------------- paid checkout activation -------------------- */
    // A paid activation must run through the provider. Without Stripe keys we
    // record the intent and say so — we never mark a plan active without the
    // provider confirming payment via the signed webhook.
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        {
          activated: false,
          mode: "checkout",
          state: "PAST_DUE",
          error:
            "Stripe is not configured (STRIPE_SECRET_KEY missing), so no checkout session could be created. " +
            "A plan is never marked active without provider confirmation.",
        },
        { status: 503 },
      );
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secret, { apiVersion: "2025-12-15.clover" as any });

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Reuse the stored customer, or create one.
    let customerId = business.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: business.name ?? undefined,
        email: business.email ?? undefined,
        metadata: { businessId: String(businessId) },
      });
      customerId = customer.id;
      await prisma.business.update({ where: { id: businessId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: String(body.priceId), quantity: 1 }],
      success_url: String(body.successUrl ?? "/settings/billing?activation=success"),
      cancel_url: String(body.cancelUrl ?? "/settings/billing?activation=cancelled"),
      metadata: { businessId: String(businessId), plan, billingCycle },
      subscription_data: { metadata: { businessId: String(businessId), plan } },
    });

    const sub = await prisma.businessSubscription.upsert({
      where: { businessId },
      create: {
        businessId,
        plan,
        status: "PAST_DUE",
        billingCycle,
        monthlyPrice: body.monthlyPrice ?? 0,
      },
      update: { plan, status: "PAST_DUE", billingCycle },
    });

    return NextResponse.json(
      {
        activated: false,
        mode: "checkout",
        state: "PAST_DUE",
        subscription: {
          plan: sub.plan,
          status: sub.status,
          billingCycle: sub.billingCycle,
        },
        checkoutUrl: session.url,
        sessionId: session.id,
        note:
          "Redirect the customer to checkoutUrl. The subscription becomes active only when Stripe " +
          "posts checkout.session.completed to the webhook — this endpoint never marks a plan active itself.",
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Activation failed" }, { status: 500 });
  }
}