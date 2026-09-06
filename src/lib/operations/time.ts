import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, idSchema, type Context } from './core';

export const timeActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('clock-in'), staffId: idSchema }),
  z.object({ action: z.literal('clock-out'), id: idSchema, breakMinutes: z.number().int().min(0).max(1440).default(0), notes: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal('approve'), id: idSchema, version: z.number().int().nonnegative() }),
  z.object({ action: z.literal('correct'), id: idSchema, version: z.number().int().nonnegative(), clockIn: z.coerce.date(), clockOut: z.coerce.date(), breakMinutes: z.number().int().min(0).max(1440), notes: z.string().trim().min(5).max(1000) }),
]);
export function workedMinutes(start: Date, end: Date, breakMinutes: number) {
  const elapsed = Math.floor((end.getTime() - start.getTime()) / 60000);
  if (elapsed < 0 || elapsed > 1440 || breakMinutes > elapsed) return fail(422, 'A shift must be within 24 hours and breaks cannot exceed its length');
  return elapsed - breakMinutes;
}
export async function timeAction(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof timeActionSchema>) {
  const manager = ['OWNER', 'MANAGER'].includes(ctx.user.role);
  if (input.action === 'clock-in') {
    if (!manager && ctx.user.staffId !== input.staffId) return fail(403, 'You can clock in only for yourself');
    const staff = await tx.staff.findFirst({ where: { id: input.staffId, isActive: true, location: { businessId: ctx.businessId } } });
    if (!staff) return fail(404, 'Staff member not found');
    if (await tx.timeEntry.findFirst({ where: { staffId: staff.id, status: 'OPEN' } })) return fail(409, 'Staff member is already clocked in');
    const row = await tx.timeEntry.create({ data: { businessId: ctx.businessId, staffId: staff.id, hourlyRate: staff.hourlyRate || 0 } });
    await audit(tx, ctx, 'CLOCK_IN', 'TimeEntry', row.id, { staffId: staff.id });
    return row;
  }
  const row = await tx.timeEntry.findFirst({ where: { id: input.id, businessId: ctx.businessId } });
  if (!row) return fail(404, 'Time entry not found');
  if (!manager && ctx.user.staffId !== row.staffId) return fail(403, 'You can update only your own shift');
  if (input.action === 'clock-out') {
    if (row.status !== 'OPEN') return fail(409, 'This shift is already closed');
    const now = new Date();
    workedMinutes(row.clockIn, now, input.breakMinutes);
    const changed = await tx.timeEntry.updateMany({ where: { id: row.id, version: row.version, status: 'OPEN' }, data: { clockOut: now, breakMinutes: input.breakMinutes, notes: input.notes, status: 'SUBMITTED', version: { increment: 1 } } });
    if (!changed.count) return fail(409, 'Shift changed; refresh and retry');
  } else {
    if (!manager) return fail(403, 'A manager must review timesheets');
    if (row.status === 'OPEN' || row.status === 'APPROVED') return fail(409, 'Only submitted timesheets can be reviewed or corrected');
    if (input.action === 'correct') {
      workedMinutes(input.clockIn, input.clockOut, input.breakMinutes);
      if (input.clockOut > new Date()) return fail(422, 'A completed shift cannot end in the future');
      const overlap = await tx.timeEntry.findFirst({ where: { staffId: row.staffId, id: { not: row.id }, clockIn: { lt: input.clockOut }, OR: [{ clockOut: null }, { clockOut: { gt: input.clockIn } }] } });
      if (overlap) return fail(409, 'Corrected shift overlaps another shift');
    }
    const data = input.action === 'approve' ? { status: 'APPROVED', approvedById: ctx.user.id, approvedAt: new Date() } : { clockIn: input.clockIn, clockOut: input.clockOut, breakMinutes: input.breakMinutes, notes: input.notes };
    const changed = await tx.timeEntry.updateMany({ where: { id: row.id, version: input.version, status: 'SUBMITTED' }, data: { ...data, version: { increment: 1 } } });
    if (!changed.count) return fail(409, 'Shift changed; refresh and retry');
  }
  await audit(tx, ctx, `TIME_${input.action.toUpperCase()}`, 'TimeEntry', row.id, { ...input, before: row });
  return tx.timeEntry.findUniqueOrThrow({ where: { id: row.id } });
}
