import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, fail, mutation, type Context, idSchema } from "./core";
import { credentials } from "./connections";
import { saleFor, saleBalance, noPendingSaleProvider } from "./sales";
import { z } from "zod";
type Factory = (businessId: string) => Promise<Stripe>;
export async function salonStripe(businessId: string) {
  const c = await credentials(businessId, "stripe");
  if (!c.webhookSecret)
    fail(503, "Configure the salon Stripe webhook secret before payments");
  return new Stripe(c.secretKey, { timeout: 15000, maxNetworkRetries: 1 });
}
async function locked<T>(
  ctx: Context,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ctx.businessId},0))::text`;
      return work(tx);
    },
    { timeout: 20000 },
  );
}
export async function startSaleCheckout(
  ctx: Context,
  req: Request,
  id: string,
  factory: Factory = salonStripe,
) {
  const stripe = await factory(ctx.businessId),
    receipt = await mutation(
      ctx,
      req,
      "sale.checkout",
      { id },
      async (tx) => {
        const sale = await saleFor(tx, ctx, id);
        if (!sale.reviewedAt || sale.status !== "PENDING")
          fail(409, "A reviewed pending sale is required");
        const active = await tx.salonCheckout.findFirst({
          where: {
            transactionId: id,
            status: { in: ["PENDING", "OPEN", "UNKNOWN"] },
          },
        });
        if (active) return active;
        await noPendingSaleProvider(tx, id);
        const balance = await saleBalance(tx, id);
        if (balance.balanceCents <= 0) fail(409, "Sale is already paid");
        return tx.salonCheckout.create({
          data: {
            businessId: ctx.businessId,
            transactionId: id,
            amountCents: balance.balanceCents,
            requestKey: req.headers.get("Idempotency-Key")!,
            createdById: ctx.user.id,
          },
        });
      },
    );
  // Receipts replay the original reservation; provider state must be read fresh.
  const reservation = await prisma.salonCheckout.findFirstOrThrow({where:{id:receipt.id,businessId:ctx.businessId}});
  await saleFor(prisma, ctx, reservation.transactionId);
  if (reservation.status === "PAID") return {status:"PAID"};
  if (reservation.providerRef) {
    const session = await stripe.checkout.sessions.retrieve(
      reservation.providerRef,
    );
    if (session.status === "open" && session.url) return { url: session.url };
    await applySaleCheckout(ctx, session);
    return { status: session.status };
  }
  if (!["PENDING", "UNKNOWN"].includes(reservation.status))
    fail(409, "Checkout is closed");
  if (new Date(reservation.createdAt).getTime() < Date.now() - 23 * 3600000)
    fail(409, "Retry window elapsed; reconcile using the provider session ID");
  const origin = new URL(process.env.NEXTAUTH_URL || "http://localhost:3000")
    .origin;
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: reservation.id,
        metadata: {
          salonCheckoutId: reservation.id,
          businessId: ctx.businessId,
          transactionId: id,
        },
        payment_intent_data: {
          metadata: {
            businessId: ctx.businessId,
            transactionId: id,
            salonCheckoutId: reservation.id,
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: reservation.amountCents,
              product_data: { name: "Salon sale" },
            },
          },
        ],
        success_url: `${origin}/pos?checkout=returned`,
        cancel_url: `${origin}/pos?checkout=cancelled`,
      },
      { idempotencyKey: `salon-checkout:${reservation.id}` },
    );
    await prisma.salonCheckout.updateMany({
      where: { id: reservation.id, status: { in: ["PENDING", "UNKNOWN"] } },
      data: { providerRef: session.id, status: "OPEN" },
    });
    if (!session.url) fail(502, "Provider did not return a checkout URL");
    return { url: session.url };
  } catch (error) {
    await prisma.salonCheckout.updateMany({
      where: { id: reservation.id, status: "PENDING" },
      data: { status: "UNKNOWN" },
    });
    throw error;
  }
}
export async function applySaleCheckout(
  ctx: Context,
  session: Stripe.Checkout.Session,
  paymentFailed = false,
) {
  return locked(ctx, async (tx) => {
    const row = await tx.salonCheckout.findFirst({
      where: {
        id: session.metadata?.salonCheckoutId || "none",
        businessId: ctx.businessId,
      },
    });
    if (
      !row ||
      session.metadata?.businessId !== ctx.businessId ||
      session.metadata.transactionId !== row.transactionId ||
      session.client_reference_id !== row.id ||
      session.mode !== "payment" ||
      (row.providerRef && row.providerRef !== session.id)
    )
      fail(409, "Provider checkout identity mismatch");
    if (row.status === "PAID") return row;
    if (session.payment_status !== "paid") {
      if (session.status === "expired" || paymentFailed)
        return tx.salonCheckout.update({
          where: { id: row.id },
          data: { providerRef: session.id, status: paymentFailed ? "FAILED" : "EXPIRED" },
        });
      return row;
    }
    if (session.currency !== "usd" || session.amount_total !== row.amountCents)
      fail(409, "Provider amount or currency mismatch");
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!intent) fail(409, "Verified payment reference is missing");
    const { sale, balanceCents } = await saleBalance(tx, row.transactionId);
    if (
      !sale.reviewedAt ||
      sale.status !== "PENDING" ||
      balanceCents < row.amountCents
    )
      fail(409, "Checkout requires manual balance reconciliation");
    const payment = await tx.transactionPayment.create({
      data: {
        transactionId: sale.id,
        method: "CREDIT_CARD",
        amount: row.amountCents / 100,
        stripePaymentId: intent,
        reference: session.id,
        source: "STRIPE",
        verifiedAt: new Date(),
      },
    });
    await tx.transaction.update({
      where: { id: sale.id },
      data: {
        status: balanceCents === row.amountCents ? "COMPLETED" : "PENDING",
        version: { increment: 1 },
      },
    });
    const saved = await tx.salonCheckout.update({
      where: { id: row.id },
      data: {
        providerRef: session.id,
        paymentIntentId: intent,
        status: "PAID",
      },
    });
    await audit(tx, ctx, "SALE_PAYMENT_VERIFIED", "Transaction", sale.id, {
      paymentId: payment.id,
      amountCents: row.amountCents,
      providerRef: intent,
    });
    return saved;
  });
}
export async function reconcileSaleCheckout(
  ctx: Context,
  id: string,
  reference: string,
  expire = false,
  factory: Factory = salonStripe,
) {
  const row = await prisma.salonCheckout.findFirst({
    where: { id, businessId: ctx.businessId },
  });
  if (!row) fail(404, "Checkout not found");
  await saleFor(prisma, ctx, row.transactionId);
  const stripe = await factory(ctx.businessId);
  let session = await stripe.checkout.sessions.retrieve(reference);
  if (session.metadata?.salonCheckoutId !== row.id)
    fail(409, "Receipt belongs to another checkout");
  if (expire && session.status === "open")
    session = await stripe.checkout.sessions.expire(reference);
  return applySaleCheckout(ctx, session);
}
const refundInput = z
  .object({
    paymentId: idSchema,
    amount: z
      .number()
      .positive()
      .max(1000000)
      .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001),
    reason: z.string().trim().min(5).max(1000),
    cashReturnedConfirmed: z.boolean().default(false),
  })
  .strict();
export async function refundSalePayment(
  ctx: Context,
  req: Request,
  raw: unknown,
  factory: Factory = salonStripe,
) {
  if (!["OWNER", "MANAGER"].includes(ctx.user.role))
    fail(403, "Manager required");
  const input = refundInput.parse(raw),
    payment = await prisma.transactionPayment.findFirst({
      where: {
        id: input.paymentId,
        transaction: { location: { businessId: ctx.businessId } },
      },
    });
  if (!payment?.verifiedAt) fail(409, "Refund requires a verified payment");
  if (!["STRIPE", "CASH", "GIFT_CARD"].includes(payment.source || ""))
    fail(409, "This payment needs separate reconciliation");
  const stripe =
    payment.source === "STRIPE" ? await factory(ctx.businessId) : null;
  const reserved = await mutation(
    ctx,
    req,
    "sale.refund",
    input,
    async (tx) => {
      await noPendingSaleProvider(tx, payment.transactionId);
      const refunded = await tx.paymentRefund.aggregate({
        where: {
          paymentId: payment.id,
          status: { notIn: ["FAILED", "CANCELLED"] },
        },
        _sum: { amount: true },
      });
      if (
        new Prisma.Decimal(input.amount)
          .plus(refunded._sum.amount || 0)
          .greaterThan(payment.amount)
      )
        fail(409, "Refund exceeds the remaining payment");
      if (payment.source === "CASH" && !input.cashReturnedConfirmed)
        fail(422, "Confirm that cash was actually returned");
      const row = await tx.paymentRefund.create({
        data: {
          businessId: ctx.businessId,
          paymentId: payment.id,
          amount: input.amount,
          reason: input.reason,
          createdById: ctx.user.id,
        },
      });
      if (payment.source === "GIFT_CARD") {
        if (!payment.giftCardId) fail(409, "Original gift card is missing");
        const card = await tx.giftCard.findFirst({
          where: { id: payment.giftCardId, businessId: ctx.businessId },
        });
        if (!card) fail(409, "Original gift card is missing");
        if (
          !["active", "redeemed"].includes(card.status) ||
          (card.expiresAt && card.expiresAt <= new Date())
        )
          fail(
            409,
            "The original gift card is inactive or expired; reconcile it before refunding",
          );
        const updated = await tx.giftCard.update({
          where: { id: card.id },
          data: {
            currentBalance: { increment: input.amount },
            status: card.status === "redeemed" ? "active" : card.status,
          },
        });
        await tx.giftCardUsage.create({
          data: {
            giftCardId: card.id,
            amount: -input.amount,
            balanceAfter: updated.currentBalance,
          },
        });
      }
      if (payment.source !== "STRIPE") {
        await tx.paymentRefund.update({
          where: { id: row.id },
          data: { status: "SUCCEEDED" },
        });
        await settleRefundBalance(tx, ctx, payment.transactionId);
      }
      await audit(tx, ctx, "SALE_REFUND_REQUESTED", "PaymentRefund", row.id, {
        paymentId: payment.id,
        amount: input.amount,
        reason: input.reason,
        source: payment.source,
      });
      return { id: row.id };
    },
  );
  const row = await prisma.paymentRefund.findUniqueOrThrow({
    where: { id: reserved.id },
  });
  if (row.status === "SUCCEEDED" || payment.source !== "STRIPE") return row;
  if (row.providerRef)
    return applySaleRefund(
      ctx,
      await stripe!.refunds.retrieve(row.providerRef),
    );
  if (row.createdAt.getTime() < Date.now() - 23 * 3600000)
    fail(409, "Retry window elapsed; reconcile using the provider refund ID");
  if (!["PENDING", "UNKNOWN"].includes(row.status))
    fail(409, "Refund is already processing or closed");
  try {
    const refund = await stripe!.refunds.create(
      {
        payment_intent: payment.stripePaymentId!,
        amount: Math.round(Number(row.amount) * 100),
        metadata: { businessId: ctx.businessId, beautyRefundId: row.id },
      },
      { idempotencyKey: `beauty-refund-${row.id}` },
    );
    return applySaleRefund(ctx, refund);
  } catch (error) {
    await prisma.paymentRefund.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: {
        status: "UNKNOWN",
        lastError: "Provider outcome unknown; reconcile before another refund",
      },
    });
    throw error;
  }
}
async function settleRefundBalance(
  tx: Prisma.TransactionClient,
  ctx: Context,
  id: string,
) {
  const balance = await saleBalance(tx, id);
  if (balance.paidCents < 0) fail(409, "Refund balance requires investigation");
  if (balance.paidCents === 0 && balance.sale.status === "COMPLETED")
    await tx.transaction.update({
      where: { id },
      data: { status: "REFUNDED", version: { increment: 1 } },
    });
}
export async function applySaleRefund(ctx: Context, refund: Stripe.Refund) {
  return locked(ctx, async (tx) => {
    const row = await tx.paymentRefund.findFirst({
        where: {
          id: refund.metadata?.beautyRefundId || "none",
          businessId: ctx.businessId,
        },
        include: { payment: true },
      }),
      intent =
        typeof refund.payment_intent === "string"
          ? refund.payment_intent
          : refund.payment_intent?.id;
    if (
      !row ||
      refund.metadata?.businessId !== ctx.businessId ||
      refund.amount !== Math.round(Number(row.amount) * 100) ||
      refund.currency !== "usd" ||
      intent !== row.payment.stripePaymentId ||
      (row.providerRef && row.providerRef !== refund.id)
    )
      fail(409, "Refund identity, amount or payment receipt mismatch");
    if (row.status === "SUCCEEDED") return row;
    const status =
      refund.status === "succeeded"
        ? "SUCCEEDED"
        : ["failed", "canceled"].includes(refund.status || "")
          ? "FAILED"
          : "PROCESSING";
    if (["FAILED", "CANCELLED"].includes(row.status) && status !== "FAILED")
      fail(409, "Terminal refund changed; investigation required");
    const saved = await tx.paymentRefund.update({
      where: { id: row.id },
      data: { providerRef: refund.id, status, lastError: null },
    });
    if (status === "SUCCEEDED")
      await settleRefundBalance(tx, ctx, row.payment.transactionId);
    await audit(tx, ctx, "SALE_REFUND_RECONCILED", "PaymentRefund", row.id, {
      providerRef: refund.id,
      status,
      amount: row.amount.toString(),
    });
    return saved;
  });
}
export async function reconcileSaleRefund(
  ctx: Context,
  id: string,
  reference: string,
  factory: Factory = salonStripe,
) {
  if (!["OWNER", "MANAGER"].includes(ctx.user.role))
    fail(403, "Manager required");
  const row = await prisma.paymentRefund.findFirst({
    where: { id, businessId: ctx.businessId },
  });
  if (!row) fail(404, "Refund not found");
  const stripe = await factory(ctx.businessId),
    refund = await stripe.refunds.retrieve(reference);
  if (refund.metadata?.beautyRefundId !== row.id)
    fail(409, "Receipt belongs to another refund");
  return applySaleRefund(ctx, refund);
}
