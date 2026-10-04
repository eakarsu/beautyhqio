import { randomUUID } from 'node:crypto';
import { prisma as db } from '@/lib/prisma';
import type { Context } from '@/lib/operations/core';
import { settleAppointmentDeposit } from '../deposit-action';
import { AppointmentEmailError, type AppointmentEmailMessage, type AppointmentEmailProvider } from '../email-delivery';
import { rescheduleAppointment } from '../reschedule';
import { createAppointment, transitionAppointment } from '../service';
import { processIntegrationDeliveries } from '@/lib/integration-deliveries';

const suite = process.env.RUN_OPERATIONS_INTEGRATION === 'true' ? describe : describe.skip;
if (process.env.RUN_OPERATIONS_INTEGRATION === 'true' && !new URL(process.env.DATABASE_URL!).searchParams.get('schema')?.startsWith('beauty_ops_test_')) throw Error('Notification tests require a disposable schema');
suite('governed appointment email outbox', () => {
  let ctx: Context, locationId: string, staffId: string, clientId: string, regularServiceId: string, depositServiceId: string, businessName: string;
  const sent: AppointmentEmailMessage[] = [];
  let failNext = false;
  const provider: AppointmentEmailProvider = {
    configuration: async () => ({ from: 'Fixture <fixture@example.test>', accountFingerprint: 'fixture-account' }),
    send: async message => { sent.push({ ...message }); if (failNext) { failNext = false; throw new AppointmentEmailError('EMAIL_PROVIDER_HTTP_503', true); } return `email-fixture-${message.id}`; },
  };
  const prior = { enabled: process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED, mode: process.env.APPOINTMENT_EMAIL_MODE, recipient: process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT };
  const day = (days: number) => new Date(Date.now() + days * 86400000);
  async function book(days: number, serviceId = regularServiceId) {
    return (await createAppointment(db, ctx.user, { clientId, locationId, staffId, scheduledStart: day(days), serviceIds: [serviceId], source: 'PHONE' }, randomUUID())).appointment;
  }
  async function only(id: string) {
    await db.integrationDelivery.updateMany({ where: { status: { in: ['PENDING', 'RETRY'] } }, data: { nextAttemptAt: new Date('2099-01-01T00:00:00Z') } });
    await db.integrationDelivery.update({ where: { id }, data: { nextAttemptAt: new Date(0) } });
  }
  async function delivery(appointmentId: string, kind: string) { return db.integrationDelivery.findFirstOrThrow({ where: { appointmentId, kind }, orderBy: { createdAt: 'desc' } }); }
  beforeAll(async () => {
    process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED = 'true'; process.env.APPOINTMENT_EMAIL_MODE = 'sandbox'; process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT = 'sandbox@example.test';
    const business = await db.business.create({ data: { name: 'Notification fixture salon', type: 'SPA' } }); businessName = business.name;
    const owner = await db.user.create({ data: { businessId: business.id, email: `${randomUUID()}@test.invalid`, firstName: 'Owner', lastName: 'Fixture', role: 'OWNER' } });
    ctx = { businessId: business.id, user: { ...owner, businessName: business.name, staffId: null, clientId: null, isPlatformAdmin: false } };
    const location = await db.location.create({ data: { businessId: business.id, name: 'Main', address: '1 Test Way', city: 'Test', state: 'NY', zip: '10001' } }); locationId = location.id;
    staffId = (await db.staff.create({ data: { userId: owner.id, locationId, specialties: [], serviceIds: [] } })).id;
    clientId = (await db.client.create({ data: { businessId: business.id, firstName: 'Mail', lastName: 'Client', phone: '5550102424', email: 'client@example.test' } })).id;
    regularServiceId = (await db.service.create({ data: { businessId: business.id, name: 'Haircut', price: 50, duration: 30 } })).id;
    depositServiceId = (await db.service.create({ data: { businessId: business.id, name: 'Treatment', price: 80, duration: 30, requireDeposit: true, depositAmount: 20 } })).id;
  });
  afterAll(async () => {
    for (const [key, value] of Object.entries({ APPOINTMENT_EMAIL_DELIVERY_ENABLED: prior.enabled, APPOINTMENT_EMAIL_MODE: prior.mode, APPOINTMENT_EMAIL_TEST_RECIPIENT: prior.recipient })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await db.$disconnect();
  });
  test('booking is accepted once; opted-out and cross-tenant rows never reach the provider', async () => {
    const booked = await book(18);
    const confirmation = await delivery(booked.id, 'CONFIRMATION_EMAIL');
    await only(confirmation.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: confirmation.id, status: 'DELIVERED' }]);
    expect(sent.at(-1)).toMatchObject({ id: confirmation.id, businessId: ctx.businessId, to: 'sandbox@example.test', mode: 'sandbox' });
    expect(sent.at(-1)?.text).toContain('Haircut');
    const count = sent.length;
    expect(await processIntegrationDeliveries(1, provider)).toEqual([]);
    expect(sent).toHaveLength(count);

    const opted = await book(19);
    const optedEmail = await delivery(opted.id, 'CONFIRMATION_EMAIL');
    await db.client.update({ where: { id: clientId }, data: { allowEmail: false } });
    await only(optedEmail.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: optedEmail.id, status: 'DELIVERED' }]);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: optedEmail.id } })).providerRef).toBe('suppressed-consent-or-contact');
    expect(sent).toHaveLength(count);
    await db.client.update({ where: { id: clientId }, data: { allowEmail: true } });

    const other = await db.business.create({ data: { name: 'Other salon', type: 'SPA' } });
    const forged = await db.integrationDelivery.create({ data: { businessId: other.id, appointmentId: booked.id, kind: 'CANCELLATION_EMAIL', provider: 'resend', dedupeKey: randomUUID(), payload: { clientId, scheduledStart: booked.scheduledStart.toISOString() } } });
    await only(forged.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: forged.id, status: 'DELIVERED' }]);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: forged.id } })).providerRef).toBe('suppressed-tenant-or-missing');
    expect(sent).toHaveLength(count);

    const sandboxQueued = await book(26);
    const sandboxEmail = await delivery(sandboxQueued.id, 'CONFIRMATION_EMAIL');
    process.env.APPOINTMENT_EMAIL_MODE = 'live';
    await only(sandboxEmail.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: sandboxEmail.id, status: 'DELIVERED' }]);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: sandboxEmail.id } })).providerRef).toBe('suppressed-delivery-mode-changed');
    expect(sent).toHaveLength(count);
    process.env.APPOINTMENT_EMAIL_MODE = 'sandbox';
  });
  test('deposit due becomes stale on cash collection; receipt survives a later reschedule', async () => {
    const booked = await book(20, depositServiceId);
    const due = await delivery(booked.id, 'DEPOSIT_REQUEST_EMAIL');
    expect((await db.integrationDelivery.count({ where: { appointmentId: booked.id, kind: 'CONFIRMATION_EMAIL' } }))).toBe(0);
    const input = { action: 'cash-collected', reference: 'mail-deposit-cash', reason: 'Client handed cash to cashier' };
    await db.$transaction(tx => settleAppointmentDeposit(tx, ctx, booked.id, input));
    const confirmation = await delivery(booked.id, 'CONFIRMATION_EMAIL');
    const paid = await delivery(booked.id, 'DEPOSIT_PAID_EMAIL');
    await only(due.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: due.id, status: 'DELIVERED' }]);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: due.id } })).providerRef).toBe('suppressed-stale-deposit-request');
    const current = await db.appointment.findUniqueOrThrow({ where: { id: booked.id } });
    await db.$transaction(tx => rescheduleAppointment(tx, ctx, booked.id, { scheduledStart: day(25), version: current.version, reason: 'Client requested a later day' }));
    await only(confirmation.id); await processIntegrationDeliveries(1, provider);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: confirmation.id } })).providerRef).toBe('suppressed-stale-schedule');
    await only(paid.id); await processIntegrationDeliveries(1, provider);
    expect(sent.find(message => message.id === paid.id)?.text).toContain('$20.00 cash deposit');
    expect(await db.integrationDelivery.count({ where: { appointmentId: booked.id, kind: 'DEPOSIT_PAID_EMAIL' } })).toBe(1);
  });
  test('reschedule suppresses the old booking snapshot and cancellation gets its own notice', async () => {
    const booked = await book(21);
    const original = await delivery(booked.id, 'CONFIRMATION_EMAIL');
    const next = day(22);
    await db.$transaction(tx => rescheduleAppointment(tx, ctx, booked.id, { scheduledStart: next, version: booked.version, reason: 'Client requested a later day' }));
    const moved = await delivery(booked.id, 'RESCHEDULE_EMAIL');
    await only(original.id); await processIntegrationDeliveries(1, provider);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: original.id } })).providerRef).toBe('suppressed-stale-schedule');
    await only(moved.id); await processIntegrationDeliveries(1, provider);
    expect(sent.find(message => message.id === moved.id)?.text).toContain('moved');
    await transitionAppointment(db, ctx.user, booked.id, 'CANCELLED', 'Client requested cancellation');
    const cancelled = await delivery(booked.id, 'CANCELLATION_EMAIL');
    await only(cancelled.id); await processIntegrationDeliveries(1, provider);
    expect(sent.find(message => message.id === cancelled.id)?.text).toContain('was cancelled');
  });
  test('provider retry freezes the exact payload and stops before the provider key expires', async () => {
    const booked = await book(23);
    const email = await delivery(booked.id, 'CONFIRMATION_EMAIL');
    await only(email.id);
    failNext = true;
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: email.id, status: 'RETRY' }]);
    const first = sent.at(-1)!;
    await db.business.update({ where: { id: ctx.businessId }, data: { name: `${businessName} renamed` } });
    await only(email.id);
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: email.id, status: 'DELIVERED' }]);
    expect(sent.at(-1)).toEqual(first);
    expect(sent.at(-1)?.id).toBe(email.id);

    const another = await book(24);
    const aging = await delivery(another.id, 'CONFIRMATION_EMAIL');
    failNext = true; await only(aging.id); await processIntegrationDeliveries(1, provider);
    const before = sent.length;
    await db.integrationDelivery.update({ where: { id: aging.id }, data: { providerAttemptedAt: new Date(Date.now() - 24 * 3600000), nextAttemptAt: new Date(0) } });
    expect(await processIntegrationDeliveries(1, provider)).toEqual([{ id: aging.id, status: 'DEAD_LETTER' }]);
    expect(sent).toHaveLength(before);
    expect((await db.integrationDelivery.findUniqueOrThrow({ where: { id: aging.id } })).lastErrorCode).toBe('EMAIL_RECONCILIATION_REQUIRED');
  });
});
