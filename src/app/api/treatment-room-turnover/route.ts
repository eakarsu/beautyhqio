import { prisma } from '@/lib/prisma';
import { context, endpoint, mutation } from '@/lib/operations/core';
import { roomAction, roomActionSchema } from '@/lib/operations/rooms';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF']);
    const rooms = await prisma.treatmentRoom.findMany({ where: { businessId: ctx.businessId }, include: { location: { select: { name: true } }, reservations: { where: { end: { gte: new Date() }, appointment: { status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] } } }, orderBy: { start: 'asc' }, take: 10 } }, orderBy: { name: 'asc' }, take: 200 });
    const locations = await prisma.location.findMany({ where: { businessId: ctx.businessId, isActive: true }, select: { id: true, name: true } });
    return { rooms, locations, canCreate: ['OWNER', 'MANAGER'].includes(ctx.user.role), summary: { roomsTracked: rooms.length, readyNow: rooms.filter(r => r.status === 'READY').length, cleaningBlocked: rooms.filter(r => r.status === 'BLOCKED').length } };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF']);
    const input = roomActionSchema.parse(await req.json());
    return mutation(ctx, req, 'room', input, tx => roomAction(tx, ctx, input));
  });
}
