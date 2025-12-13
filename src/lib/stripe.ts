// Stripe Payment Integration
import Stripe from "stripe";

// Only initialize Stripe if the API key is provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
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

export { stripe };
