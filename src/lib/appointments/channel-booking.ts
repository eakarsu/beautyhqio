import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { endpoint, fail } from '@/lib/operations/core';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { createAppointment, domainErrorResponse } from './service';
import { localDateTime } from './availability';
export async function channelBooking(req: Request, source: 'ONLINE' | 'MARKETPLACE' | 'KIOSK') {
  return endpoint(async () => {
    const user = await getAuthenticatedUser();
    if (!user) return fail(401, 'Sign in to complete this booking');
    if (!['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT'].includes(user.role)) return fail(403, 'Your account cannot create a booking');
    const body = z.object({ locationId: z.string().min(1), staffId: z.string().min(1), clientId: z.string().optional(), serviceId: z.string().optional(), serviceIds: z.array(z.string()).optional(), scheduledStart: z.string().optional(), date: z.string().optional(), time: z.string().optional(), notes: z.string().max(1000).optional(), phone: z.string().trim().max(30).optional(), rescheduleId: z.string().optional() }).parse(await req.json());
    if (body.rescheduleId) return NextResponse.json({ error: 'Use the appointment reschedule action to preserve its payment and history' }, { status: 422 });
    const location = await prisma.location.findFirst({ where: { id: body.locationId, ...(user.role === 'CLIENT' ? { allowOnlineBooking: true, business: { subscription: { is: { status: { in: ['ACTIVE', 'TRIAL'] } } } } } : { businessId: user.businessId || '__none__' }), isActive: true }, include: { business: { select: { timezone: true } } } });
    if (!location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    try {
      const scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : localDateTime(body.date || '', body.time || '', location.business.timezone);
      const result = await prisma.$transaction(async tx => {
        let bookingUser = user;
        if (user.role === 'CLIENT') {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 0))::text`;
          let client = await tx.client.findUnique({ where: { userId: user.id }, select: { id: true, businessId: true } });
          if (!client) {
            const identity = await tx.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } });
            if (!identity?.emailVerified) return fail(403, 'Verify your email before booking with a new salon');
            client = await tx.client.create({ data: { businessId: location.businessId, userId: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: body.phone || '', allowSms: false, tags: [] }, select: { id: true, businessId: true } });
          }
          if (client.businessId !== location.businessId) return fail(409, 'This client account is linked to another salon; contact the salon to book here');
          bookingUser = { ...user, clientId: client.id };
        }
        return createAppointment(prisma, bookingUser, { ...body, scheduledStart, serviceIds: body.serviceIds || (body.serviceId ? [body.serviceId] : []), source }, req.headers.get('Idempotency-Key'), tx);
      });
      return NextResponse.json({ success: true, appointment: result.appointment, confirmationNumber: result.appointment.id, replayed: result.replayed }, { status: result.replayed ? 200 : 201 });
    } catch (error) { const result = domainErrorResponse(error); if (result) return NextResponse.json(result.body, { status: result.status }); throw error; }
  });
}
