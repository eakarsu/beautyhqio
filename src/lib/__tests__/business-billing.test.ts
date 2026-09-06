import Stripe from "stripe";
import {
  beginBusinessBilling,
  subscriptionState,
  syncBusinessSubscription,
} from "../business-billing";
import { prisma } from "../prisma";
import { stripe } from "../stripe";
jest.mock("../prisma", () => ({
  prisma: {
    businessSubscription: { upsert: jest.fn() },
    businessBillingAttempt: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("../stripe", () => ({
  stripe: {
    customers: { create: jest.fn() },
    subscriptions: { retrieve: jest.fn(), list: jest.fn() },
    checkout: { sessions: { list: jest.fn(), create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
  },
}));
const provider = stripe as unknown as {
  customers: { create: jest.Mock };
  subscriptions: { retrieve: jest.Mock; list: jest.Mock };
  checkout: { sessions: { list: jest.Mock; create: jest.Mock } };
  billingPortal: { sessions: { create: jest.Mock } };
};
const stored = {
  id: "billing-row",
  businessId: "salon",
  stripeCustomerId: "cus_salon",
  stripeSubscriptionId: null,
};
const tx = {
  user: { findFirst: jest.fn() },
  businessBillingAttempt: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  auditLog: { create: jest.fn() },
  $queryRaw: jest.fn(),
  businessSubscription: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};
function subscription(status = "active", invoiceStatus = "paid") {
  return {
    id: "sub_current",
    customer: "cus_salon",
    metadata: { type: "business_subscription", businessId: "salon" },
    status,
    latest_invoice: {
      status: invoiceStatus,
      lines: {
        data: [
          {
            quantity: 1,
            amount: 4900,
            currency: "usd",
            period: {
              start: Math.floor(Date.now() / 1000) - 1000,
              end: Math.floor(Date.now() / 1000) + 100000,
            },
            pricing: { price_details: { price: "price_growth" } },
          },
        ],
      },
    },
    items: {
      data: [
        {
          quantity: 1,
          current_period_start: Math.floor(Date.now() / 1000) - 1000,
          current_period_end: Math.floor(Date.now() / 1000) + 100000,
          price: {
            id: "price_growth",
            unit_amount: 4900,
            currency: "usd",
            recurring: { interval: "month", interval_count: 1 },
          },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}
beforeEach(() => {
  jest.clearAllMocks();
  tx.user.findFirst.mockResolvedValue({ id: "owner" });
  tx.businessBillingAttempt.findUnique.mockResolvedValue(null);
  tx.businessBillingAttempt.findFirst.mockResolvedValue(null);
  tx.businessBillingAttempt.create.mockResolvedValue({
    id: "attempt-one",
    plan: "GROWTH",
    status: "PENDING",
    createdAt: new Date(),
  });
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_inspection_fixture";
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(tx));
  tx.businessSubscription.findUniqueOrThrow.mockResolvedValue({ ...stored });
  tx.businessSubscription.findUnique.mockResolvedValue({ ...stored });
  tx.businessSubscription.update.mockResolvedValue(stored);
  provider.subscriptions.list.mockResolvedValue({ data: [] });
  provider.checkout.sessions.list.mockResolvedValue({ data: [] });
  provider.checkout.sessions.create.mockResolvedValue({
    url: "https://checkout.stripe.com/test",
  });
});
test("paid plan requires active subscription and paid invoice with exact plan price", () => {
  expect(subscriptionState(subscription())).toMatchObject({
    plan: "GROWTH",
    status: "ACTIVE",
    monthlyPrice: 49,
  });
  for (const status of [
    "incomplete",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
    "canceled",
  ])
    expect(subscriptionState(subscription(status)).plan).toBe("STARTER");
  expect(subscriptionState(subscription("active", "open")).plan).toBe(
    "STARTER",
  );
  const sub = subscription();
  sub.items.data[0].quantity = 2;
  expect(subscriptionState(sub).plan).toBe("STARTER");
});
test("checkout returns the actual Stripe URL without granting a paid plan", async () => {
  expect(
    await beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "billing-retry-key",
      "owner",
    ),
  ).toMatchObject({
    url: "https://checkout.stripe.com/test",
    mode: "checkout",
  });
  expect(provider.checkout.sessions.create).toHaveBeenCalledWith(
    expect.objectContaining({ mode: "subscription", customer: "cus_salon" }),
    { idempotencyKey: "business-checkout:attempt-one" },
  );
  expect(
    tx.businessSubscription.update.mock.calls.some(
      ([request]) => request.data.plan === "GROWTH",
    ),
  ).toBe(false);
});
test("open checkout is reused and a conflicting plan cannot cause a second charge", async () => {
  provider.checkout.sessions.list.mockResolvedValue({
    data: [
      {
        url: "https://checkout.stripe.com/existing",
        metadata: { type: "business_subscription", plan: "GROWTH" },
      },
    ],
  });
  expect(
    await beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "billing-retry-key",
      "owner",
    ),
  ).toMatchObject({ url: "https://checkout.stripe.com/existing" });
  await expect(
    beginBusinessBilling(
      "salon",
      "owner@example.test",
      "PRO",
      "billing-retry-key",
      "owner",
    ),
  ).rejects.toThrow("open checkout");
  expect(provider.checkout.sessions.create).not.toHaveBeenCalled();
});
test("existing subscription sends owner to real provider management", async () => {
  tx.businessSubscription.findUniqueOrThrow.mockResolvedValue({
    ...stored,
    stripeSubscriptionId: "sub_current",
  });
  provider.subscriptions.retrieve.mockResolvedValue(subscription());
  provider.billingPortal.sessions.create.mockResolvedValue({
    url: "https://billing.stripe.com/test",
  });
  expect(
    await beginBusinessBilling(
      "salon",
      "owner@example.test",
      "STARTER",
      "billing-retry-key",
      "owner",
    ),
  ).toMatchObject({ mode: "manage" });
  expect(tx.businessSubscription.update).not.toHaveBeenCalled();
});
test("webhook sync retrieves current state and rejects customer mismatch", async () => {
  provider.subscriptions.retrieve.mockResolvedValue(subscription());
  await syncBusinessSubscription("sub_current");
  expect(tx.businessSubscription.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        plan: "GROWTH",
        stripeSubscriptionId: "sub_current",
      }),
    }),
  );
  tx.businessSubscription.findUnique.mockResolvedValue({
    ...stored,
    stripeCustomerId: "different",
  });
  await expect(syncBusinessSubscription("sub_current")).rejects.toThrow(
    "customer",
  );
});
test("events for an old subscription cannot overwrite its replacement", async () => {
  tx.businessSubscription.findUnique.mockResolvedValue({
    ...stored,
    stripeSubscriptionId: "sub_replacement",
  });
  provider.subscriptions.retrieve.mockResolvedValue(subscription("canceled"));
  await syncBusinessSubscription("sub_current");
  expect(tx.businessSubscription.update).not.toHaveBeenCalled();
});

test("a paid old plan invoice cannot activate an unpaid upgrade", () => {
  const sub = subscription();
  sub.items.data[0].price.id = "price_pro";
  sub.items.data[0].price.unit_amount = 14900;
  expect(subscriptionState(sub).plan).toBe("STARTER");
});
test("checkout requires webhook configuration before accepting a subscription", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await expect(
    beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "billing-retry-key",
      "owner",
    ),
  ).rejects.toThrow("signed webhook");
  expect(provider.checkout.sessions.create).not.toHaveBeenCalled();
});

test("changed retry details and inactive owners cannot start checkout", async () => {
  tx.businessBillingAttempt.findUnique.mockResolvedValue({
    plan: "PRO",
    createdById: "owner",
  });
  await expect(
    beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "billing-retry-key",
      "owner",
    ),
  ).rejects.toThrow("Retry key");
  expect(provider.checkout.sessions.create).not.toHaveBeenCalled();
  tx.user.findFirst.mockResolvedValue(null);
  await expect(
    beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "another-retry-key",
      "owner",
    ),
  ).rejects.toThrow("current business owner");
});
test("an uncertain old request is held beyond the provider retry window", async () => {
  tx.businessBillingAttempt.findUnique.mockResolvedValue({
    id: "unknown",
    plan: "GROWTH",
    createdById: "owner",
    status: "UNKNOWN",
    createdAt: new Date(Date.now() - 24 * 3600000),
  });
  await expect(
    beginBusinessBilling(
      "salon",
      "owner@example.test",
      "GROWTH",
      "billing-retry-key",
      "owner",
    ),
  ).rejects.toThrow("retry window");
  expect(provider.checkout.sessions.create).not.toHaveBeenCalled();
});

test("expired paid periods and unsupported currencies do not grant paid entitlement", () => {
  const sub = subscription();
  sub.items.data[0].current_period_end = Math.floor(Date.now() / 1000) - 1;
  expect(subscriptionState(sub).plan).toBe("STARTER");
  const other = subscription();
  other.items.data[0].price.currency = "eur";
  expect(subscriptionState(other).plan).toBe("STARTER");
});
