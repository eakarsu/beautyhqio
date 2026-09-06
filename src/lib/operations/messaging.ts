import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { credentials } from './connections';
import { audit, fail, type Context } from './core';
export async function queueCampaign(tx: Prisma.TransactionClient, ctx: Context, id: string) {
  const campaign = await tx.campaign.findFirst({ where: { id, businessId: ctx.businessId } });
  if (!campaign) return fail(404, 'Campaign not found');
  if (!['draft', 'scheduled'].includes(campaign.status)) return fail(409, 'Campaign is already queued or sent');
  if (!['EMAIL', 'SMS'].includes(campaign.type)) return fail(422, 'Choose email or SMS delivery');
  if (campaign.targetSegment && campaign.targetSegment !== 'all') return fail(422, 'This segment needs explicit tag targeting before it can be sent');
  const clients = await tx.client.findMany({ where: { businessId: ctx.businessId, status: 'ACTIVE', ...(campaign.type === 'EMAIL' ? { allowEmail: true, email: { not: null } } : { allowSms: true }), ...(campaign.targetTags.length ? { tags: { hasSome: campaign.targetTags } } : {}) }, select: { id: true }, take: 10001 });
  if (clients.length > 10000) return fail(422, 'Narrow the campaign to at most 10,000 recipients');
  if (!clients.length) return fail(422, 'No consenting recipients match this campaign');
  await tx.outboundMessage.createMany({ data: clients.map(c => ({ businessId: ctx.businessId, campaignId: id, clientId: c.id, channel: campaign.type, subject: campaign.subject, content: campaign.content, dedupeKey: `campaign:${id}:${c.id}`, nextAttemptAt: campaign.scheduledAt && campaign.scheduledAt > new Date() ? campaign.scheduledAt : new Date() })), skipDuplicates: true });
  const updated = await tx.campaign.update({ where: { id }, data: { status: 'queued' } });
  await audit(tx, ctx, 'CAMPAIGN_QUEUED', 'Campaign', id, { recipients: clients.length, channel: campaign.type });
  return { success: true, campaign: updated, stats: { queued: clients.length, sent: 0 } };
}
class DeliveryError extends Error { constructor(message: string, public ambiguous = false, public retryable = false) { super(message); } }
export async function dispatchMessage(row: { id: string; businessId: string; clientId: string; channel: string; subject: string | null; content: string; campaignId: string | null }) {
  const client = await prisma.client.findFirst({ where: { id: row.clientId, businessId: row.businessId, status: 'ACTIVE' } });
  if (!client || (row.channel === 'EMAIL' ? !client.allowEmail || !client.email : !client.allowSms || !client.phone)) return { status: 'SUPPRESSED', providerRef: null };
  const content = row.content.replaceAll('{{firstName}}', client.firstName).replaceAll('{{lastName}}', client.lastName);
  let response: Response;
  if (row.channel === 'EMAIL') {
    const c = await credentials(row.businessId, 'resend');
    try { response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${c.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': row.id }, body: JSON.stringify({ from: c.from, to: [client.email], subject: row.subject || 'Message from your salon', text: content }) }); }
    catch { throw new DeliveryError('Provider response was not received', true); }
  } else if (row.channel === 'SMS') {
    const c = await credentials(row.businessId, 'twilio');
    if (!/^\+[1-9]\d{7,14}$/.test(client.phone)) throw new DeliveryError('Recipient phone must use international E.164 format');
    try { response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Messages.json`, { method: 'POST', signal: AbortSignal.timeout(20000), headers: { Authorization: `Basic ${Buffer.from(`${c.accountSid}:${c.authToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ To: client.phone, From: c.from, Body: content }) }); }
    catch { throw new DeliveryError('Provider response was not received', true); }
  } else throw new DeliveryError('Unsupported channel');
  if (!response.ok) throw new DeliveryError(`Provider HTTP ${response.status}`, response.status >= 500, response.status === 429);
  const body = await response.json();
  const ref = row.channel === 'EMAIL' ? body.id : body.sid;
  if (typeof ref !== 'string') throw new DeliveryError('Provider reference missing', true);
  return { status: 'ACCEPTED', providerRef: ref };
}
export async function processOutboundMessages(limit = 20) {
  if (process.env.ENABLE_OUTBOUND_DELIVERY !== 'true') return { enabled: false, processed: [] };
  // A timeout after provider acceptance must not cause a duplicate message.
  await prisma.outboundMessage.updateMany({ where: { status: 'PROCESSING', updatedAt: { lt: new Date(Date.now() - 5 * 60000) } }, data: { status: 'UNKNOWN', lastError: 'Worker stopped; reconcile with provider before retrying' } });
  const processed = [];
  for (let i = 0; i < Math.min(limit, 50); i++) {
    const row = await prisma.$transaction(async tx => {
      const next = await tx.outboundMessage.findFirst({ where: { status: { in: ['PENDING', 'RETRY'] }, attempts: { lt: 5 }, nextAttemptAt: { lte: new Date() } }, orderBy: { nextAttemptAt: 'asc' } });
      if (!next) return null;
      const claimed = await tx.outboundMessage.updateMany({ where: { id: next.id, status: next.status, attempts: next.attempts }, data: { status: 'PROCESSING', attempts: { increment: 1 } } });
      return claimed.count ? next : null;
    });
    if (!row) break;
    let status: string;
    try {
      const result = await dispatchMessage(row); status = result.status;
      await prisma.$transaction(async tx => {
        await tx.outboundMessage.update({ where: { id: row.id }, data: { status, providerRef: result.providerRef, lastError: null } });
        if (status === 'ACCEPTED' && row.campaignId) await tx.campaign.update({ where: { id: row.campaignId }, data: { sentCount: { increment: 1 } } });
        if (status === 'ACCEPTED') await tx.communication.create({ data: { clientId: row.clientId, type: row.channel, direction: 'OUTBOUND', content: row.content, status: 'accepted' } });
      });
    } catch (e) {
      status = e instanceof DeliveryError && e.ambiguous ? 'UNKNOWN' : e instanceof DeliveryError && e.retryable && row.attempts < 4 ? 'RETRY' : 'FAILED';
      await prisma.outboundMessage.update({ where: { id: row.id }, data: { status, lastError: e instanceof DeliveryError ? e.message : 'Provider configuration or delivery failed', nextAttemptAt: new Date(Date.now() + (row.attempts + 1) * 60000) } });
    }
    processed.push({ id: row.id, status });
  }
  return { enabled: true, processed };
}
