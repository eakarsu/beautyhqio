import Stripe from "stripe";
import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { COMMISSION_RATES, SUBSCRIPTION_PRICING } from "./commission";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export class BillingError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export function billingOrigin() {
  if (!process.env.NEXTAUTH_URL)
    throw new BillingError(
      "Configure NEXTAUTH_URL before starting billing",
      503,
    );
  const url = new URL(process.env.NEXTAUTH_URL);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  )
    throw new BillingError("Billing return URL must use HTTPS", 503);
  return url.origin;
}
export function subscriptionState(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const price = item?.price;
  const plan = (Object.keys(SUBSCRIPTION_PRICING) as SubscriptionPlan[]).find(
    (key) =>
      key !== "STARTER" &&
      price?.unit_amount === SUBSCRIPTION_PRICING[key] * 100,
  );
  const invoice =
    typeof subscription.latest_invoice === "object"
      ? subscription.latest_invoice
      : null;
  const paidLine = invoice?.lines?.data.some((line) => {
    const ref = line.pricing?.price_details?.price;
    const priceId = typeof ref === "string" ? ref : ref?.id;
    return (
      priceId === price?.id &&
      line.quantity === 1 &&
      line.amount >= 0 &&
      line.currency === "usd" &&
      line.period.end >= item.current_period_end &&
      line.period.start < item.current_period_end
    );
  });
  const paid =
    subscription.status === "active" &&
    invoice?.status === "paid" &&
    paidLine &&
    item.current_period_start <= Math.floor(Date.now() / 1000) &&
    item.current_period_end > Math.floor(Date.now() / 1000);
  const validPlan =
    plan &&
    subscription.items.data.length === 1 &&
    item.quantity === 1 &&
    price.currency === "usd" &&
    price.recurring?.interval === "month" &&
    price.recurring.interval_count === 1;
  const entitledPlan: SubscriptionPlan = paid && validPlan ? plan : "STARTER";
  const status: SubscriptionStatus =
    entitledPlan !== "STARTER"
      ? "ACTIVE"
      : subscription.status === "canceled" ||
          subscription.status === "incomplete_expired"
        ? "CANCELLED"
        : "PAST_DUE";
  return {
    plan: entitledPlan,
    status,
    monthlyPrice: SUBSCRIPTION_PRICING[entitledPlan],
    marketplaceCommissionPct: COMMISSION_RATES[entitledPlan],
    currentPeriodStart: item?.current_period_start
      ? new Date(item.current_period_start * 1000)
      : null,
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null,
    cancelledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
  };
}

// Retrieve current provider state inside the per-business lock. Delayed events cannot
// restore an old paid plan or cancel a newer subscription.
export async function syncBusinessSubscription(
  id: string,
  client: Stripe | null = stripe,
) {
  if (!client) throw new BillingError("Stripe is not configured", 503);
  const hint = await client.subscriptions.retrieve(id);
  if (
    hint.metadata.type !== "business_subscription" ||
    !hint.metadata.businessId
  )
    return false;
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "BusinessSubscription" WHERE "businessId" = ${hint.metadata.businessId} FOR UPDATE`;
      const stored = await tx.businessSubscription.findUnique({
        where: { businessId: hint.metadata.businessId },
      });
      const sub = await client.subscriptions.retrieve(id, {
        expand: ["latest_invoice"],
      });
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (!stored || stored.stripeCustomerId !== customerId)
        throw new BillingError(
          "Subscription customer does not match this business",
        );
      if (stored.stripeSubscriptionId && stored.stripeSubscriptionId !== id)
        return;
      if (
        !stored.stripeSubscriptionId &&
        ["canceled", "incomplete_expired"].includes(sub.status)
      )
        return;
      const state = subscriptionState(sub);
      await tx.businessSubscription.update({
        where: { id: stored.id },
        data: { ...state, stripeSubscriptionId: id },
      });
    },
    { timeout: 30000 },
  );
  return true;
}

async function beginBillingProvider(
  businessId: string,
  email: string,
  plan: SubscriptionPlan,
  attemptId: string,
  stripe: Stripe | null,
) {
  if (!Object.hasOwn(SUBSCRIPTION_PRICING, plan))
    throw new BillingError("Invalid plan", 400);
  await prisma.businessSubscription.upsert({
    where: { businessId },
    create: {
      businessId,
      plan: "STARTER",
      status: "ACTIVE",
      monthlyPrice: 0,
      marketplaceCommissionPct: COMMISSION_RATES.STARTER,
    },
    update: {},
  });
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "BusinessSubscription" WHERE "businessId" = ${businessId} FOR UPDATE`;
      const stored = await tx.businessSubscription.findUniqueOrThrow({
        where: { businessId },
      });
      if (!stored.stripeSubscriptionId && plan === "STARTER") {
        const subscription = await tx.businessSubscription.update({
          where: { id: stored.id },
          data: {
            plan: "STARTER",
            status: "ACTIVE",
            monthlyPrice: 0,
            marketplaceCommissionPct: COMMISSION_RATES.STARTER,
          },
        });
        return { subscription };
      }
      if (!stripe)
        throw new BillingError(
          "Stripe is not configured. Paid plans have not been activated.",
          503,
        );
      const origin = billingOrigin();
      let customerId = stored.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create(
          { email, metadata: { businessId, type: "business_subscription" } },
          { idempotencyKey: `business-customer:${stored.id}` },
        );
        customerId = customer.id;
        await tx.businessSubscription.update({
          where: { id: stored.id },
          data: { stripeCustomerId: customerId },
        });
      }
      if (stored.stripeSubscriptionId) {
        const current = await stripe.subscriptions.retrieve(
          stored.stripeSubscriptionId,
        );
        if (!["canceled", "incomplete_expired"].includes(current.status)) {
          const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/subscription`,
          });
          return { url: portal.url, mode: "manage" };
        }
      }
      if (plan === "STARTER") {
        const subscription = await tx.businessSubscription.update({
          where: { id: stored.id },
          data: {
            plan: "STARTER",
            status: "ACTIVE",
            monthlyPrice: 0,
            marketplaceCommissionPct: COMMISSION_RATES.STARTER,
          },
        });
        return { subscription };
      }
      if (!process.env.STRIPE_WEBHOOK_SECRET)
        throw new BillingError(
          "Configure STRIPE_WEBHOOK_SECRET before accepting a paid subscription",
          503,
        );
      const active = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      if (
        active.data.some(
          (sub) => !["canceled", "incomplete_expired"].includes(sub.status),
        )
      )
        throw new BillingError(
          "A subscription already exists. Wait for billing to synchronize before trying again.",
        );
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        status: "open",
        limit: 100,
      });
      const existing = sessions.data.find(
        (session) => session.metadata?.type === "business_subscription",
      );
      if (existing) {
        if (existing.metadata?.plan !== plan)
          throw new BillingError(
            "Finish or expire your open checkout before selecting a different plan.",
          );
        return { url: existing.url, sessionId: existing.id, mode: "checkout" };
      }
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          customer: customerId,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: SUBSCRIPTION_PRICING[plan] * 100,
                recurring: { interval: "month" },
                product_data: { name: `BeautyHQ ${plan}` },
              },
            },
          ],
          metadata: {
            businessId,
            plan,
            type: "business_subscription",
            billingAttemptId: attemptId,
          },
          subscription_data: {
            metadata: {
              businessId,
              plan,
              type: "business_subscription",
              billingAttemptId: attemptId,
            },
          },
          success_url: `${origin}/subscription?checkout=complete`,
          cancel_url: `${origin}/subscription?checkout=cancelled`,
        },
        { idempotencyKey: `business-checkout:${attemptId}` },
      );
      if (!session.url)
        throw new BillingError("Stripe did not return a checkout URL", 502);
      // Allow the replacement's signed webhook to bind after a cancelled subscription.
      await tx.businessSubscription.update({
        where: { id: stored.id },
        data: { stripeSubscriptionId: null },
      });
      return { url: session.url, sessionId: session.id, mode: "checkout" };
    },
    { timeout: 30000 },
  );
}

export async function beginBusinessBilling(
  businessId: string,
  email: string,
  plan: SubscriptionPlan,
  requestKey: string,
  actorId: string,
  client: Stripe | null = stripe,
) {
  if (!Object.hasOwn(SUBSCRIPTION_PRICING, plan))
    throw new BillingError("Invalid plan", 400);
  if (!/^[\w][\w.:-]{7,127}$/.test(requestKey))
    throw new BillingError(
      "A stable 8–128 character retry key is required",
      422,
    );
  if (plan !== "STARTER" && (!client || !process.env.STRIPE_WEBHOOK_SECRET))
    throw new BillingError(
      "Configure Stripe and its signed webhook before accepting a paid subscription",
      503,
    );
  billingOrigin();
  const attempt = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${businessId}, 0))::text`;
    const actor = await tx.user.findFirst({
      where: { id: actorId, businessId, role: "OWNER", isActive: true },
    });
    if (!actor)
      throw new BillingError(
        "Only the current business owner can manage billing",
        403,
      );
    const prior = await tx.businessBillingAttempt.findUnique({
      where: { businessId_requestKey: { businessId, requestKey } },
    });
    if (prior) {
      if (prior.plan !== plan || prior.createdById !== actorId)
        throw new BillingError(
          "Retry key was reused with different billing details",
        );
      return prior;
    }
    const active = await tx.businessBillingAttempt.findFirst({
      where: { businessId, status: { in: ["PENDING", "UNKNOWN", "OPEN"] } },
    });
    if (active) {
      if (active.plan !== plan)
        throw new BillingError(
          "Reconcile or expire the current checkout before choosing another plan",
        );
      return active;
    }
    const row = await tx.businessBillingAttempt.create({
      data: { businessId, requestKey, plan, createdById: actorId },
    });
    await tx.auditLog.create({
      data: {
        businessId,
        userId: actorId,
        action: "BUSINESS_BILLING_REQUESTED",
        entityType: "BusinessBillingAttempt",
        entityId: row.id,
        changes: { plan },
      },
    });
    return row;
  });
  if (attempt.providerSessionId) {
    if (!client) throw new BillingError("Stripe is not configured", 503);
    const session = await client.checkout.sessions.retrieve(
      attempt.providerSessionId,
    );
    if (session.status === "open" && session.url)
      return { url: session.url, mode: "checkout", attemptId: attempt.id };
    await reconcileBusinessCheckout(
      businessId,
      attempt.id,
      session.id,
      false,
      client,
    );
    return { mode: "reconciled", attemptId: attempt.id };
  }
  if (attempt.status === "COMPLETE")
    return { mode: "complete", attemptId: attempt.id };
  if (["EXPIRED", "FAILED"].includes(attempt.status))
    throw new BillingError(
      "This request is closed. Start a new request after reviewing its outcome",
    );
  if (attempt.createdAt.getTime() < Date.now() - 23 * 3600000)
    throw new BillingError(
      "The retry window elapsed. Reconcile using the Stripe checkout session ID; no new checkout was created",
    );
  try {
    const result = await beginBillingProvider(
      businessId,
      email,
      plan,
      attempt.id,
      client,
    );
    await prisma.businessBillingAttempt.updateMany({
      where: { id: attempt.id, status: { in: ["PENDING", "UNKNOWN"] } },
      data: {
        status: result.mode === "checkout" ? "OPEN" : "COMPLETE",
        providerSessionId: result.sessionId || null,
        lastError: null,
      },
    });
    return { ...result, attemptId: attempt.id };
  } catch (error) {
    await prisma.businessBillingAttempt.updateMany({
      where: { id: attempt.id, status: "PENDING" },
      data: {
        status: error instanceof BillingError ? "FAILED" : "UNKNOWN",
        lastError:
          error instanceof BillingError
            ? error.message
            : "Provider outcome unknown; retry the same request or reconcile its session ID",
      },
    });
    throw error;
  }
}
export async function reconcileBusinessCheckout(
  businessId: string,
  attemptId: string,
  sessionId: string,
  expire = false,
  client: Stripe | null = stripe,
) {
  if (!client) throw new BillingError("Stripe is not configured", 503);
  const row = await prisma.businessBillingAttempt.findFirst({
    where: { id: attemptId, businessId },
  });
  if (!row) throw new BillingError("Billing request not found", 404);
  let session = await client.checkout.sessions.retrieve(sessionId);
  const stored = await prisma.businessSubscription.findUnique({
      where: { businessId },
    }),
    customer =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
  if (
    !stored?.stripeCustomerId ||
    customer !== stored.stripeCustomerId ||
    session.metadata?.businessId !== businessId ||
    session.metadata.type !== "business_subscription" ||
    session.metadata.plan !== row.plan ||
    session.mode !== "subscription" ||
    (row.providerSessionId && row.providerSessionId !== session.id) ||
    (session.metadata.billingAttemptId &&
      session.metadata.billingAttemptId !== row.id)
  )
    throw new BillingError(
      "Provider checkout does not match this billing request",
    );
  if (expire && session.status === "open")
    session = await client.checkout.sessions.expire(session.id);
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (session.status === "complete" && subscriptionId)
    await syncBusinessSubscription(subscriptionId, client);
  await prisma.businessBillingAttempt.update({
    where: { id: row.id },
    data: {
      status:
        session.status === "complete"
          ? "COMPLETE"
          : session.status === "expired"
            ? "EXPIRED"
            : "OPEN",
      providerSessionId: session.id,
      providerSubscriptionId: subscriptionId || null,
      lastError: null,
    },
  });
  return {
    id: row.id,
    status: session.status,
    subscriptionId: subscriptionId || null,
  };
}

export function effectiveSubscription<
  T extends {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Date | null;
  },
>(row: T) {
  if (row.plan === "STARTER")
    return {
      ...row,
      ...(!row.stripeSubscriptionId?{status:"ACTIVE" as SubscriptionStatus,currentPeriodStart:null,currentPeriodEnd:null,trialEndsAt:null}:{}),
      monthlyPrice: 0,
      marketplaceCommissionPct: COMMISSION_RATES.STARTER,
    };
  if (
    row.status === "ACTIVE" &&
    row.stripeCustomerId &&
    row.stripeSubscriptionId &&
    row.currentPeriodEnd &&
    row.currentPeriodEnd > new Date()
  )
    return row;
  return {
    ...row,
    plan: "STARTER" as SubscriptionPlan,
    status:
      row.status === "CANCELLED"
        ? ("CANCELLED" as SubscriptionStatus)
        : ("PAST_DUE" as SubscriptionStatus),
    monthlyPrice: 0,
    marketplaceCommissionPct: COMMISSION_RATES.STARTER,
  };
}
