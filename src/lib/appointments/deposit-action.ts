import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, type Context } from '@/lib/operations/core';
import { cashDepositLiabilityCents } from './deposit-ledger';
import { queueAppointmentEmail } from './notifications';

export const depositActionInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cash-collected'), reference: z.string().trim().min(4).max(120), reason: z.string().trim().min(5).max(500) }).strict(),
  z.object({ action: z.literal('waive'), reason: z.string().trim().min(5).max(500) }).strict(),
  z.object({ action: z.literal('cash-refund'), reference: z.string().trim().min(4).max(120), reason: z.string().trim().min(5).max(500), cashReturnedConfirmed: z.literal(true) }).strict(),
]);

export async function settleAppointmentDeposit(tx: Prisma.TransactionClient, ctx: Context, appointmentId: string, raw: unknown) {
  const input = depositActionInput.parse(raw);
  await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${appointmentId} FOR UPDATE`;
  const intent = await tx.appointmentDepositIntent.findFirst({
    where: { appointmentId, businessId: ctx.businessId },
    include: { appointment: { include: { client: true, location: true } }, ledgerEntries: true },
  });
  if (!intent || intent.appointment.location.businessId !== ctx.businessId) return fail(404, 'Deposit obligation not found');
  if (intent.currency !== 'USD' || !Number.isSafeInteger(intent.amountCents) || intent.amountCents <= 0)
    return fail(409, 'Deposit amount or currency requires reconciliation');

  if (input.action === 'cash-refund') {
    if (!['OWNER', 'MANAGER'].includes(ctx.user.role)) return fail(403, 'Manager approval is required for a cash deposit refund');
    if (intent.status !== 'PAID' || intent.collectionMethod !== 'CASH') return fail(409, 'Only an unapplied cash deposit can be refunded here');
    if (await tx.transaction.count({ where: { appointmentId } })) return fail(409, 'A linked POS sale must be refunded through its original payment');
    if (intent.ledgerEntries.some(entry => entry.businessId !== ctx.businessId || entry.locationId !== intent.appointment.locationId || entry.currency !== 'USD'))
      return fail(409, 'Deposit ledger requires business reconciliation');
    let liabilityCents: number;
    try { liabilityCents = cashDepositLiabilityCents(intent.amountCents, intent.ledgerEntries); }
    catch { return fail(409, 'Deposit liability requires reconciliation'); }
    if (liabilityCents !== intent.amountCents) return fail(409, 'Deposit has already been applied or refunded');
    const refund = await tx.appointmentDepositLedgerEntry.create({ data: {
      businessId: ctx.businessId, locationId: intent.appointment.locationId, depositIntentId: intent.id,
      kind: 'REFUNDED', amountCents: -intent.amountCents, currency: 'USD',
      reference: `${ctx.businessId}:${input.reference}`, actorId: ctx.user.id, reason: input.reason,
    } });
    const saved = await tx.appointmentDepositIntent.update({ where: { id: intent.id }, data: { status: 'REFUNDED', version: { increment: 1 } } });
    await tx.appointment.update({ where: { id: appointmentId }, data: { depositPaid: null, depositPaidAt: null, version: { increment: 1 } } });
    await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: intent.appointment, client: intent.appointment.client, kind: 'DEPOSIT_REFUND_EMAIL', eventKey: `cash-refund:${saved.version}`, amountCents: intent.amountCents, collectionMethod: 'CASH' });
    await audit(tx, ctx, 'APPOINTMENT_DEPOSIT_CASH_REFUNDED', 'AppointmentDepositIntent', intent.id, { appointmentId, ledgerEntryId: refund.id, amountCents: intent.amountCents, reference: refund.reference, reason: input.reason, confirmed: true });
    return { id: saved.id, appointmentId, amountCents: saved.amountCents, currency: saved.currency, status: saved.status, collectionMethod: saved.collectionMethod, reference: saved.reference, version: saved.version };
  }

  if (intent.status !== 'PENDING' || intent.appointment.status !== 'BOOKED') return fail(409, 'This deposit can no longer be settled from this screen');
  if (await tx.appointmentDepositCheckout.count({ where: { depositIntentId: intent.id, status: { in: ['PENDING', 'OPEN', 'UNKNOWN'] } } })) return fail(409, 'Reconcile or expire the open card checkout before collecting cash or waiving the deposit');
  if (intent.ledgerEntries.length) return fail(409, 'Deposit ledger already has an entry; reconcile before continuing');
  const now = new Date();
  const cash = input.action === 'cash-collected';
  const saved = await tx.appointmentDepositIntent.update({ where: { id: intent.id }, data: { status: cash ? 'PAID' : 'WAIVED', collectionMethod: cash ? 'CASH' : null, reference: cash ? `${ctx.businessId}:${input.reference}` : null, reason: input.reason, settledById: ctx.user.id, settledAt: now, version: { increment: 1 } } });
  let collectionId: string | null = null;
  if (cash) {
    const collection = await tx.appointmentDepositLedgerEntry.create({ data: {
      businessId: ctx.businessId, locationId: intent.appointment.locationId, depositIntentId: intent.id,
      kind: 'COLLECTED', amountCents: intent.amountCents, currency: 'USD', reference: saved.reference,
      actorId: ctx.user.id, reason: input.reason, createdAt: now,
    } });
    collectionId = collection.id;
    await tx.appointment.update({ where: { id: appointmentId }, data: { depositPaid: intent.amountCents / 100, depositPaidAt: now, version: { increment: 1 } } });
  }
  const client = intent.appointment.client;
  const deliveries = [
    ['CALENDAR_CREATE', 'calendar'],
    ...(client?.phone && client.allowSms !== false ? [['CONFIRMATION_SMS', 'twilio']] : []),
  ];
  await tx.integrationDelivery.createMany({ data: deliveries.map(([kind, provider]) => ({ businessId: ctx.businessId, appointmentId, kind, provider, dedupeKey: `${appointmentId}:${kind}:deposit-settled`, payload: { appointmentId } })) });
  await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: intent.appointment, client, kind: 'CONFIRMATION_EMAIL', eventKey: 'deposit-settled' });
  if (cash) await queueAppointmentEmail(tx, { businessId: ctx.businessId, appointment: intent.appointment, client, kind: 'DEPOSIT_PAID_EMAIL', eventKey: 'cash-collected', amountCents: intent.amountCents, collectionMethod: 'CASH' });
  await audit(tx, ctx, cash ? 'APPOINTMENT_DEPOSIT_CASH_COLLECTED' : 'APPOINTMENT_DEPOSIT_WAIVED', 'AppointmentDepositIntent', saved.id, { appointmentId, amountCents: intent.amountCents, ledgerEntryId: collectionId, reference: saved.reference, reason: input.reason });
  return { id: saved.id, appointmentId, amountCents: saved.amountCents, currency: saved.currency, status: saved.status, collectionMethod: saved.collectionMethod, reference: saved.reference, version: saved.version };
}
