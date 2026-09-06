import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { assertAvailable } from './availability';
import { audit, fail, type Context } from '@/lib/operations/core';
export const rescheduleSchema = z.object({ scheduledStart: z.coerce.date(), staffId: z.string().min(1).optional(), version: z.number().int().nonnegative(), reason: z.string().trim().min(3).max(1000) });
export async function rescheduleAppointment(tx: Prisma.TransactionClient, ctx: Context, id: string, input: z.infer<typeof rescheduleSchema>) {
  const current = await tx.appointment.findFirst({ where: { id, location: { businessId: ctx.businessId } }, include: { location: true, services: { include: { service: true } }, roomReservation: true } });
  if (!current) return fail(404, 'Appointment not found');
  if (ctx.user.role === 'CLIENT' && current.clientId !== ctx.user.clientId) return fail(403, 'Only your own appointments may be rescheduled');
  if (!['BOOKED', 'CONFIRMED'].includes(current.status)) return fail(409, 'Only booked or confirmed appointments can be rescheduled');
  if (ctx.user.role === 'CLIENT' && current.scheduledStart.getTime() - Date.now() < current.location.cancellationHours * 3600000) return fail(409, 'Please contact the salon to reschedule inside the cancellation window');
  if (input.scheduledStart <= new Date()) return fail(422, 'Choose a future appointment time');
  if (input.scheduledStart.getTime() > Date.now() + current.location.advanceBookingDays * 86400000) return fail(422, 'Requested time is outside the booking window');
  const end = new Date(input.scheduledStart.getTime() + current.scheduledEnd.getTime() - current.scheduledStart.getTime());
  const staffId = input.staffId || current.staffId;
  const staff = await tx.staff.findFirst({ where: { id: staffId, locationId: current.locationId, isActive: true } });
  if (!staff || (staff.serviceIds.length && current.services.some(s => !staff.serviceIds.includes(s.serviceId)))) return fail(422, 'Staff member cannot provide these services');
  await assertAvailable(tx, { businessId: ctx.businessId, locationId: current.locationId, staffId, start: input.scheduledStart, end, buffer: Math.max(0, ...current.services.map(s => (s.service.bufferTime || 0))), excludeId: current.id });
  if (current.roomReservation) {
    const other = await tx.roomReservation.findFirst({ where: { roomId: current.roomReservation.roomId, appointmentId: { not: current.id }, start: { lt: end }, end: { gt: input.scheduledStart }, appointment: { status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] } } } });
    if (other) return fail(409, 'The assigned room is unavailable at the new time');
    await tx.roomReservation.update({ where: { id: current.roomReservation.id }, data: { start: input.scheduledStart, end } });
  }
  const changed = await tx.appointment.updateMany({ where: { id, version: input.version, status: current.status }, data: { staffId, scheduledStart: input.scheduledStart, scheduledEnd: end, status: 'BOOKED', isConfirmed: false, confirmedAt: null, reminderSent: false, emailReminderSent: false, callReminderSent: false, version: { increment: 1 } } });
  if (!changed.count) return fail(409, 'Appointment changed; refresh before rescheduling');
  await audit(tx, ctx, 'APPOINTMENT_RESCHEDULED', 'Appointment', id, { from: current.scheduledStart.toISOString(), to: input.scheduledStart.toISOString(), reason: input.reason, staffId });
  await tx.integrationDelivery.create({ data: { businessId: ctx.businessId, appointmentId: id, kind: 'CALENDAR_UPDATE', provider: 'calendar', dedupeKey: `${id}:CALENDAR_UPDATE:${input.version + 1}`, payload: { appointmentId: id } } });
  return tx.appointment.findUniqueOrThrow({ where: { id } });
}
