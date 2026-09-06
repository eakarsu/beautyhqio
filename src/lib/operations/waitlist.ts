import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, idSchema, type Context } from './core';
export const waitlistSchema = z.object({ locationId: idSchema.optional(), clientId: idSchema.optional(), clientName: z.string().trim().min(1).max(150).optional(), phone: z.string().trim().max(30).optional(), consentToSms: z.boolean().default(false), serviceNotes: z.string().trim().max(1000).optional(), estimatedDuration: z.number().int().min(5).max(720).default(30) });
export async function addWaitlist(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof waitlistSchema>) {
  const location = await tx.location.findFirst({ where: { ...(input.locationId ? { id: input.locationId } : {}), businessId: ctx.businessId, isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!location) return fail(404, 'Location not found');
  let client = input.clientId ? await tx.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId } }) : null;
  if (input.clientId && !client) return fail(404, 'Client not found');
  if (!client) {
    if (!input.clientName) return fail(422, 'Choose a client or enter a walk-in name');
    const [firstName, ...rest] = input.clientName.split(/\s+/);
    client = await tx.client.create({ data: { businessId: ctx.businessId, firstName, lastName: rest.join(' '), phone: input.phone || '', allowSms: input.consentToSms, allowEmail: false, tags: [] } });
  }
  if (await tx.waitlistEntry.findFirst({ where: { clientId: client.id, locationId: location.id, status: { in: ['WAITING', 'NOTIFIED'] } } })) return fail(409, 'Client is already on the waitlist');
  const existing = await tx.waitlistEntry.findMany({ where: { locationId: location.id, status: { in: ['WAITING', 'NOTIFIED'] } }, orderBy: { position: 'asc' } });
  const entry = await tx.waitlistEntry.create({ data: { locationId: location.id, clientId: client.id, phone: client.phone, serviceNotes: input.serviceNotes, estimatedDuration: input.estimatedDuration, position: existing.length + 1, estimatedWait: existing.reduce((sum, e) => sum + (e.estimatedDuration || 30), 0) }, include: { client: true, location: true } });
  await audit(tx, ctx, 'WAITLIST_ADDED', 'WaitlistEntry', entry.id, { clientId: client.id, locationId: location.id });
  return entry;
}
export async function updateWaitlist(tx: Prisma.TransactionClient, ctx: Context, id: string, action: 'SEATED' | 'LEFT' | 'NOTIFIED') {
  const row = await tx.waitlistEntry.findFirst({ where: { id, location: { businessId: ctx.businessId } }, include: { client: true, location: true } });
  if (!row) return fail(404, 'Waitlist entry not found');
  if (!['WAITING', 'NOTIFIED'].includes(row.status)) return fail(409, 'This waitlist entry is already closed');
  if (action === 'NOTIFIED') {
    if (!row.client?.allowSms || !row.client.phone) return fail(422, 'Record client SMS consent and phone number before notifying');
    await tx.outboundMessage.upsert({ where: { dedupeKey: `waitlist:${row.id}` }, create: { businessId: ctx.businessId, clientId: row.client.id, channel: 'SMS', content: `Your place at ${row.location.name} is ready. Please return to the front desk.`, dedupeKey: `waitlist:${row.id}` }, update: {} });
    await audit(tx, ctx, 'WAITLIST_NOTIFICATION_QUEUED', 'WaitlistEntry', id, {});
    return { ...row, notificationQueued: true };
  }
  const updated = await tx.waitlistEntry.update({ where: { id }, data: { status: action, seatedAt: action === 'SEATED' ? new Date() : undefined, leftAt: action === 'LEFT' ? new Date() : undefined }, include: { client: true, location: true } });
  const remaining = await tx.waitlistEntry.findMany({ where: { locationId: row.locationId, status: { in: ['WAITING', 'NOTIFIED'] } }, orderBy: { position: 'asc' } });
  let wait = 0;
  for (let i = 0; i < remaining.length; i++) { await tx.waitlistEntry.update({ where: { id: remaining[i].id }, data: { position: i + 1, estimatedWait: wait } }); wait += remaining[i].estimatedDuration || 30; }
  await audit(tx, ctx, `WAITLIST_${action}`, 'WaitlistEntry', id, {});
  return updated;
}
