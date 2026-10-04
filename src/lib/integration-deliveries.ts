import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationSMS } from "@/lib/twilio";
import { syncAppointmentToCalendars } from "@/lib/calendar-sync";
import { retryDelayMs } from "@/lib/appointments/domain";
import { APPOINTMENT_EMAIL_KINDS, type AppointmentEmailKind } from '@/lib/appointments/notifications';
import { AppointmentEmailError, EMAIL_RETRY_WINDOW_MS, emailMode, sandboxRecipient, resendAppointmentProvider, type AppointmentEmailMessage, type AppointmentEmailProvider } from '@/lib/appointments/email-delivery';
import type { IntegrationDelivery, Prisma } from '@prisma/client';

const EMAIL_KINDS: readonly string[] = APPOINTMENT_EMAIL_KINDS;
const payloadObject = (value: Prisma.JsonValue): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
function displayTime(value: Date, timeZone: string) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(value); }
  catch { return value.toISOString(); }
}
function content(kind: AppointmentEmailKind, details: { clientName: string; businessName: string; service: string; when: string; previous?: string; amountCents?: number; method?: string; link?: string }) {
  const { clientName, businessName, service, when, previous, amountCents, method, link } = details;
  const amount = amountCents === undefined ? '' : `$${(amountCents / 100).toFixed(2)}`;
  const opening = `Hello ${clientName},\n\n`;
  const subject = {
    CONFIRMATION_EMAIL: `Appointment booked with ${businessName}`,
    DEPOSIT_REQUEST_EMAIL: `Deposit due for your ${businessName} appointment`,
    DEPOSIT_PAID_EMAIL: `Deposit received by ${businessName}`,
    DEPOSIT_REFUND_EMAIL: `Deposit refund recorded by ${businessName}`,
    RESCHEDULE_EMAIL: `Your ${businessName} appointment has moved`,
    CANCELLATION_EMAIL: `Your ${businessName} appointment was cancelled`,
  }[kind];
  const body = {
    CONFIRMATION_EMAIL: `Your ${service} appointment is booked for ${when}.`,
    DEPOSIT_REQUEST_EMAIL: `Your ${service} appointment is booked for ${when}. A ${amount} deposit is due before confirmation or check-in.${link ? ` Sign in to review and pay: ${link}` : ' Please contact the salon to arrange payment.'}`,
    DEPOSIT_PAID_EMAIL: `We recorded your ${amount} ${method === 'CARD' ? 'card' : 'cash'} deposit for your ${service} appointment on ${when}. This is a deposit acknowledgement, not the final service receipt.`,
    DEPOSIT_REFUND_EMAIL: `We recorded a ${amount} refund of your ${method === 'CARD' ? 'card' : 'cash'} deposit for the appointment on ${when}.`,
    RESCHEDULE_EMAIL: `Your ${service} appointment moved${previous ? ` from ${previous}` : ''} to ${when}.`,
    CANCELLATION_EMAIL: `Your ${service} appointment scheduled for ${when} was cancelled.`,
  }[kind];
  return { subject: subject.slice(0, 180), text: `${opening}${body}\n\n${businessName}`.slice(0, 5000) };
}

async function dispatch(delivery: IntegrationDelivery, emailProvider: AppointmentEmailProvider) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: delivery.appointmentId, location: { businessId: delivery.businessId } },
    include: { client: true, staff: { include: { user: true } }, services: { include: { service: true } }, location: { include: { business: true } }, depositIntent: true },
  });
  if (!appointment || (appointment.businessId && appointment.businessId !== delivery.businessId)) return 'suppressed-tenant-or-missing';
  if (['CALENDAR_CREATE', 'CONFIRMATION_SMS'].includes(delivery.kind) && (!['BOOKED', 'CONFIRMED'].includes(appointment.status) || appointment.depositIntent?.status === 'PENDING')) return 'suppressed-stale';
  if (delivery.kind.startsWith("CALENDAR_")) {
    const action: "create" | "update" | "delete" = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(appointment.status)
      ? "delete"
      : delivery.kind === "CALENDAR_CREATE" ? "create" : "update";
    const results = await syncAppointmentToCalendars(delivery.appointmentId, action);
    const failed = results.find((result) => !result.success);
    if (failed) throw new Error("CALENDAR_PROVIDER_REJECTED");
    return results.map((result) => result.eventId).filter(Boolean).join(",") || "no-connected-calendar";
  }
  const client = appointment.client;
  if (!client || client.businessId !== delivery.businessId || client.id !== appointment.clientId || client.status !== 'ACTIVE') return 'suppressed-recipient';
  const date = appointment.scheduledStart.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = appointment.scheduledStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const service = appointment.services[0]?.service.name || "Appointment";
  if (EMAIL_KINDS.includes(delivery.kind)) {
    if (!client.allowEmail || !client.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email.trim())) return 'suppressed-consent-or-contact';
    const payload = payloadObject(delivery.payload);
    if (payload.clientId && payload.clientId !== client.id) return 'suppressed-client-changed';
    const expectedStart = typeof payload.scheduledStart === 'string' ? payload.scheduledStart : null;
    const intent = appointment.depositIntent;
    const kind = delivery.kind as AppointmentEmailKind;
    const financialNotice = kind === 'DEPOSIT_PAID_EMAIL' || kind === 'DEPOSIT_REFUND_EMAIL';
    if (!financialNotice && expectedStart && expectedStart !== appointment.scheduledStart.toISOString()) return 'suppressed-stale-schedule';
    if (!financialNotice && !expectedStart && appointment.version > 0) return 'suppressed-legacy-snapshot';
    const active = ['BOOKED', 'CONFIRMED'].includes(appointment.status);
    if (kind === 'CONFIRMATION_EMAIL' && (!active || (intent && !['PAID', 'APPLIED', 'WAIVED'].includes(intent.status)))) return 'suppressed-stale-confirmation';
    if (kind === 'DEPOSIT_REQUEST_EMAIL' && (!active || intent?.status !== 'PENDING')) return 'suppressed-stale-deposit-request';
    if (kind === 'DEPOSIT_PAID_EMAIL' && (!['BOOKED', 'CONFIRMED', 'CANCELLED'].includes(appointment.status) || !['PAID', 'APPLIED'].includes(intent?.status || '') || !['CARD', 'CASH'].includes(intent?.collectionMethod || ''))) return 'suppressed-stale-deposit-paid';
    if (kind === 'DEPOSIT_REFUND_EMAIL' && intent?.status !== 'REFUNDED') return 'suppressed-stale-deposit-refund';
    if (kind === 'RESCHEDULE_EMAIL' && !active) return 'suppressed-stale-reschedule';
    if (kind === 'CANCELLATION_EMAIL' && appointment.status !== 'CANCELLED') return 'suppressed-stale-cancellation';
    const amountCents = typeof payload.amountCents === 'number' ? payload.amountCents : undefined;
    if (['DEPOSIT_REQUEST_EMAIL', 'DEPOSIT_PAID_EMAIL', 'DEPOSIT_REFUND_EMAIL'].includes(kind) && (!intent || amountCents !== intent.amountCents || intent.currency !== 'USD')) return 'suppressed-deposit-mismatch';
    if (['DEPOSIT_PAID_EMAIL', 'DEPOSIT_REFUND_EMAIL'].includes(kind) && payload.collectionMethod !== intent?.collectionMethod) return 'suppressed-deposit-method-changed';
    const originalRecipient = client.email.trim().toLowerCase();
    const mode = emailMode();
    if (payload.deliveryMode !== mode && (payload.deliveryMode !== undefined || mode === 'live')) return 'suppressed-delivery-mode-changed';
    const to = mode === 'sandbox' ? sandboxRecipient() : originalRecipient;
    const rendered = payload.rendered && typeof payload.rendered === 'object' && !Array.isArray(payload.rendered) ? payload.rendered as Record<string, unknown> : null;
    if (rendered && (rendered.originalRecipient !== originalRecipient || rendered.mode !== mode || rendered.to !== to)) return 'suppressed-recipient-or-mode-changed';
    const firstAttempt = delivery.providerAttemptedAt;
    if (firstAttempt && Date.now() - firstAttempt.getTime() >= EMAIL_RETRY_WINDOW_MS) throw new AppointmentEmailError('EMAIL_RECONCILIATION_REQUIRED');
    if (firstAttempt && !rendered) throw new AppointmentEmailError('EMAIL_FROZEN_PAYLOAD_MISSING');
    let message: AppointmentEmailMessage;
    if (rendered) {
      if (!['id', 'businessId', 'from', 'to', 'subject', 'text', 'mode', 'accountFingerprint'].every(key => typeof rendered[key] === 'string')) throw new AppointmentEmailError('EMAIL_FROZEN_PAYLOAD_INVALID');
      if (rendered.id !== delivery.id || rendered.businessId !== delivery.businessId) throw new AppointmentEmailError('EMAIL_FROZEN_SCOPE_INVALID');
      message = {
        id: rendered.id as string, businessId: rendered.businessId as string,
        from: rendered.from as string, to: rendered.to as string,
        subject: rendered.subject as string, text: rendered.text as string,
        mode: rendered.mode as 'sandbox' | 'live', accountFingerprint: rendered.accountFingerprint as string,
      };
    } else {
      const configuration = await emailProvider.configuration(delivery.businessId);
      const eventTime = financialNotice && expectedStart ? new Date(expectedStart) : appointment.scheduledStart;
      if (!Number.isFinite(eventTime.getTime())) return 'suppressed-invalid-snapshot';
      const when = displayTime(eventTime, appointment.location.business.timezone);
      const previous = typeof payload.previousStart === 'string' ? displayTime(new Date(payload.previousStart), appointment.location.business.timezone) : undefined;
      const link = client.userId ? `${new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').origin}/client/appointments/${encodeURIComponent(appointment.id)}` : undefined;
      const renderedContent = content(kind, { clientName: client.firstName, businessName: appointment.location.business.name, service, when, previous, amountCents, method: typeof payload.collectionMethod === 'string' ? payload.collectionMethod : undefined, link });
      message = { id: delivery.id, businessId: delivery.businessId, from: configuration.from, to, ...renderedContent, mode, accountFingerprint: configuration.accountFingerprint };
      const changed = await prisma.integrationDelivery.updateMany({ where: { id: delivery.id, status: 'PROCESSING', attempts: delivery.attempts }, data: { payload: { ...payload, rendered: { ...message, originalRecipient } }, providerAttemptedAt: new Date() } });
      if (!changed.count) throw new AppointmentEmailError('EMAIL_CLAIM_LOST');
    }
    return emailProvider.send(message);
  }
  if (delivery.kind === "CONFIRMATION_SMS") {
    if (!client.phone || client.allowSms === false) return "suppressed";
    const result = await sendAppointmentConfirmationSMS(client.phone, client.firstName, date, time, service, appointment.location.business.name, client.preferredLanguage || "en");
    if (!result.success) throw new Error("SMS_PROVIDER_REJECTED");
    return result.messageId || "accepted";
  }
  throw new Error("UNSUPPORTED_DELIVERY_KIND");
}

export const DELIVERY_LEASE_MS = 5 * 60_000;

export async function processIntegrationDeliveries(limit = 20, emailProvider: AppointmentEmailProvider = resendAppointmentProvider) {
  const processed: { id: string; status: string }[] = [];
  // A crashed fifth attempt must terminate rather than remain PROCESSING forever.
  await prisma.integrationDelivery.updateMany({
    where: { status: "PROCESSING", attempts: { gte: 5 }, updatedAt: { lt: new Date(Date.now() - DELIVERY_LEASE_MS) } },
    data: { status: "DEAD_LETTER", lastErrorCode: "WORKER_LEASE_EXPIRED", lastErrorAt: new Date() },
  });
  for (let index = 0; index < Math.min(Math.max(limit, 1), 100); index += 1) {
    const delivery = await prisma.$transaction(async (tx) => {
      const candidate = await tx.integrationDelivery.findFirst({
        where: { attempts: { lt: 5 }, ...(process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED === 'true' ? {} : { kind: { notIn: [...APPOINTMENT_EMAIL_KINDS] } }), OR: [
          { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: new Date() } },
          { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - DELIVERY_LEASE_MS) } },
        ] },
        orderBy: { createdAt: "asc" },
      });
      if (!candidate) return null;
      const claimed = await tx.integrationDelivery.updateMany({
        where: { id: candidate.id, status: candidate.status, attempts: candidate.attempts, updatedAt: candidate.updatedAt },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      return claimed.count === 1 ? { ...candidate, attempts: candidate.attempts + 1 } : null;
    });
    if (!delivery) break;
    const owned = { id: delivery.id, status: "PROCESSING" as const, attempts: delivery.attempts };
    // Renew long-running attempts; fencing prevents an old worker completing a reclaimed job.
    const heartbeat = setInterval(() => {
      void prisma.integrationDelivery.updateMany({ where: owned, data: { updatedAt: new Date() } }).catch(() => {});
    }, DELIVERY_LEASE_MS / 3);
    try {
      const providerRef = await dispatch(delivery, emailProvider);
      const completed = await prisma.integrationDelivery.updateMany({ where: owned, data: { status: "DELIVERED", deliveredAt: new Date(), providerRef, lastErrorCode: null } });
      if (completed.count) processed.push({ id: delivery.id, status: "DELIVERED" });
    } catch (error) {
      const emailError = error instanceof AppointmentEmailError ? error : null;
      const terminal = delivery.attempts >= 5 || (EMAIL_KINDS.includes(delivery.kind) && (!emailError || !emailError.retryable));
      const failed = await prisma.integrationDelivery.updateMany({
        where: owned,
        data: {
          status: terminal ? "DEAD_LETTER" : "RETRY",
          nextAttemptAt: new Date(Date.now() + retryDelayMs(delivery.attempts)),
          lastErrorAt: new Date(),
          lastErrorCode: emailError?.code || (error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN_PROVIDER_ERROR"),
        },
      });
      if (failed.count) processed.push({ id: delivery.id, status: terminal ? "DEAD_LETTER" : "RETRY" });
    } finally {
      clearInterval(heartbeat);
    }
  }
  return processed;
}
