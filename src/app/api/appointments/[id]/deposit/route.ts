import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { boundedBody, context, endpoint, fail, mutation } from '@/lib/operations/core';
import { depositActionInput, settleAppointmentDeposit } from '@/lib/appointments/deposit-action';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const intent = await prisma.appointmentDepositIntent.findFirst({
      where: { appointmentId: (await params).id, businessId: ctx.businessId, appointment: { location: { businessId: ctx.businessId } } },
      select: { id: true, appointmentId: true, amountCents: true, currency: true, status: true, collectionMethod: true, reference: true, reason: true, settledAt: true, version: true,
        ledgerEntries: { orderBy: { createdAt: 'asc' }, select: { id: true, kind: true, amountCents: true, currency: true, reference: true, transactionPaymentId: true, actorId: true, reason: true, createdAt: true } },
      },
    });
    return intent || fail(404, 'No deposit obligation for this appointment');
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const appointmentId = (await params).id;
    const input = depositActionInput.parse(await boundedBody(request));
    const response = await mutation(ctx, request, 'appointment.deposit.settle', { appointmentId, ...input }, tx => settleAppointmentDeposit(tx, ctx, appointmentId, input));
    return Response.json(response);
  });
}
