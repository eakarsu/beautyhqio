import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { credentials } from "@/lib/operations/connections";
import {
  applySaleCheckout,
  applySaleRefund,
} from "@/lib/operations/sale-payments";
import type { Context } from "@/lib/operations/core";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  let event: Stripe.Event;
  try {
    const c = await credentials(businessId, "stripe");
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
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type)
    )
      await applySaleCheckout(
        ctx,
        event.data.object as Stripe.Checkout.Session,
        event.type === "checkout.session.async_payment_failed",
      );
    if (
      ["refund.created", "refund.updated", "refund.failed"].includes(event.type)
    )
      await applySaleRefund(ctx, event.data.object as Stripe.Refund);
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Receipt reconciliation failed; retry required" },
      { status: 500 },
    );
  }
}
