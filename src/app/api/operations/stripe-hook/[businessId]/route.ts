import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { credentials } from "@/lib/operations/connections";
import {
  applySaleCheckout,
  applySaleRefund,
} from "@/lib/operations/sale-payments";
import type { Context } from "@/lib/operations/core";
import { applyCardDepositCheckout, applyCardDepositRefund } from '@/lib/appointments/card-deposit';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  let event: Stripe.Event;
  let testDepositKey = false;
  try {
    const c = await credentials(businessId, "stripe");
    testDepositKey = /^(sk|rk)_test_/.test(c.secretKey);
    if (!c.webhookSecret || !req.headers.get("stripe-signature"))
      throw Error("Missing signature");
    const reader = req.body?.getReader();
    if (!reader) throw Error("Missing body");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 100000) {
        await reader.cancel();
        throw Error("Payload too large");
      }
      chunks.push(value);
    }
    event = new Stripe(c.secretKey).webhooks.constructEvent(
      Buffer.concat(chunks),
      req.headers.get("stripe-signature")!,
      c.webhookSecret,
    );
  } catch {
    return Response.json(
      { error: "Invalid signature or provider configuration" },
      { status: 400 },
    );
  }
  const owner = await prisma.user.findFirst({
    where: { businessId, role: "OWNER", isActive: true },
  });
  if (!owner)
    return Response.json({ error: "Business is unavailable" }, { status: 503 });
  const ctx: Context = {
    businessId,
    user: {
      ...owner,
      businessName: null,
      staffId: null,
      clientId: null,
      isPlatformAdmin: false,
    },
  };
  try {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.Refund;
    const depositCheckout = 'metadata' in object && Boolean(object.metadata?.appointmentDepositCheckoutId);
    const depositRefund = 'metadata' in object && Boolean(object.metadata?.appointmentDepositRefundId);
    if ((depositCheckout || depositRefund) && (process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED !== 'true' || !testDepositKey))
      return Response.json({ error: 'Card deposit test environment is unavailable' }, { status: 503 });
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type)
    ) {
      if (depositCheckout) await applyCardDepositCheckout(ctx, object as Stripe.Checkout.Session, event.type === 'checkout.session.async_payment_failed');
      else await applySaleCheckout(ctx, object as Stripe.Checkout.Session, event.type === 'checkout.session.async_payment_failed');
    }
    if (
      ["refund.created", "refund.updated", "refund.failed"].includes(event.type)
    ) {
      if (depositRefund) await applyCardDepositRefund(ctx, object as Stripe.Refund);
      else await applySaleRefund(ctx, object as Stripe.Refund);
    }
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Receipt reconciliation failed; retry required" },
      { status: 500 },
    );
  }
}
