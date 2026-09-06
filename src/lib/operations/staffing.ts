import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { audit, fail, type Context } from './core';
import { zonedParts } from '@/lib/appointments/availability';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const breakSchema = z.object({ startTime: time, endTime: time, label: z.string().max(100).optional() });
export const scheduleSchema = z.object({ schedules: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startTime: time, endTime: time, isWorking: z.boolean(), breaks: z.array(breakSchema).max(10).default([]) })).max(7) }).superRefine((v, ctx) => {
  if (new Set(v.schedules.map(s => s.dayOfWeek)).size !== v.schedules.length) ctx.addIssue({ code: 'custom', message: 'Use one schedule per day' });
  for (const s of v.schedules) if (s.isWorking && (s.startTime >= s.endTime || s.breaks.some(b => b.startTime < s.startTime || b.endTime > s.endTime || b.startTime >= b.endTime))) ctx.addIssue({ code: 'custom', message: 'Shifts and breaks must have valid start/end times' });
});
export const leaveSchema = z.object({ type: z.string().min(1).max(80), startDate: z.coerce.date(), endDate: z.coerce.date(), allDay: z.boolean().default(true), startTime: time.optional().nullable(), endTime: time.optional().nullable(), notes: z.string().max(1000).optional() }).refine(v => v.endDate >= v.startDate && (v.allDay || (!!v.startTime && !!v.endTime && v.endTime > v.startTime)), 'Choose a valid time-off range');
export async function staffAccess(tx: Prisma.TransactionClient, ctx: Context, id: string) {
  if (ctx.user.role === 'STAFF' && ctx.user.staffId !== id) return fail(403, 'Only your own staff record is available');
  const staff = await tx.staff.findFirst({ where: { id, location: { businessId: ctx.businessId } }, include: { location: { include: { business: { select: { timezone: true } } } } } });
  return staff || fail(404, 'Staff member not found');
}
export async function saveSchedule(tx: Prisma.TransactionClient, ctx: Context, id: string, input: z.infer<typeof scheduleSchema>) {
  const staff = await staffAccess(tx, ctx, id);
  const future = await tx.appointment.findMany({ where: { staffId: id, scheduledEnd: { gt: new Date() }, status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE'] } }, select: { id: true, scheduledStart: true, scheduledEnd: true } });
  for (const a of future) {
    const s = zonedParts(a.scheduledStart, staff.location.business.timezone); const e = zonedParts(a.scheduledEnd, staff.location.business.timezone);
    const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    const day = input.schedules.find(d => d.dayOfWeek === s.weekday && d.isWorking);
    if (!day || clock(s.minutes) < day.startTime || clock(e.minutes) > day.endTime || day.breaks.some(b => clock(s.minutes) < b.endTime && clock(e.minutes) > b.startTime)) return fail(409, `Schedule conflicts with appointment ${a.id}; reschedule it first`);
  }
  await tx.staffSchedule.deleteMany({ where: { staffId: id } });
  for (const s of input.schedules) await tx.staffSchedule.create({ data: { staffId: id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking, breaks: { create: s.breaks } } });
  await audit(tx, ctx, 'STAFF_SCHEDULE_UPDATED', 'Staff', id, input);
  return tx.staffSchedule.findMany({ where: { staffId: id }, include: { breaks: true }, orderBy: { dayOfWeek: 'asc' } });
}
