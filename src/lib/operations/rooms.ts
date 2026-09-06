import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, idSchema, type Context } from './core';
export const roomActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), locationId: idSchema, name: z.string().trim().min(1).max(100), checklist: z.array(z.string().trim().min(1).max(150)).max(20).default(['Replace linens', 'Clean surfaces', 'Restock supplies']) }),
  z.object({ action: z.literal('status'), id: idSchema, version: z.number().int().nonnegative(), status: z.enum(['READY', 'OCCUPIED', 'DIRTY', 'CLEANING', 'BLOCKED']), completedChecklist: z.array(z.string().max(150)).max(20).default([]), notes: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal('reserve'), id: idSchema, appointmentId: idSchema }),
  z.object({ action: z.literal('release'), id: idSchema, appointmentId: idSchema }),
]);
export async function roomAction(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof roomActionSchema>) {
  if (input.action === 'create') {
    if (!['OWNER', 'MANAGER'].includes(ctx.user.role)) return fail(403, 'Only managers can create rooms');
    if (!await tx.location.findFirst({ where: { id: input.locationId, businessId: ctx.businessId, isActive: true } })) return fail(404, 'Location not found');
    const room = await tx.treatmentRoom.create({ data: { businessId: ctx.businessId, locationId: input.locationId, name: input.name, checklist: [...new Set(input.checklist)], completedChecklist: [] } });
    await audit(tx, ctx, 'ROOM_CREATED', 'TreatmentRoom', room.id, input);
    return room;
  }
  const room = await tx.treatmentRoom.findFirst({ where: { id: input.id, businessId: ctx.businessId } });
  if (!room) return fail(404, 'Room not found');
  if (input.action === 'status') {
    if (input.status === 'READY' && room.checklist.some(item => !input.completedChecklist.includes(item))) return fail(422, 'Complete every cleaning checklist item before marking the room ready');
    if (input.completedChecklist.some(item => !room.checklist.includes(item))) return fail(422, 'Unknown checklist item');
    const changed = await tx.treatmentRoom.updateMany({ where: { id: room.id, version: input.version }, data: { status: input.status, completedChecklist: input.status === 'DIRTY' ? [] : input.completedChecklist, notes: input.notes, updatedById: ctx.user.id, lastCleanedAt: input.status === 'READY' ? new Date() : undefined, version: { increment: 1 } } });
    if (!changed.count) return fail(409, 'Room changed; refresh and retry');
  } else {
    const appointment = await tx.appointment.findFirst({ where: { id: input.appointmentId, locationId: room.locationId, location: { businessId: ctx.businessId } } });
    if (!appointment) return fail(404, 'Appointment not found at this location');
    if (input.action === 'release') await tx.roomReservation.deleteMany({ where: { roomId: room.id, appointmentId: appointment.id } });
    else {
      if (['CANCELLED', 'NO_SHOW', 'RESCHEDULED', 'COMPLETED'].includes(appointment.status)) return fail(409, 'Cannot reserve a room for a closed appointment');
      if (room.status === 'BLOCKED') return fail(409, 'Room is blocked');
      const overlap = await tx.roomReservation.findFirst({ where: { roomId: room.id, start: { lt: appointment.scheduledEnd }, end: { gt: appointment.scheduledStart }, appointment: { status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] } } } });
      if (overlap) return fail(409, 'Room is reserved for an overlapping appointment');
      await tx.roomReservation.create({ data: { roomId: room.id, appointmentId: appointment.id, start: appointment.scheduledStart, end: appointment.scheduledEnd } });
    }
  }
  await audit(tx, ctx, `ROOM_${input.action.toUpperCase()}`, 'TreatmentRoom', room.id, input);
  return tx.treatmentRoom.findUniqueOrThrow({ where: { id: room.id }, include: { reservations: true } });
}
