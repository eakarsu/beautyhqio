import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, idSchema, mutation } from '@/lib/operations/core';
import { createAppointment, domainErrorResponse } from '@/lib/appointments/service';
import { recurrenceSchema, recurringDates } from '@/lib/appointments/recurrence';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const rows = await prisma.appointment.findMany({ where: { location: { businessId: ctx.businessId }, isRecurring: true, ...(ctx.user.role === 'CLIENT' ? { clientId: ctx.user.clientId || '__none__' } : {}) }, include: { services: { include: { service: true } } }, orderBy: { scheduledStart: 'asc' }, take: 300 });
    return { appointments: rows, series: rows.reduce<Record<string, typeof rows>>((groups, a) => { (groups[a.parentAppointmentId || a.id] ||= []).push(a); return groups; }, {}) };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context();
    const input = z.object({ appointmentId: idSchema, recurrenceRule: recurrenceSchema }).parse(await req.json());
    try {
      return await mutation(ctx, req, 'appointment.recurring', input, async tx => {
        const parent = await tx.appointment.findFirst({ where: { id: input.appointmentId, location: { businessId: ctx.businessId } }, include: { location: { include: { business: true } }, services: true } });
        if (!parent) return fail(404, 'Appointment not found');
        if (!['BOOKED', 'CONFIRMED'].includes(parent.status) || parent.isRecurring) return fail(409, 'Choose a booked appointment that is not already recurring');
        const dates = recurringDates(parent.scheduledStart, input.recurrenceRule, parent.location.business.timezone);
        const appointments = [];
        for (let i = 0; i < dates.length; i++) {
          const result = await createAppointment(prisma, ctx.user, { clientId: parent.clientId, staffId: parent.staffId, locationId: parent.locationId, scheduledStart: dates[i], services: parent.services.map(s => ({ serviceId: s.serviceId, price: Number(s.price), duration: s.duration })), notes: parent.notes, source: parent.source }, `${parent.id}:recurrence:${i}`, tx);
          await tx.appointment.update({ where: { id: result.appointment.id }, data: { isRecurring: true, parentAppointmentId: parent.id, recurrenceRule: JSON.stringify(input.recurrenceRule) } });
          appointments.push(result.appointment);
        }
        await tx.appointment.update({ where: { id: parent.id }, data: { isRecurring: true, recurrenceRule: JSON.stringify(input.recurrenceRule) } });
        return { success: true, appointments, created: appointments.length };
      });
    } catch (e) { const r = domainErrorResponse(e); if (r) return NextResponse.json(r.body, { status: r.status }); throw e; }
  });
}
