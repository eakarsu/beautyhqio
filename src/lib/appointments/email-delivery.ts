import { createHash } from 'node:crypto';
import { credentials } from '@/lib/operations/connections';

export const EMAIL_RETRY_WINDOW_MS = 23 * 60 * 60_000;
export type AppointmentEmailMessage = {
  id: string; businessId: string; from: string; to: string; subject: string; text: string;
  mode: 'sandbox' | 'live'; accountFingerprint: string;
};
export class AppointmentEmailError extends Error {
  constructor(public code: string, public retryable = false, public ambiguous = false) { super(code); }
}
export interface AppointmentEmailProvider {
  configuration(businessId: string): Promise<{ from: string; accountFingerprint: string }>;
  send(message: AppointmentEmailMessage): Promise<string>;
}

export function emailMode(): 'sandbox' | 'live' {
  const mode = process.env.APPOINTMENT_EMAIL_MODE || 'sandbox';
  if (mode !== 'sandbox' && mode !== 'live') throw new AppointmentEmailError('EMAIL_MODE_INVALID');
  return mode;
}
export function sandboxRecipient() {
  const recipient = (process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new AppointmentEmailError('EMAIL_SANDBOX_RECIPIENT_REQUIRED');
  return recipient;
}
const fingerprint = (key: string) => createHash('sha256').update(key).digest('hex');

/** The default transport is dormant until the explicit outbox delivery flag is on. */
export const resendAppointmentProvider: AppointmentEmailProvider = {
  async configuration(businessId) {
    const config = await credentials(businessId, 'resend');
    return { from: config.from, accountFingerprint: fingerprint(config.apiKey) };
  },
  async send(message) {
    if (process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED !== 'true') throw new AppointmentEmailError('EMAIL_DELIVERY_DISABLED');
    if (emailMode() !== message.mode || (message.mode === 'sandbox' && sandboxRecipient() !== message.to)) throw new AppointmentEmailError('EMAIL_MODE_CHANGED');
    const config = await credentials(message.businessId, 'resend');
    if (config.from !== message.from || fingerprint(config.apiKey) !== message.accountFingerprint) throw new AppointmentEmailError('EMAIL_CONNECTION_CHANGED');
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(20_000),
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': message.id },
        body: JSON.stringify({ from: message.from, to: [message.to], subject: message.subject, text: message.text }),
      });
    } catch { throw new AppointmentEmailError('EMAIL_PROVIDER_OUTCOME_UNKNOWN', true, true); }
    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) throw new AppointmentEmailError(`EMAIL_PROVIDER_HTTP_${response.status}`, true);
      throw new AppointmentEmailError(`EMAIL_PROVIDER_HTTP_${response.status}`);
    }
    const body = await response.json().catch(() => null) as { id?: unknown } | null;
    if (typeof body?.id !== 'string' || !body.id) throw new AppointmentEmailError('EMAIL_PROVIDER_REFERENCE_MISSING', true, true);
    return body.id;
  },
};
