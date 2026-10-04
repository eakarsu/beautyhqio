import { Prisma } from '@prisma/client';

export const APPOINTMENT_EMAIL_KINDS = [
  'CONFIRMATION_EMAIL', 'DEPOSIT_REQUEST_EMAIL', 'DEPOSIT_PAID_EMAIL', 'DEPOSIT_REFUND_EMAIL', 'RESCHEDULE_EMAIL', 'CANCELLATION_EMAIL',
] as const;
export type AppointmentEmailKind = (typeof APPOINTMENT_EMAIL_KINDS)[number];

type Recipient = { id: string; businessId: string; email: string | null; allowEmail: boolean; status: string } | null;
type Appointment = { id: string; clientId: string | null; scheduledStart: Date };

/** Queue only a consented, tenant-linked recipient. Dispatch checks again. */
export async function queueAppointmentEmail(tx: Prisma.TransactionClient, input: {
  businessId: string; appointment: Appointment; client: Recipient; kind: AppointmentEmailKind; eventKey: string;
  amountCents?: number; collectionMethod?: string; previousStart?: Date;
}) {
  const { businessId, appointment, client, kind, eventKey } = input;
  if (!client || client.businessId !== businessId || appointment.clientId !== client.id ||
    client.status !== 'ACTIVE' || !client.allowEmail || !client.email?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email.trim())) return null;
  return tx.integrationDelivery.create({ data: {
    businessId, appointmentId: appointment.id, kind, provider: 'resend',
    dedupeKey: `${businessId}:${appointment.id}:${kind}:${eventKey}`,
    payload: {
      appointmentId: appointment.id, clientId: client.id, scheduledStart: appointment.scheduledStart.toISOString(),
      deliveryMode: process.env.APPOINTMENT_EMAIL_MODE === 'live' ? 'live' : 'sandbox',
      ...(input.amountCents === undefined ? {} : { amountCents: input.amountCents }),
      ...(input.collectionMethod ? { collectionMethod: input.collectionMethod } : {}),
      ...(input.previousStart ? { previousStart: input.previousStart.toISOString() } : {}),
    },
  } });
}
