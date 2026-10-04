import { context, endpoint, mutation } from '@/lib/operations/core';
import { rescheduleAppointment, rescheduleSchema } from '@/lib/appointments/reschedule';
import { domainErrorResponse } from '@/lib/appointments/service';
import { localDateTime } from '@/lib/appointments/availability';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
const localRescheduleSchema = z.object({ date: z.string(), time: z.string(), staffId: z.string().min(1), version: z.number().int().nonnegative(), reason: z.string().trim().min(3).max(1000) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const { id } = await params;
    const body = await req.json();
    let input;
    if (body && ('date' in body || 'time' in body)) {
      const local = localRescheduleSchema.parse(body);
      const current = await prisma.appointment.findFirst({ where: { id, businessId: ctx.businessId, ...(ctx.user.role === 'CLIENT' ? { clientId: ctx.user.clientId || '__none__' } : {}) }, select: { location: { select: { business: { select: { timezone: true } } } } } });
      if (!current) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      input = rescheduleSchema.parse({ ...local, scheduledStart: localDateTime(local.date, local.time, current.location.business.timezone) });
    } else input = rescheduleSchema.parse(body);
    try { return await mutation(ctx, req, 'appointment.reschedule', { id, ...input }, tx => rescheduleAppointment(tx, ctx, id, input)); }
    catch (e) { const r = domainErrorResponse(e); if (r) return NextResponse.json(r.body, { status: r.status }); throw e; }
  });
}
