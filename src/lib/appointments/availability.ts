import { Prisma } from '@prisma/client';
import { AppointmentDomainError } from './domain';

export function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
export function localDateTime(date: string, time: string, timeZone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new AppointmentDomainError('INVALID_TIME', 422, 'Use a date and a 24-hour time');
  const target = new Date(`${date}T${time}:00Z`);
  if (!Number.isFinite(target.getTime())) throw new AppointmentDomainError('INVALID_TIME', 422, 'Invalid date');
  let result = target;
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(result, timeZone);
    const represented = new Date(`${p.date}T00:00:00Z`).getTime() + p.minutes * 60000;
    result = new Date(result.getTime() + target.getTime() - represented);
  }
  const p = zonedParts(result, timeZone);
  if (p.date !== date || p.minutes !== Number(time.slice(0, 2)) * 60 + Number(time.slice(3))) throw new AppointmentDomainError('INVALID_TIME', 422, 'This local time does not exist due to daylight saving time');
  return result;
}
const minutes = (s: string) => { const p = s.split(':').map(Number); return p[0] * 60 + p[1]; };
export async function assertAvailable(tx: Prisma.TransactionClient, options: { businessId: string; locationId: string; staffId: string; start: Date; end: Date; buffer: number; excludeId?: string }) {
  const { businessId, staffId, start, end, buffer, excludeId } = options;
  const staff = await tx.staff.findFirst({ where: { id: staffId, locationId: options.locationId, isActive: true, location: { businessId } }, include: { schedules: { include: { breaks: true } }, timeOff: { where: { status: 'approved', startDate: { lte: new Date(end.getTime() + 86400000) }, endDate: { gte: new Date(start.getTime() - 86400000) } } }, location: { include: { business: { select: { timezone: true } } } } } });
  if (!staff) throw new AppointmentDomainError('STAFF_NOT_FOUND', 404, 'Staff member is unavailable at this location');
  const tz = staff.location.business.timezone;
  const s = zonedParts(start, tz); const e = zonedParts(end, tz);
  if (s.date !== e.date) throw new AppointmentDomainError('OUTSIDE_SHIFT', 409, 'Appointment must finish on the same business day');
  const schedules = staff.schedules.filter(row => row.dayOfWeek === s.weekday && row.isWorking);
  if (staff.schedules.length && !schedules.some(row => s.minutes >= minutes(row.startTime) && e.minutes <= minutes(row.endTime) && !row.breaks.some(b => s.minutes < minutes(b.endTime) && e.minutes > minutes(b.startTime)))) throw new AppointmentDomainError('OUTSIDE_SHIFT', 409, 'Requested time is outside the staff schedule or overlaps a break');
  for (const leave of staff.timeOff) {
    // Date-only time-off records are stored as UTC dates.
    if (s.date < leave.startDate.toISOString().slice(0, 10) || s.date > leave.endDate.toISOString().slice(0, 10)) continue;
    if (leave.allDay || (leave.startTime && leave.endTime && s.minutes < minutes(leave.endTime) && e.minutes > minutes(leave.startTime))) throw new AppointmentDomainError('TIME_OFF', 409, 'Staff member has approved time off');
  }
  const candidates = await tx.appointment.findMany({ where: { staffId, ...(excludeId ? { id: { not: excludeId } } : {}), status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }, scheduledStart: { lt: new Date(end.getTime() + Math.max(buffer, 1440) * 60000) }, scheduledEnd: { gt: new Date(start.getTime() - Math.max(buffer, 1440) * 60000) } }, select: { scheduledStart: true, scheduledEnd: true, services: { select: { service: { select: { bufferTime: true } } } } } });
  if (candidates.some(a => start.getTime() < a.scheduledEnd.getTime() + Math.max(0, ...a.services.map(l => (l.service.bufferTime || 0))) * 60000 && end.getTime() + buffer * 60000 > a.scheduledStart.getTime())) throw new AppointmentDomainError('STAFF_CONFLICT', 409, 'Requested time overlaps an appointment or its cleanup buffer');
}
