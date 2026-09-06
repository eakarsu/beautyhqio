import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { channelBooking } from '@/lib/appointments/channel-booking';
export async function POST(req: Request) { return channelBooking(req, 'ONLINE'); }
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['CLIENT', 'OWNER', 'MANAGER', 'RECEPTIONIST']);
    return prisma.appointment.findMany({ where: { location: { businessId: ctx.businessId }, ...(ctx.user.role === 'CLIENT' ? { clientId: ctx.user.clientId || '__none__' } : {}) }, orderBy: { scheduledStart: 'desc' }, take: 100, include: { services: { include: { service: true } } } });
  });
}
