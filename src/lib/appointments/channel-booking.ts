import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { createAppointment, domainErrorResponse } from './service';
import { localDateTime } from './availability';
export async function channelBooking(req: Request, source: 'ONLINE' | 'MARKETPLACE' | 'KIOSK') {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const body = z.object({ locationId: z.string().min(1), staffId: z.string().min(1), clientId: z.string().optional(), serviceId: z.string().optional(), serviceIds: z.array(z.string()).optional(), scheduledStart: z.string().optional(), date: z.string().optional(), time: z.string().optional(), notes: z.string().max(1000).optional(), rescheduleId: z.string().optional() }).parse(await req.json());
    if (body.rescheduleId) return NextResponse.json({ error: 'Use the appointment reschedule action to preserve its payment and history' }, { status: 422 });
    const location = await prisma.location.findFirst({ where: { id: body.locationId, businessId: ctx.businessId, isActive: true }, include: { business: { select: { timezone: true } } } });
    if (!location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    try {
      const scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : localDateTime(body.date || '', body.time || '', location.business.timezone);
      const result = await createAppointment(prisma, ctx.user, { ...body, scheduledStart, serviceIds: body.serviceIds || (body.serviceId ? [body.serviceId] : []), source }, req.headers.get('Idempotency-Key'));
      return NextResponse.json({ success: true, appointment: result.appointment, confirmationNumber: result.appointment.id, replayed: result.replayed }, { status: result.replayed ? 200 : 201 });
    } catch (error) { const result = domainErrorResponse(error); if (result) return NextResponse.json(result.body, { status: result.status }); throw error; }
  });
}
