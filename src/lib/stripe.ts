// Stripe Payment Integration
import Stripe from "stripe";

// Only initialize Stripe if the API key is provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

export interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

// Create a payment intent for processing payments
export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const stripeClient = ensureStripe();
  const { amount, currency = "usd", customerId, metadata, description } = params;

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    description,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

// Create a Stripe customer
export async function createCustomer(params: CreateCustomerParams) {
  const stripeClient = ensureStripe();
  const { email, name, phone, metadata } = params;

  const customer = await stripeClient.customers.create({
    email,
    name,
    phone,
    metadata,
  });

  return customer;
}

// Get or create a Stripe customer
export async function getOrCreateCustomer(
  email: string,
  name: string,
  phone?: string
) {
  const stripeClient = ensureStripe();

  // Check if customer exists
  const existingCustomers = await stripeClient.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return createCustomer({ email, name, phone });
}

// Retrieve a payment intent
export async function getPaymentIntent(paymentIntentId: string) {
  const stripeClient = ensureStripe();
  return stripeClient.paymentIntents.retrieve(paymentIntentId);
}

// Confirm a payment intent
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
) {
  const stripeClient = ensureStripe();
  return stripeClient.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
}

// Create a refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
) {
  const stripeClient = ensureStripe();
  return stripeClient.refunds.create({
    payment_intent: paymentIntentId,
    amount, // If undefined, full refund
    reason,
  });
}

// List payment methods for a customer
export async function listPaymentMethods(customerId: string) {
  const stripeClient = ensureStripe();
  return stripeClient.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
}

// Attach a payment method to a customer
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  const stripeClient = ensureStripe();
  return stripeClient.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

// Create a setup intent for saving cards
export async function createSetupIntent(customerId: string) {
  const stripeClient = ensureStripe();
  const setupIntent = await stripeClient.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
}

// Process a charge with saved payment method
export async function chargeCustomer(
  customerId: string,
  paymentMethodId: string,
  amount: number,
  description?: string
) {
  const stripeClient = ensureStripe();
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount,
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    description,
  });

  return paymentIntent;
}

// Create a subscription for memberships
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
) {
  const stripeClient = ensureStripe();
  const subscription = await stripeClient.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  return subscription;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  const stripeClient = ensureStripe();
  return stripeClient.subscriptions.cancel(subscriptionId);
}

// Create a product (for services/memberships)
export async function createProduct(name: string, description?: string) {
  const stripeClient = ensureStripe();
  return stripeClient.products.create({
    name,
    description,
  });
}

// Create a price for a product
export async function createPrice(
  productId: string,
  unitAmount: number,
  recurring?: { interval: "month" | "year" | "week" | "day" }
) {
  const stripeClient = ensureStripe();
  return stripeClient.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: "usd",
    recurring,
  });
}

// Webhook signature verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  const stripeClient = ensureStripe();
  return stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

// ============ BUSINESS SUBSCRIPTION FUNCTIONS ============

// Create a business subscription for salon owners
export async function createBusinessSubscription(
  customerId: string,
  priceId: string,
  businessId: string
) {
  const stripeClient = ensureStripe();
  const subscription = await stripeClient.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: { businessId, type: "business_subscription" },
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  return subscription;
}

// Update a business subscription (upgrade/downgrade)
export async function updateBusinessSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const stripeClient = ensureStripe();

  // Get current subscription
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

  // Update with new price
  return stripeClient.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: "create_prorations",
  });
}

// Create a one-time invoice for commission charges
export async function createCommissionInvoice(
  customerId: string,
  amount: number,
  description: string,
  invoiceId: string,
  businessId: string
) {
  const stripeClient = ensureStripe();

  // Create the invoice
  const invoice = await stripeClient.invoices.create({
    customer: customerId,
    collection_method: "charge_automatically",
    metadata: {
      invoiceId,
      businessId,
      type: "commission_invoice"
    },
  });

  // Add the commission as an invoice item
  await stripeClient.invoiceItems.create({
    customer: customerId,
    invoice: invoice.id,
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    description,
  });

  // Finalize and attempt to pay
  return stripeClient.invoices.finalizeInvoice(invoice.id, {
    auto_advance: true,
  });
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  const stripeClient = ensureStripe();
  return stripeClient.subscriptions.retrieve(subscriptionId);
}

// List invoices for a customer
export async function listCustomerInvoices(
  customerId: string,
  limit: number = 10
) {
  const stripeClient = ensureStripe();
  return stripeClient.invoices.list({
    customer: customerId,
    limit,
  });
}

// Create or get Stripe products for subscription plans
export async function getOrCreateSubscriptionProducts() {
  const stripeClient = ensureStripe();

  const plans = [
    { name: "BeautyHQ Growth", amount: 4900, interval: "month" as const },
    { name: "BeautyHQ Pro", amount: 14900, interval: "month" as const },
  ];

  const products: Record<string, { productId: string; priceId: string }> = {};

  for (const plan of plans) {
    // Search for existing product
    const existingProducts = await stripeClient.products.search({
      query: `name:'${plan.name}'`,
    });

    let productId: string;

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
    } else {
      // Create new product
      const product = await stripeClient.products.create({
        name: plan.name,
        metadata: { type: "business_subscription" },
      });
      productId = product.id;
    }

    // Get or create price
    const prices = await stripeClient.prices.list({
      product: productId,
      active: true,
    });

    let priceId: string;

    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
    } else {
      const price = await stripeClient.prices.create({
        product: productId,
        unit_amount: plan.amount,
        currency: "usd",
        recurring: { interval: plan.interval },
      });
      priceId = price.id;
    }

    products[plan.name.replace("BeautyHQ ", "").toUpperCase()] = {
      productId,
      priceId,
    };
  }

  return products;
}

export { stripe };
