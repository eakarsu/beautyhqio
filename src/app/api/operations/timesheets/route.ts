import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { context, csv, endpoint, mutation } from '@/lib/operations/core';
import { timeAction, timeActionSchema, workedMinutes } from '@/lib/operations/time';
export async function GET(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST']);
    const p = new URL(req.url).searchParams;
    const from = z.coerce.date().parse(p.get('from') || new Date(Date.now() - 31 * 86400000));
    const to = z.coerce.date().parse(p.get('to') || new Date());
    const manager = ['OWNER', 'MANAGER'].includes(ctx.user.role);
    const rows = await prisma.timeEntry.findMany({ where: { businessId: ctx.businessId, ...(manager ? {} : { staffId: ctx.user.staffId || '__none__' }), clockIn: { gte: from, lte: to } }, include: { staff: { select: { displayName: true, user: { select: { firstName: true, lastName: true } } } } }, orderBy: { clockIn: 'desc' }, take: 1000 });
    const entries = rows.map(row => ({ ...row, minutes: row.clockOut ? workedMinutes(row.clockIn, row.clockOut, row.breakMinutes) : null }));
    if (p.get('format') === 'csv') {
      const output = csv([['Staff', 'Clock in UTC', 'Clock out UTC', 'Break minutes', 'Paid minutes', 'Hourly rate', 'Base pay', 'Status'], ...entries.filter(r => r.status === 'APPROVED').map(r => [r.staff.displayName || `${r.staff.user.firstName} ${r.staff.user.lastName}`, r.clockIn.toISOString(), r.clockOut?.toISOString(), r.breakMinutes, r.minutes, String(r.hourlyRate), ((r.minutes || 0) / 60 * Number(r.hourlyRate)).toFixed(2), r.status])]);
      return new Response(output, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="approved-timesheets.csv"', 'Cache-Control': 'no-store' } });
    }
    const staff = await prisma.staff.findMany({ where: { isActive: true, location: { businessId: ctx.businessId }, ...(manager ? {} : { id: ctx.user.staffId || '__none__' }) }, select: { id: true, displayName: true, user: { select: { firstName: true, lastName: true } } } });
    return { entries, staff, canApprove: manager, truncated: rows.length === 1000 };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST']);
    const input = timeActionSchema.parse(await req.json());
    return mutation(ctx, req, 'timesheet', input, tx => timeAction(tx, ctx, input));
  });
}
