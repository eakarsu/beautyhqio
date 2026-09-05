import Stripe from "stripe";
import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { COMMISSION_RATES, SUBSCRIPTION_PRICING } from "./commission";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export class BillingError extends Error { constructor(message: string, public status = 409) { super(message); } }
export function billingOrigin() {
  if (!process.env.NEXTAUTH_URL) throw new BillingError("Configure NEXTAUTH_URL before starting billing", 503);
  const url = new URL(process.env.NEXTAUTH_URL);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new BillingError("Billing return URL must use HTTPS", 503);
  return url.origin;
}
export function subscriptionState(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const price = item?.price;
  const plan = (Object.keys(SUBSCRIPTION_PRICING) as SubscriptionPlan[]).find(key => key !== "STARTER" && price?.unit_amount === SUBSCRIPTION_PRICING[key] * 100);
  const invoice = typeof subscription.latest_invoice === "object" ? subscription.latest_invoice : null;
  const paidLine = invoice?.lines?.data.some(line => {
    const ref = line.pricing?.price_details?.price;
    const priceId = typeof ref === "string" ? ref : ref?.id;
    return priceId === price?.id && line.quantity === 1 && line.amount >= 0 && line.currency === "usd" && line.period.end >= item.current_period_end && line.period.start < item.current_period_end;
  });
  const paid = subscription.status === "active" && invoice?.status === "paid" && paidLine;
  const validPlan = plan && subscription.items.data.length === 1 && item.quantity === 1 && price.currency === "usd" && price.recurring?.interval === "month" && price.recurring.interval_count === 1;
  const entitledPlan: SubscriptionPlan = paid && validPlan ? plan : "STARTER";
  const status: SubscriptionStatus = entitledPlan !== "STARTER" ? "ACTIVE" : subscription.status === "canceled" || subscription.status === "incomplete_expired" ? "CANCELLED" : "PAST_DUE";
  return { plan: entitledPlan, status, monthlyPrice: SUBSCRIPTION_PRICING[entitledPlan], marketplaceCommissionPct: COMMISSION_RATES[entitledPlan],
    currentPeriodStart: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null };
}

// Retrieve current provider state inside the per-business lock. Delayed events cannot
// restore an old paid plan or cancel a newer subscription.
export async function syncBusinessSubscription(id: string) {
  if (!stripe) throw new BillingError("Stripe is not configured", 503);
  const client = stripe;
  const hint = await client.subscriptions.retrieve(id);
  if (hint.metadata.type !== "business_subscription" || !hint.metadata.businessId) return false;
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "BusinessSubscription" WHERE "businessId" = ${hint.metadata.businessId} FOR UPDATE`;
    const stored = await tx.businessSubscription.findUnique({ where: { businessId: hint.metadata.businessId } });
    const sub = await client.subscriptions.retrieve(id, { expand: ["latest_invoice"] });
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    if (!stored || stored.stripeCustomerId !== customerId) throw new BillingError("Subscription customer does not match this business");
    if (stored.stripeSubscriptionId && stored.stripeSubscriptionId !== id) return;
    if (!stored.stripeSubscriptionId && ["canceled", "incomplete_expired"].includes(sub.status)) return;
    const state = subscriptionState(sub);
    await tx.businessSubscription.update({ where: { id: stored.id }, data: { ...state, stripeSubscriptionId: id } });
  }, { timeout: 30000 });
  return true;
}

export async function beginBusinessBilling(businessId: string, email: string, plan: SubscriptionPlan) {
  if (!Object.hasOwn(SUBSCRIPTION_PRICING, plan)) throw new BillingError("Invalid plan", 400);
  await prisma.businessSubscription.upsert({ where: { businessId }, create: { businessId, plan: "STARTER", status: "ACTIVE", monthlyPrice: 0, marketplaceCommissionPct: COMMISSION_RATES.STARTER }, update: {} });
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "BusinessSubscription" WHERE "businessId" = ${businessId} FOR UPDATE`;
    const stored = await tx.businessSubscription.findUniqueOrThrow({ where: { businessId } });
    if (!stored.stripeSubscriptionId && plan === "STARTER") {
      const subscription = await tx.businessSubscription.update({ where: { id: stored.id }, data: { plan: "STARTER", status: "ACTIVE", monthlyPrice: 0, marketplaceCommissionPct: COMMISSION_RATES.STARTER } });
      return { subscription };
    }
    if (!stripe) throw new BillingError("Stripe is not configured. Paid plans have not been activated.", 503);
    const origin = billingOrigin();
    let customerId = stored.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { businessId, type: "business_subscription" } }, { idempotencyKey: `business-customer:${stored.id}` });
      customerId = customer.id;
      await tx.businessSubscription.update({ where: { id: stored.id }, data: { stripeCustomerId: customerId } });
    }
    if (stored.stripeSubscriptionId) {
      const current = await stripe.subscriptions.retrieve(stored.stripeSubscriptionId);
      if (!["canceled", "incomplete_expired"].includes(current.status)) {
        const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/subscription` });
        return { url: portal.url, mode: "manage" };
      }
    }
    if (plan === "STARTER") {
      const subscription = await tx.businessSubscription.update({ where: { id: stored.id }, data: { plan: "STARTER", status: "ACTIVE", monthlyPrice: 0, marketplaceCommissionPct: COMMISSION_RATES.STARTER } });
      return { subscription };
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new BillingError("Configure STRIPE_WEBHOOK_SECRET before accepting a paid subscription", 503);
    const active = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    if (active.data.some(sub => !["canceled", "incomplete_expired"].includes(sub.status))) throw new BillingError("A subscription already exists. Wait for billing to synchronize before trying again.");
    const sessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
    const existing = sessions.data.find(session => session.metadata?.type === "business_subscription");
    if (existing) {
      if (existing.metadata?.plan !== plan) throw new BillingError("Finish or expire your open checkout before selecting a different plan.");
      return { url: existing.url, mode: "checkout" };
    }
    const session = await stripe.checkout.sessions.create({ mode: "subscription", customer: customerId,
      line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: SUBSCRIPTION_PRICING[plan] * 100, recurring: { interval: "month" }, product_data: { name: `BeautyHQ ${plan}` } } }],
      metadata: { businessId, plan, type: "business_subscription" }, subscription_data: { metadata: { businessId, plan, type: "business_subscription" } },
      success_url: `${origin}/subscription?checkout=complete`, cancel_url: `${origin}/subscription?checkout=cancelled` });
    if (!session.url) throw new BillingError("Stripe did not return a checkout URL", 502);
    // Allow the replacement's signed webhook to bind after a cancelled subscription.
    await tx.businessSubscription.update({ where: { id: stored.id }, data: { stripeSubscriptionId: null } });
    return { url: session.url, mode: "checkout" };
  }, { timeout: 30000 });
}
