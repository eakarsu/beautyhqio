import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { prisma as db } from '@/lib/prisma';
import { encryptCredentials } from '@/lib/operations/connections';
import { mutation, type Context } from '@/lib/operations/core';
import { reviewTax, createSale, saleAction } from '@/lib/operations/sales';
import { cashAction, cashActor, drawerPreview } from '@/lib/operations/cash-drawer';
import { refundSalePayment } from '@/lib/operations/sale-payments';
import { settleAppointmentDeposit } from '../deposit-action';
import { transitionAppointment } from '../service';
import { applyCardDepositCheckout, reconcileCardDeposit, requestCardDepositRefund, startCardDepositCheckout } from '../card-deposit';
import { POST as webhook } from '@/app/api/operations/stripe-hook/[businessId]/route';

const suite = process.env.RUN_OPERATIONS_INTEGRATION === 'true' ? describe : describe.skip;
if (process.env.RUN_OPERATIONS_INTEGRATION === 'true' && !new URL(process.env.DATABASE_URL!).searchParams.get('schema')?.startsWith('beauty_ops_test_')) throw Error('Card deposit tests require a disposable schema');
suite('Stripe test card appointment deposits', () => {
  let ctx: Context, otherClientCtx: Context, clientCtx: Context, locationId: string, staffId: string, serviceId: string, clientId: string;
  let appointmentNumber = 0;
  const oldFlag = process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED;
  const oldEncryption = process.env.INTEGRATION_ENCRYPTION_KEY;
  const req = (key: string = randomUUID()) => new Request('http://localhost/api/appointments/deposit', { method: 'POST', headers: { 'Idempotency-Key': key } });
  const session = (checkout: { id: string; amountCents: number; businessId: string; appointmentId: string; depositIntentId: string }, paid = true) => ({
    id: `cs_${checkout.id}`, object: 'checkout.session', mode: 'payment', status: paid ? 'complete' : 'open', payment_status: paid ? 'paid' : 'unpaid',
    amount_total: checkout.amountCents, currency: 'usd', payment_intent: `pi_${checkout.id}`, client_reference_id: checkout.id,
    url: 'https://checkout.stripe.com/test/fixture', metadata: { businessId: checkout.businessId, appointmentId: checkout.appointmentId, depositIntentId: checkout.depositIntentId, appointmentDepositCheckoutId: checkout.id },
  }) as unknown as Stripe.Checkout.Session;
  async function appointment(amountCents = 2500) {
    const start = new Date(Date.UTC(2031, 5, 10 + appointmentNumber++, 14));
    const row = await db.appointment.create({ data: { businessId: ctx.businessId, clientId, locationId, staffId, status: 'BOOKED', scheduledStart: start, scheduledEnd: new Date(start.getTime() + 30 * 60_000) } });
    const intent = await db.appointmentDepositIntent.create({ data: { businessId: ctx.businessId, appointmentId: row.id, amountCents } });
    return { row, intent };
  }
  beforeAll(async () => {
    process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = 'true';
    process.env.INTEGRATION_ENCRYPTION_KEY = 'cd'.repeat(32);
    const business = await db.business.create({ data: { name: 'Card deposit fixture', type: 'SPA' } });
    const owner = await db.user.create({ data: { businessId: business.id, email: `owner-${business.id}@test.invalid`, firstName: 'Owner', lastName: 'Fixture', role: 'OWNER' } });
    ctx = { businessId: business.id, user: { ...owner, businessName: business.name, staffId: null, clientId: null, isPlatformAdmin: false } };
    const location = await db.location.create({ data: { businessId: business.id, name: 'Fixture', address: '1 Test Way', city: 'Test', state: 'NY', zip: '10001' } }); locationId = location.id;
    staffId = (await db.staff.create({ data: { userId: owner.id, locationId, specialties: [], serviceIds: [] } })).id;
    serviceId = (await db.service.create({ data: { businessId: business.id, name: 'Fixture service', price: 100, duration: 30 } })).id;
    const client = await db.client.create({ data: { businessId: business.id, firstName: 'Card', lastName: 'Client', phone: '5550102399' } }); clientId = client.id;
    const clientUser = await db.user.create({ data: { businessId: business.id, email: `client-${business.id}@test.invalid`, firstName: 'Card', lastName: 'Client', role: 'CLIENT' } });
    await db.client.update({ where: { id: client.id }, data: { userId: clientUser.id } });
    clientCtx = { businessId: business.id, user: { ...clientUser, businessName: business.name, staffId: null, clientId: client.id, isPlatformAdmin: false } };
    const other = await db.client.create({ data: { businessId: business.id, firstName: 'Other', lastName: 'Client', phone: '5550102400' } });
    otherClientCtx = { ...clientCtx, user: { ...clientCtx.user, clientId: other.id } };
    await db.integrationConnection.create({ data: { businessId: business.id, provider: 'stripe', status: 'CONFIGURED', configuration: {}, encryptedCredentials: encryptCredentials(business.id, 'stripe', { secretKey: 'sk_test_card_deposit_fixture', webhookSecret: 'whsec_card_deposit_fixture' }) } });
    await mutation(ctx, req(), 'tax', {}, tx => reviewTax(tx, ctx, { taxRate: 0, servicesTaxable: false, reviewConfirmed: true }));
  });
  afterAll(async () => {
    if (oldFlag === undefined) delete process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED; else process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = oldFlag;
    if (oldEncryption === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY; else process.env.INTEGRATION_ENCRYPTION_KEY = oldEncryption;
    await db.$disconnect();
  });
  test('scope, test gate, timeout replay and signed capture gate confirmation', async () => {
    const { row } = await appointment();
    const opening = { action: 'OPEN', locationId, openingAmount: 100, notes: 'Physical cash float before card deposit', confirmed: true };
    const drawer = await mutation(ctx, req(), 'cash-drawer', opening, tx => cashAction(tx, ctx, opening), tx => cashActor(tx, ctx)) as { id: string };
    const providerKeys: string[] = [];
    let calls = 0;
    const provider = { checkout: { sessions: { create: async (_input: unknown, options: { idempotencyKey: string }) => {
      providerKeys.push(options.idempotencyKey); calls++;
      if (calls === 1) throw Error('Mock timeout after provider accepted');
      const checkout = await db.appointmentDepositCheckout.findFirstOrThrow({ where: { appointmentId: row.id } });
      return session(checkout, false);
    }, retrieve: async () => { throw Error('Unexpected retrieve'); } } } } as unknown as Stripe;
    const factory = async () => provider;
    await expect(startCardDepositCheckout(otherClientCtx, req(), row.id, factory)).rejects.toThrow(/not found/);
    await expect(startCardDepositCheckout({ ...ctx, businessId: 'foreign' }, req(), row.id, factory)).rejects.toThrow(/not found/);
    process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = 'false';
    await expect(startCardDepositCheckout(clientCtx, req(), row.id, factory)).rejects.toThrow(/test environment/);
    process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = 'true';
    const key = 'deposit-card-timeout-retry';
    await expect(startCardDepositCheckout(clientCtx, req(key), row.id, factory)).rejects.toThrow(/Mock timeout/);
    expect((await db.appointmentDepositCheckout.findFirstOrThrow({ where: { appointmentId: row.id } })).status).toBe('UNKNOWN');
    await expect(settleAppointmentDeposit(db as any, ctx, row.id, { action: 'cash-collected', reference: 'blocked-cash', reason: 'In person payment' })).rejects.toThrow(/open card checkout/);
    const started = await startCardDepositCheckout(clientCtx, req(key), row.id, factory);
    expect(started.status).toBe('OPEN');
    expect(new Set(providerKeys).size).toBe(1);
    const checkout = await db.appointmentDepositCheckout.findFirstOrThrow({ where: { appointmentId: row.id } });
    await expect(applyCardDepositCheckout(ctx, { ...session(checkout), amount_total: 2499 })).rejects.toThrow(/amount/);
    expect((await db.appointmentDepositIntent.findFirstOrThrow({ where: { appointmentId: row.id } })).status).toBe('PENDING');
    await expect(transitionAppointment(db, ctx.user, row.id, 'CONFIRMED')).rejects.toThrow(/deposit must be collected/);
    const payload = JSON.stringify({ id: 'evt_card_capture_fixture', object: 'event', type: 'checkout.session.completed', data: { object: session(checkout) } });
    const send = (signature: string) => webhook(new Request('http://localhost/api/operations/stripe-hook', { method: 'POST', headers: { 'stripe-signature': signature }, body: payload }), { params: Promise.resolve({ businessId: ctx.businessId }) });
    expect((await send('forged')).status).toBe(400);
    expect((await db.appointmentDepositLedgerEntry.count({ where: { depositIntentId: checkout.depositIntentId } }))).toBe(0);
    const signature = new Stripe('sk_test_card_deposit_fixture').webhooks.generateTestHeaderString({ payload, secret: 'whsec_card_deposit_fixture' });
    process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = 'false';
    expect((await send(signature)).status).toBe(503);
    process.env.SALON_DEPOSIT_STRIPE_TEST_ENABLED = 'true';
    expect((await send(signature)).status).toBe(200);
    expect((await send(signature)).status).toBe(200);
    expect((await db.appointmentDepositLedgerEntry.count({ where: { depositIntentId: checkout.depositIntentId, kind: 'COLLECTED' } }))).toBe(1);
    expect((await db.appointmentDepositIntent.findUniqueOrThrow({ where: { id: checkout.depositIntentId } })).collectionMethod).toBe('CARD');
    expect((await db.appointmentDepositCheckout.findUniqueOrThrow({ where: { id: checkout.id } })).paymentIntentId).toBe(`pi_${checkout.id}`);
    expect(await db.integrationDelivery.count({ where: { appointmentId: row.id, kind: 'CALENDAR_CREATE' } })).toBe(1);
    const cash = await drawerPreview(db, ctx, drawer.id);
    expect((cash.snapshot as { expectedCents: number; receipts: unknown[] }).expectedCents).toBe(10000);
    expect((cash.snapshot as { expectedCents: number; receipts: unknown[] }).receipts).toHaveLength(0);
    expect((await transitionAppointment(db, ctx.user, row.id, 'CONFIRMED')).status).toBe('CONFIRMED');
  });
  test('captured card liability is applied once to POS and refunded through the card path', async () => {
    const { row, intent } = await appointment(2500);
    const checkout = await db.appointmentDepositCheckout.create({ data: { businessId: ctx.businessId, appointmentId: row.id, depositIntentId: intent.id, clientId, amountCents: 2500, requestKey: randomUUID(), createdById: ctx.user.id } });
    await applyCardDepositCheckout(ctx, session(checkout));
    await db.appointment.update({ where: { id: row.id }, data: { status: 'COMPLETED' } });
    const sale = await mutation(ctx, req(), 'sale.create', {}, tx => createSale(tx, ctx, { locationId, staffId, clientId, appointmentId: row.id, items: [{ id: serviceId, type: 'SERVICE', quantity: 1 }] }));
    const credit = await db.transactionPayment.findFirstOrThrow({ where: { transactionId: sale.id } });
    expect((await applyCardDepositCheckout(ctx, session(checkout))).status).toBe('PAID');
    expect(credit).toMatchObject({ method: 'CREDIT_CARD', source: 'APPOINTMENT_DEPOSIT', stripePaymentId: `pi_${checkout.id}` });
    expect(await db.appointmentDepositLedgerEntry.count({ where: { depositIntentId: intent.id, kind: 'APPLIED', transactionPaymentId: credit.id } })).toBe(1);
    await expect(requestCardDepositRefund(ctx, req(), row.id, 'After sale refund', async () => ({} as Stripe))).rejects.toThrow(/unapplied card deposit/);
    await mutation(ctx, req(), 'sale.issue', {}, tx => saleAction(tx, ctx, { action: 'issue', id: sale.id, version: 1, reviewConfirmed: true }));
    let refund: Stripe.Refund;
    const provider = { refunds: { create: async (input: any) => { refund = { id: 're_card_sale_fixture', status: 'pending', amount: input.amount, currency: 'usd', payment_intent: input.payment_intent, metadata: input.metadata } as Stripe.Refund; return refund; }, retrieve: async () => refund } } as unknown as Stripe;
    const reserved = await refundSalePayment(ctx, req(), { paymentId: credit.id, amount: 25, reason: 'Refund card sale credit' }, async () => provider);
    expect(reserved.status).toBe('PROCESSING');
    await (await import('@/lib/operations/sale-payments')).applySaleRefund(ctx, { ...refund!, status: 'succeeded' });
    expect((await db.paymentRefund.findUniqueOrThrow({ where: { id: reserved.id } })).status).toBe('SUCCEEDED');
  });
  test('unapplied capture has one provider refund and one liability reversal', async () => {
    const { row, intent } = await appointment(2000);
    const checkout = await db.appointmentDepositCheckout.create({ data: { businessId: ctx.businessId, appointmentId: row.id, depositIntentId: intent.id, clientId, amountCents: 2000, requestKey: randomUUID(), createdById: ctx.user.id } });
    await applyCardDepositCheckout(ctx, session(checkout));
    let refund: Stripe.Refund;
    let calls = 0;
    const keys: string[] = [];
    const provider = { refunds: { create: async (input: any, options: { idempotencyKey: string }) => { calls++; keys.push(options.idempotencyKey); refund = { id: 're_card_deposit_fixture', status: 'pending', amount: input.amount, currency: 'usd', payment_intent: input.payment_intent, metadata: input.metadata } as Stripe.Refund; if (calls === 1) throw Error('Mock refund timeout after acceptance'); return refund; }, retrieve: async () => refund } } as unknown as Stripe;
    const refundKey = 'card-deposit-refund-key';
    await expect(requestCardDepositRefund(ctx, req(refundKey), row.id, 'Appointment cancelled by client', async () => provider)).rejects.toThrow(/Mock refund timeout/);
    expect((await db.appointmentDepositRefund.findFirstOrThrow({ where: { depositIntentId: intent.id } })).status).toBe('UNKNOWN');
    const result = await requestCardDepositRefund(ctx, req(refundKey), row.id, 'Appointment cancelled by client', async () => provider);
    expect(result.status).toBe('PROCESSING');
    expect((await db.appointmentDepositIntent.findUniqueOrThrow({ where: { id: intent.id } })).status).toBe('PAID');
    expect(await db.appointmentDepositLedgerEntry.count({ where: { depositIntentId: intent.id, kind: 'REFUNDED' } })).toBe(0);
    const payload = JSON.stringify({ id: 'evt_card_refund_fixture', object: 'event', type: 'refund.updated', data: { object: { ...refund!, status: 'succeeded' } } });
    const signature = new Stripe('sk_test_card_deposit_fixture').webhooks.generateTestHeaderString({ payload, secret: 'whsec_card_deposit_fixture' });
    const send = () => webhook(new Request('http://localhost/api/operations/stripe-hook', { method: 'POST', headers: { 'stripe-signature': signature }, body: payload }), { params: Promise.resolve({ businessId: ctx.businessId }) });
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    expect((await db.appointmentDepositIntent.findUniqueOrThrow({ where: { id: intent.id } })).status).toBe('REFUNDED');
    expect(await db.appointmentDepositLedgerEntry.count({ where: { depositIntentId: intent.id, kind: 'REFUNDED' } })).toBe(1);
    await expect(transitionAppointment(db, ctx.user, row.id, 'CONFIRMED')).rejects.toThrow(/deposit must be collected/);
    expect(calls).toBe(2);
    expect(new Set(keys).size).toBe(1);
  });
  test('capture after cancellation remains a refundable liability without confirmation delivery', async () => {
    const { row, intent } = await appointment(1500);
    const checkout = await db.appointmentDepositCheckout.create({ data: { businessId: ctx.businessId, appointmentId: row.id, depositIntentId: intent.id, clientId, amountCents: 1500, requestKey: randomUUID(), createdById: ctx.user.id, status: 'OPEN', providerRef: 'cs_late_capture' } });
    await db.appointment.update({ where: { id: row.id }, data: { status: 'CANCELLED' } });
    await db.appointmentDepositIntent.update({ where: { id: intent.id }, data: { status: 'CANCELLED' } });
    await applyCardDepositCheckout(ctx, { ...session(checkout), id: 'cs_late_capture' });
    expect((await db.appointmentDepositIntent.findUniqueOrThrow({ where: { id: intent.id } })).status).toBe('PAID');
    expect(await db.integrationDelivery.count({ where: { appointmentId: row.id } })).toBe(0);
  });
  test('manager can expire an open signed provider checkout before cash collection', async () => {
    const { row, intent } = await appointment(1800);
    const checkout = await db.appointmentDepositCheckout.create({ data: { businessId: ctx.businessId, appointmentId: row.id, depositIntentId: intent.id, clientId, amountCents: 1800, requestKey: randomUUID(), createdById: ctx.user.id, status: 'OPEN', providerRef: 'cs_card_expire_fixture' } });
    const provider = { checkout: { sessions: { retrieve: async () => ({ ...session(checkout, false), id: 'cs_card_expire_fixture' }), expire: async () => ({ ...session(checkout, false), id: 'cs_card_expire_fixture', status: 'expired' }) } } } as unknown as Stripe;
    await expect(reconcileCardDeposit(otherClientCtx, row.id, 'checkout', 'cs_card_expire_fixture', true, async () => provider)).rejects.toThrow(/Manager/);
    const saved = await reconcileCardDeposit(ctx, row.id, 'checkout', 'cs_card_expire_fixture', true, async () => provider);
    expect(saved.status).toBe('EXPIRED');
    const collected = await mutation(ctx, req(), 'appointment.deposit.settle', { appointmentId: row.id, action: 'cash-collected', reference: 'after-card-expiry', reason: 'Customer paid cash instead' }, tx => settleAppointmentDeposit(tx, ctx, row.id, { action: 'cash-collected', reference: 'after-card-expiry', reason: 'Customer paid cash instead' }));
    expect(collected.status).toBe('PAID');
    expect(collected.collectionMethod).toBe('CASH');
  });
});
