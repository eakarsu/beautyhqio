import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, fail, json, type Context } from './core';
import { encryptCredentials } from './connections';
export async function wearableContext(): Promise<Context & { clientId: string }> {
  const ctx = await context(['CLIENT']);
  if (!ctx.user.clientId) return fail(403, 'A linked client profile is required');
  return { ...ctx, clientId: ctx.user.clientId };
}
export const samplesSchema = z.array(z.object({ externalId: z.string().min(1).max(500), metric: z.enum(['steps', 'exercise_minutes']), value: z.number().finite().min(0).max(1000000), unit: z.enum(['count', 'minutes']), measuredAt: z.coerce.date() })).max(5000).refine(rows => rows.every(r => (r.metric === 'steps' ? r.unit === 'count' && Number.isInteger(r.value) : r.unit === 'minutes') && r.measuredAt <= new Date(Date.now() + 60000) && r.measuredAt > new Date('2000-01-01')), 'Invalid sample value, unit or time');
export async function ingestSamples(ctx: Context & { clientId: string }, provider: 'apple-health' | 'google-health', samples: z.infer<typeof samplesSchema>) {
  return prisma.$transaction(async tx => {
    const connection = await tx.integrationConnection.findUnique({ where: { businessId_provider: { businessId: ctx.businessId, provider: `${provider}:${ctx.clientId}` } } });
    if (!connection || connection.status !== 'CONNECTED') return fail(403, 'Connect and grant consent before importing samples');
    for (const s of samples) await tx.wearableSample.upsert({ where: { clientId_provider_externalId_metric: { clientId: ctx.clientId, provider, externalId: s.externalId, metric: s.metric } }, create: { ...s, businessId: ctx.businessId, clientId: ctx.clientId, provider }, update: { value: s.value, unit: s.unit, measuredAt: s.measuredAt } });
    await tx.integrationConnection.update({ where: { id: connection.id }, data: { lastVerifiedAt: new Date(), lastError: null } });
    await tx.wellnessAuditLog.create({ data: { businessId: ctx.businessId, clientId: ctx.clientId, userId: ctx.user.id, feature: provider, action: 'samples_imported', metadata: json({ count: samples.length }) } });
    return { success: true, samplesProcessed: samples.length, provider, provenance: provider === 'apple-health' ? 'Authenticated client device upload; not independently attested' : 'Google Health API', syncedAt: new Date() };
  });
}
export async function healthKitConsent(ctx: Context & { clientId: string }, granted: boolean) {
  const provider = `apple-health:${ctx.clientId}`;
  if (!granted) {
    await prisma.integrationConnection.deleteMany({ where: { businessId: ctx.businessId, provider } });
    return { connected: false, provider: 'apple-health' };
  }
  await prisma.integrationConnection.upsert({ where: { businessId_provider: { businessId: ctx.businessId, provider } }, create: { businessId: ctx.businessId, provider, encryptedCredentials: encryptCredentials(ctx.businessId, provider, {}), configuration: { clientId: ctx.clientId, consentedAt: new Date().toISOString(), metrics: ['steps'] }, status: 'CONNECTED' }, update: { status: 'CONNECTED', configuration: { clientId: ctx.clientId, consentedAt: new Date().toISOString(), metrics: ['steps'] } } });
  return { connected: true, provider: 'apple-health', nativeAuthorizationRequired: true };
}
