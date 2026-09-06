import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { fail } from './core';
export const connectionSchemas = {
  resend: z.object({ apiKey: z.string().min(10).max(500), from: z.string().min(5).max(250) }),
  twilio: z.object({ accountSid: z.string().regex(/^AC[0-9a-f]{32}$/i), authToken: z.string().min(20).max(200), from: z.string().regex(/^\+[1-9]\d{7,14}$/) }),
  stripe: z.object({ webhookSecret:z.string().startsWith('whsec_').max(500).optional(), secretKey: z.string().regex(/^(sk|rk)_(test|live)_/).max(500) }),
  google: z.object({ clientId: z.string().min(10).max(500), clientSecret: z.string().min(10).max(500), refreshToken: z.string().min(10).max(3000), calendarId: z.string().min(1).max(500) }),
  quickbooks: z.object({ clientId: z.string().min(5).max(500), clientSecret: z.string().min(10).max(500), refreshToken: z.string().min(10).max(3000), realmId: z.string().regex(/^\d+$/), sandbox: z.boolean().default(true) }),
} as const;
export const providerSchema = z.enum(['resend', 'twilio', 'stripe', 'google', 'quickbooks']);
function key() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(raw)) return fail(503, 'Integration encryption key is not configured');
  return Buffer.from(raw, 'hex');
}
export function encryptCredentials(businessId: string, provider: string, data: unknown) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(`${businessId}:${provider}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64')).join('.');
}
export function decryptCredentials(businessId: string, provider: string, sealed: string): unknown {
  const [iv, tag, encrypted] = sealed.split('.').map(s => Buffer.from(s, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', key(), iv); cipher.setAAD(Buffer.from(`${businessId}:${provider}`)); cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(encrypted), cipher.final()]).toString());
}
export async function credentials<P extends keyof typeof connectionSchemas>(businessId: string, provider: P): Promise<z.infer<(typeof connectionSchemas)[P]>> {
  const row = await prisma.integrationConnection.findUnique({ where: { businessId_provider: { businessId, provider } } });
  if (!row || row.status === 'DISCONNECTED') return fail(503, `${provider} is not connected for this business`);
  return connectionSchemas[provider].parse(decryptCredentials(businessId, provider, row.encryptedCredentials)) as z.infer<(typeof connectionSchemas)[P]>;
}
