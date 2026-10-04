import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { audit, fail, mutation, type Context } from '@/lib/operations/core';
import { credentials } from '@/lib/operations/connections';
import { cashDepositLiabilityCents } from './deposit-ledger';
import { queueAppointmentEmail } from './notifications';

type StripeFactory = (businessId: string) => Promise<Stripe>;
const activeCheckout = ['PENDING', 'OPEN', 'UNKNOWN'];
const activeRefund = ['PENDING', 'UNKNOWN', 'PROCESSING'];

function testMode() {
  if (process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED !== 'true') fail(503, 'Card deposits require an enabled Stripe test environment');
}
export async function salonDepositStripe(businessId: string) {
  testMode();
  const config = await credentials(businessId, 'stripe');
  if (!config.webhookSecret || !/^(sk|rk)_test_/.test(config.secretKey)) fail(503, 'Configure a Stripe test key and signed webhook before accepting card deposits');
  return new Stripe(config.secretKey, { timeout: 15000, maxNetworkRetries: 1 });
}
async function locked<T>(ctx: Context, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ctx.businessId},0))::text`;
    return work(tx);
  }, { timeout: 20000 });
}
async function scopedIntent(tx: Prisma.TransactionClient, ctx: Context, appointmentId: string) {
  const intent = await tx.appointmentDepositIntent.findFirst({
    where: { appointmentId, businessId: ctx.businessId, appointment: { location: { businessId: ctx.businessId } } },
    include: { appointment: true, ledgerEntries: true, cardCheckouts: true, cardRefunds: true },
  });
  if (!intent || !intent.appointment.clientId || (ctx.user.role === 'CLIENT' && ctx.user.clientId !== intent.appointment.clientId)) fail(404, 'Deposit obligation not found');
  if (!['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT'].includes(ctx.user.role)) fail(403, 'Deposit checkout is unavailable for this role');
  if (intent.currency !== 'USD' || !Number.isSafeInteger(intent.amountCents) || intent.amountCents <= 0) fail(409, 'Deposit amount requires reconciliation');
  return intent;
}

export async function startCardDepositCheckout(ctx: Context, req: Request, appointmentId: string, factory: StripeFactory = salonDepositStripe) {
  testMode();
  const stripe = await factory(ctx.businessId);
  const reservation = await mutation(ctx, req, 'appointment.deposit.card-checkout', { appointmentId }, async tx => {
    const intent = await scopedIntent(tx, ctx, appointmentId);
    if (intent.status !== 'PENDING' || intent.appointment.status !== 'BOOKED' || intent.ledgerEntries.length) fail(409, 'This appointment is no longer awaiting a card deposit');
    const active = intent.cardCheckouts.find(row => activeCheckout.includes(row.status));
    if (active) return active;
    return tx.appointmentDepositCheckout.create({ data: {
      businessId: ctx.businessId, appointmentId, depositIntentId: intent.id, clientId: intent.appointment.clientId!,
      amountCents: intent.amountCents, currency: 'USD', requestKey: req.headers.get('Idempotency-Key')!, createdById: ctx.user.id,
    } });
  }, tx => scopedIntent(tx, ctx, appointmentId));
  // The mutation receipt can replay after the appointment changes; recheck state.
  const intent = await scopedIntent(prisma, ctx, appointmentId);
  const row = await prisma.appointmentDepositCheckout.findFirstOrThrow({ where: { id: reservation.id, businessId: ctx.businessId, depositIntentId: intent.id } });
  if (row.status === 'PAID') return { status: 'PAID' };
  if (intent.status !== 'PENDING' || intent.appointment.status !== 'BOOKED') fail(409, 'Appointment changed; reconcile this checkout before continuing');
  // An existing session keeps the return URL chosen by its original actor.
  // Another account may reconcile it but must not be redirected into that account's page.
  if (row.createdById !== ctx.user.id) {
    if (row.providerRef) {
      const session = await stripe.checkout.sessions.retrieve(row.providerRef);
      await applyCardDepositCheckout(ctx, session);
      if (session.payment_status === 'paid') return { status: 'PAID' };
    }
    return { status: row.status };
  }
  if (row.providerRef) {
    const session = await stripe.checkout.sessions.retrieve(row.providerRef);
    await applyCardDepositCheckout(ctx, session);
    if (session.status === 'open' && session.url) return { url: session.url, status: 'OPEN' };
    return { status: session.payment_status === 'paid' ? 'PAID' : session.status };
  }
  if (!['PENDING', 'UNKNOWN'].includes(row.status)) fail(409, 'Checkout is closed');
  if (row.createdAt.getTime() < Date.now() - 23 * 3600000) fail(409, 'Provider retry window elapsed; reconcile using the Stripe session ID');
  const origin = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').origin;
  const returnPath = ctx.user.role === 'CLIENT' ? `/client/appointments/${encodeURIComponent(appointmentId)}` : `/appointments/${encodeURIComponent(appointmentId)}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', client_reference_id: row.id,
      metadata: { businessId: ctx.businessId, appointmentId, depositIntentId: intent.id, appointmentDepositCheckoutId: row.id },
      payment_intent_data: { metadata: { businessId: ctx.businessId, appointmentId, appointmentDepositCheckoutId: row.id } },
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: row.amountCents, product_data: { name: 'Appointment deposit' } } }],
      success_url: `${origin}${returnPath}?deposit=returned`,
      cancel_url: `${origin}${returnPath}?deposit=cancelled`,
    }, { idempotencyKey: `salon-deposit:${row.id}` });
    await prisma.appointmentDepositCheckout.updateMany({ where: { id: row.id, status: { in: ['PENDING', 'UNKNOWN'] } }, data: { providerRef: session.id, status: 'OPEN' } });
    if (!session.url) fail(502, 'Provider did not return a checkout URL');
    return { url: session.url, status: 'OPEN' };
  } catch (error) {
    await prisma.appointmentDepositCheckout.updateMany({ where: { id: row.id, status: 'PENDING' }, data: { status: 'UNKNOWN' } });
    throw error;
  }
}

export async function applyCardDepositCheckout(ctx: Context, session: Stripe.Checkout.Session, paymentFailed = false) {
  return locked(ctx, async tx => {
    const row = await tx.appointmentDepositCheckout.findFirst({ where: { id: session.metadata?.appointmentDepositCheckoutId || 'none', businessId: ctx.businessId }, include: { depositIntent: { include: { appointment: true, ledgerEntries: true } } } });
    if (!row || session.metadata?.businessId !== ctx.businessId || session.metadata?.appointmentId !== row.appointmentId || session.metadata?.depositIntentId !== row.depositIntentId ||
      session.client_reference_id !== row.id || session.mode !== 'payment' || (row.providerRef && row.providerRef !== session.id) ||
      row.depositIntent.appointment.clientId !== row.clientId ||
      row.depositIntent.appointment.businessId !== ctx.businessId || row.depositIntent.businessId !== ctx.businessId) fail(409, 'Provider checkout identity or appointment scope mismatch');
    if (row.status === 'PAID') {
      const paidIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (session.payment_status === 'paid' && (session.currency !== 'usd' || session.amount_total !== row.amountCents || paidIntent !== row.paymentIntentId)) fail(409, 'Captured checkout receipt changed; investigation required');
      return row;
    }
    if (session.payment_status !== 'paid') {
      if (session.status === 'expired' || paymentFailed) return tx.appointmentDepositCheckout.update({ where: { id: row.id }, data: { providerRef: session.id, status: paymentFailed ? 'FAILED' : 'EXPIRED' } });
      return row;
    }
    if (session.currency !== 'usd' || session.amount_total !== row.amountCents || row.amountCents !== row.depositIntent.amountCents || row.currency !== 'USD') fail(409, 'Provider amount or currency mismatch');
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) fail(409, 'Verified card payment reference is missing');
    const intent = row.depositIntent;
    if (!['PENDING', 'CANCELLED'].includes(intent.status) || intent.ledgerEntries.length || !['BOOKED', 'CANCELLED'].includes(intent.appointment.status)) fail(409, 'Captured deposit needs manual reconciliation');
    const now = new Date();
    const collection = await tx.appointmentDepositLedgerEntry.create({ data: {
      businessId: ctx.businessId, locationId: intent.appointment.locationId, depositIntentId: intent.id,
      kind: 'COLLECTED', amountCents: row.amountCents, currency: 'USD', reference: session.id,
      actorId: row.createdById, reason: 'Stripe test-mode card capture', createdAt: now,
    } });
    await tx.appointmentDepositIntent.update({ where: { id: intent.id }, data: {
      status: 'PAID', collectionMethod: 'CARD', reference: session.id, reason: 'Verified Stripe card capture',
      settledById: row.createdById, settledAt: now, version: { increment: 1 },
    } });
    await tx.appointment.update({ where: { id: row.appointmentId }, data: { depositPaid: row.amountCents / 100, depositPaidAt: now, version: { increment: 1 } } });
    const saved = await tx.appointmentDepositCheckout.update({ where: { id: row.id }, data: { providerRef: session.id, paymentIntentId, status: 'PAID' } });
    const client = await tx.client.findFirst({ where: { id: row.clientId, businessId: ctx.businessId } });
    if (intent.appointment.status === 'BOOKED') {
      const deliveries = [
        ['CALENDAR_CREATE', 'calendar'],
        ...(client?.phone && client.allowSms !== false ? [['CONFIRMATION_SMS', 'twilio']] : []),
      ];
      await tx.integrationDelivery.createMany({ data: deliveries.map(([kind, provider]) => ({ businessId: ctx.businessId, appointmentId: row.appointmentId, kind, provider, dedupeKey: `${row.appointmentId}:${kind}:deposit-settled`, payload: { appointmentId: row.appointmentId } })) });
      await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: intent.appointment, client, kind: 'CONFIRMATION_EMAIL', eventKey: 'deposit-settled' });
    }
    await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: intent.appointment, client, kind: 'DEPOSIT_PAID_EMAIL', eventKey: `card-capture:${row.id}`, amountCents: row.amountCents, collectionMethod: 'CARD' });
    await audit(tx, ctx, 'APPOINTMENT_DEPOSIT_CARD_CAPTURED', 'AppointmentDepositIntent', intent.id, { appointmentId: row.appointmentId, checkoutId: row.id, collectionId: collection.id, amountCents: row.amountCents, paymentIntentId });
    return saved;
  });
}

export async function requestCardDepositRefund(ctx: Context, req: Request, appointmentId: string, reason: string, factory: StripeFactory = salonDepositStripe) {
  testMode();
  if (!['OWNER', 'MANAGER'].includes(ctx.user.role)) fail(403, 'Manager approval is required for a card deposit refund');
  if (reason.trim().length < 5 || reason.length > 500) fail(422, 'Provide a refund reason');
  const stripe = await factory(ctx.businessId);
  const reserved = await mutation(ctx, req, 'appointment.deposit.card-refund', { appointmentId, reason: reason.trim() }, async tx => {
    const intent = await scopedIntent(tx, ctx, appointmentId);
    if (intent.status !== 'PAID' || intent.collectionMethod !== 'CARD') fail(409, 'Only an unapplied card deposit can be refunded here');
    if (await tx.transaction.count({ where: { appointmentId } })) fail(409, 'A linked POS sale must be refunded through its original payment');
    if (intent.ledgerEntries.some(entry => entry.businessId !== ctx.businessId || entry.locationId !== intent.appointment.locationId || entry.currency !== 'USD')) fail(409, 'Deposit ledger requires reconciliation');
    try { if (cashDepositLiabilityCents(intent.amountCents, intent.ledgerEntries) !== intent.amountCents) fail(409, 'Deposit has already been applied or refunded'); }
    catch { fail(409, 'Deposit liability requires reconciliation'); }
    const existing = intent.cardRefunds.find(row => activeRefund.includes(row.status));
    if (existing) return existing;
    return tx.appointmentDepositRefund.create({ data: { businessId: ctx.businessId, depositIntentId: intent.id, amountCents: intent.amountCents, reason: reason.trim(), createdById: ctx.user.id } });
  }, tx => scopedIntent(tx, ctx, appointmentId));
  const row = await prisma.appointmentDepositRefund.findFirstOrThrow({ where: { id: reserved.id, businessId: ctx.businessId }, include: { depositIntent: { include: { cardCheckouts: true } } } });
  if (row.status === 'SUCCEEDED') return { status: 'SUCCEEDED' };
  const capture = row.depositIntent.cardCheckouts.find(checkout => checkout.status === 'PAID' && checkout.paymentIntentId);
  if (!capture || capture.appointmentId !== appointmentId) fail(409, 'Verified card capture is missing');
  if (row.providerRef) return applyCardDepositRefund(ctx, await stripe.refunds.retrieve(row.providerRef));
  if (!['PENDING', 'UNKNOWN'].includes(row.status)) return { status: row.status };
  if (row.createdAt.getTime() < Date.now() - 23 * 3600000) fail(409, 'Provider retry window elapsed; reconcile using the Stripe refund ID');
  try {
    const refund = await stripe.refunds.create({ payment_intent: capture.paymentIntentId!, amount: row.amountCents,
      metadata: { businessId: ctx.businessId, appointmentId, depositIntentId: row.depositIntentId, appointmentDepositRefundId: row.id },
    }, { idempotencyKey: `salon-deposit-refund:${row.id}` });
    return applyCardDepositRefund(ctx, refund);
  } catch (error) {
    await prisma.appointmentDepositRefund.updateMany({ where: { id: row.id, status: 'PENDING' }, data: { status: 'UNKNOWN' } });
    throw error;
  }
}

export async function applyCardDepositRefund(ctx: Context, refund: Stripe.Refund) {
  return locked(ctx, async tx => {
    const row = await tx.appointmentDepositRefund.findFirst({ where: { id: refund.metadata?.appointmentDepositRefundId || 'none', businessId: ctx.businessId }, include: { depositIntent: { include: { appointment: true, cardCheckouts: true, ledgerEntries: true } } } });
    const paymentIntentId = typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id;
    const capture = row?.depositIntent.cardCheckouts.find(checkout => checkout.status === 'PAID' && checkout.paymentIntentId === paymentIntentId);
    if (!row || !capture || refund.metadata?.businessId !== ctx.businessId || refund.metadata?.appointmentId !== row.depositIntent.appointmentId || refund.metadata?.depositIntentId !== row.depositIntentId ||
      refund.amount !== row.amountCents || refund.currency !== 'usd' || (row.providerRef && row.providerRef !== refund.id) ||
      row.depositIntent.businessId !== ctx.businessId || row.depositIntent.appointment.businessId !== ctx.businessId) fail(409, 'Provider refund identity, amount or payment mismatch');
    if (row.status === 'SUCCEEDED') return row;
    const status = refund.status === 'succeeded' ? 'SUCCEEDED' : ['failed', 'canceled'].includes(refund.status || '') ? 'FAILED' : 'PROCESSING';
    if (row.status === 'FAILED' && status !== 'FAILED') fail(409, 'Terminal refund changed; investigation required');
    if (status === 'SUCCEEDED') {
      if (row.depositIntent.status !== 'PAID' || row.depositIntent.collectionMethod !== 'CARD' || await tx.transaction.count({ where: { appointmentId: capture!.appointmentId } })) fail(409, 'Deposit refund requires manual reconciliation');
      if (row.depositIntent.ledgerEntries.some(entry => entry.businessId !== ctx.businessId || entry.locationId !== row.depositIntent.appointment.locationId || entry.currency !== 'USD')) fail(409, 'Deposit ledger requires reconciliation');
      try { if (cashDepositLiabilityCents(row.amountCents, row.depositIntent.ledgerEntries) !== row.amountCents) fail(409, 'Deposit liability requires reconciliation'); }
      catch { fail(409, 'Deposit liability requires reconciliation'); }
      await tx.appointmentDepositLedgerEntry.create({ data: { businessId: ctx.businessId, locationId: row.depositIntent.appointment.locationId, depositIntentId: row.depositIntentId,
        kind: 'REFUNDED', amountCents: -row.amountCents, currency: 'USD', reference: refund.id, actorId: row.createdById, reason: row.reason } });
      await tx.appointmentDepositIntent.update({ where: { id: row.depositIntentId }, data: { status: 'REFUNDED', version: { increment: 1 } } });
      await tx.appointment.update({ where: { id: capture!.appointmentId }, data: { depositPaid: null, depositPaidAt: null, version: { increment: 1 } } });
      const client = await tx.client.findFirst({ where: { id: capture!.clientId, businessId: ctx.businessId } });
      await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: row.depositIntent.appointment, client, kind: 'DEPOSIT_REFUND_EMAIL', eventKey: `card-refund:${row.id}`, amountCents: row.amountCents, collectionMethod: 'CARD' });
    }
    const saved = await tx.appointmentDepositRefund.update({ where: { id: row.id }, data: { providerRef: refund.id, status } });
    await audit(tx, ctx, 'APPOINTMENT_DEPOSIT_CARD_REFUND_RECONCILED', 'AppointmentDepositRefund', row.id, { appointmentId: capture!.appointmentId, providerRef: refund.id, amountCents: row.amountCents, status });
    return saved;
  });
}

/** Resolve an unknown provider result by its receipt, or close an open checkout. */
export async function reconcileCardDeposit(ctx: Context, appointmentId: string, kind: 'checkout' | 'refund', reference: string, expire = false, factory: StripeFactory = salonDepositStripe) {
  testMode();
  if (!['OWNER', 'MANAGER'].includes(ctx.user.role)) fail(403, 'Manager approval is required for provider reconciliation');
  if ((kind === 'checkout' && !/^cs_[\w-]{4,180}$/.test(reference)) || (kind === 'refund' && !/^re_[\w-]{4,180}$/.test(reference))) fail(422, 'Enter a valid Stripe test receipt');
  const intent = await scopedIntent(prisma, ctx, appointmentId);
  const stripe = await factory(ctx.businessId);
  if (kind === 'checkout') {
    let session = await stripe.checkout.sessions.retrieve(reference);
    const row = intent.cardCheckouts.find(checkout => checkout.id === session.metadata?.appointmentDepositCheckoutId && (!checkout.providerRef || checkout.providerRef === reference));
    if (!row) fail(409, 'Provider checkout does not match this appointment deposit');
    if (expire && session.status === 'open') session = await stripe.checkout.sessions.expire(reference);
    return applyCardDepositCheckout(ctx, session);
  }
  if (expire) fail(422, 'Provider refunds cannot be expired here');
  const refund = await stripe.refunds.retrieve(reference);
  if (!intent.cardRefunds.some(row => row.id === refund.metadata?.appointmentDepositRefundId && (!row.providerRef || row.providerRef === reference))) fail(409, 'Provider refund does not match this appointment deposit');
  return applyCardDepositRefund(ctx, refund);
}
