import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { decryptCredentials, encryptCredentials } from './connections';
import { fail, json, type Context } from './core';
import { ingestSamples, samplesSchema } from './wearables';
export const healthScope = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly';
const tokensSchema = z.object({ access_token: z.string().min(1), refresh_token: z.string().optional(), expires_in: z.number().positive().optional(), scope: z.string().optional() });
type HealthContext = Context & { clientId: string };
export function healthConfig() {
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID; const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.NEXTAUTH_URL) return fail(503, 'Configure the Google Health OAuth application before connecting Fitbit');
  return { clientId, clientSecret, redirectUri: new URL('/api/integrations/fitbit/callback', process.env.NEXTAUTH_URL).toString() };
}
export async function beginHealthOAuth(ctx: HealthContext) {
  const config = healthConfig(); const state = randomBytes(32).toString('base64url'); const verifier = randomBytes(48).toString('base64url');
  const provider = `google-health-state:${state}`;
  await prisma.integrationConnection.create({ data: { businessId: ctx.businessId, provider, encryptedCredentials: encryptCredentials(ctx.businessId, provider, { verifier, clientId: ctx.clientId, userId: ctx.user.id, expiresAt: Date.now() + 10 * 60000 }), configuration: {}, status: 'AUTHORIZING' } });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'code', scope: healthScope, state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent' }).toString();
  return { state, authorization_url: url.toString() };
}
async function tokenRequest(parameters: Record<string, string>) {
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(parameters), signal: AbortSignal.timeout(20000) });
  if (!response.ok) return fail(502, 'Google authorization failed. Reconnect your account.');
  return tokensSchema.parse(await response.json());
}
export async function completeHealthOAuth(ctx: HealthContext, state: string, code: string) {
  const config = healthConfig(); const stateProvider = `google-health-state:${state}`;
  const saved = await prisma.integrationConnection.findUnique({ where: { businessId_provider: { businessId: ctx.businessId, provider: stateProvider } } });
  if (!saved || saved.status !== 'AUTHORIZING') return fail(403, 'Authorization state is invalid or already used');
  const data = z.object({ verifier: z.string(), clientId: z.string(), userId: z.string(), expiresAt: z.number() }).parse(decryptCredentials(ctx.businessId, stateProvider, saved.encryptedCredentials));
  if (data.clientId !== ctx.clientId || data.userId !== ctx.user.id || data.expiresAt < Date.now()) return fail(403, 'Authorization state expired or belongs to another account');
  const claimed = await prisma.integrationConnection.deleteMany({ where: { id: saved.id, status: 'AUTHORIZING' } });
  if (!claimed.count) return fail(409, 'Authorization callback already processed');
  const tokens = await tokenRequest({ code, code_verifier: data.verifier, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: 'authorization_code' });
  if (!tokens.refresh_token || !tokens.scope?.split(' ').includes(healthScope)) return fail(422, 'Grant the requested activity permission and reconnect');
  const provider = `google-health:${ctx.clientId}`;
  const encryptedCredentials = encryptCredentials(ctx.businessId, provider, { ...tokens, expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000 });
  await prisma.integrationConnection.upsert({ where: { businessId_provider: { businessId: ctx.businessId, provider } }, create: { businessId: ctx.businessId, provider, encryptedCredentials, configuration: { clientId: ctx.clientId, consentedAt: new Date().toISOString(), scope: healthScope }, status: 'CONNECTED' }, update: { encryptedCredentials, status: 'CONNECTED', configuration: { clientId: ctx.clientId, consentedAt: new Date().toISOString(), scope: healthScope } } });
}
export const exerciseResponseSchema = z.object({ dataPoints: z.array(z.object({ name: z.string().min(1), exercise: z.object({ interval: z.object({ startTime: z.string().datetime(), endTime: z.string().datetime() }), activeDuration: z.string().regex(/^\d+(\.\d+)?s$/).optional(), metricsSummary: z.object({ steps: z.union([z.string(), z.number()]).optional() }).optional() }) })).default([]), nextPageToken: z.string().optional() });
export function exerciseSamples(body: z.infer<typeof exerciseResponseSchema>) {
  const rows: z.infer<typeof samplesSchema> = [];
  for (const p of body.dataPoints) {
    const e = p.exercise; const measuredAt = new Date(e.interval.startTime);
    const seconds = e.activeDuration ? Number(e.activeDuration.slice(0, -1)) : (new Date(e.interval.endTime).getTime() - measuredAt.getTime()) / 1000;
    rows.push({ externalId: p.name, metric: 'exercise_minutes', value: seconds / 60, unit: 'minutes', measuredAt });
    if (e.metricsSummary?.steps !== undefined) rows.push({ externalId: p.name, metric: 'steps', value: Number(e.metricsSummary.steps), unit: 'count', measuredAt });
  }
  return samplesSchema.parse(rows);
}
export async function syncGoogleHealth(ctx: HealthContext, pageToken?: string) {
  const config = healthConfig(); const provider = `google-health:${ctx.clientId}`;
  const row = await prisma.integrationConnection.findUnique({ where: { businessId_provider: { businessId: ctx.businessId, provider } } });
  if (!row || row.status !== 'CONNECTED') return fail(403, 'Connect your Google Health account first');
  const stored = z.object({ access_token: z.string(), refresh_token: z.string(), expiresAt: z.number() }).parse(decryptCredentials(ctx.businessId, provider, row.encryptedCredentials));
  let accessToken = stored.access_token;
  if (stored.expiresAt < Date.now() + 60000) {
    const tokens = await tokenRequest({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: stored.refresh_token, grant_type: 'refresh_token' });
    accessToken = tokens.access_token;
    await prisma.integrationConnection.update({ where: { id: row.id }, data: { encryptedCredentials: encryptCredentials(ctx.businessId, provider, { ...tokens, refresh_token: tokens.refresh_token || stored.refresh_token, expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000 }) } });
  }
  const url = new URL('https://health.googleapis.com/v4/users/me/dataTypes/exercise/dataPoints');
  url.searchParams.set('pageSize', '25');
  // Keep the filter stable across pages for this UTC calendar day.
  const from = new Date(); from.setUTCHours(0, 0, 0, 0); from.setUTCDate(from.getUTCDate() - 30);
  url.searchParams.set('filter', `exercise.interval.start_time >= "${from.toISOString()}"`);
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) return fail(502, 'Google Health sync failed. Check your permissions and reconnect if needed.');
  const body = exerciseResponseSchema.parse(await response.json());
  const result = await ingestSamples(ctx, 'google-health', exerciseSamples(body));
  return { ...result, nextPageToken: body.nextPageToken || null, note: 'Exercise-associated steps only; these are not whole-day step totals.' };
}
