import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, context, endpoint, fail, idSchema, mutation } from '@/lib/operations/core';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const [messages, appointments] = await Promise.all([prisma.outboundMessage.findMany({ where: { businessId: ctx.businessId }, orderBy: { createdAt: 'desc' }, take: 100 }), prisma.integrationDelivery.findMany({ where: { businessId: ctx.businessId }, orderBy: { createdAt: 'desc' }, take: 100 })]);
    return { messages, appointments, enabled: process.env.ENABLE_OUTBOUND_DELIVERY === 'true' };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const input = z.object({ id: idSchema, type: z.enum(['message', 'appointment']), action: z.enum(['retry', 'cancel']) }).parse(await req.json());
    return mutation(ctx, req, 'delivery.action', input, async tx => {
      if (input.type === 'message') {
        const row = await tx.outboundMessage.findFirst({ where: { id: input.id, businessId: ctx.businessId } });
        if (!row) return fail(404, 'Delivery not found');
        if (!['PENDING', 'RETRY', 'FAILED'].includes(row.status)) return fail(409, 'Accepted or uncertain deliveries cannot be retried automatically');
        await tx.outboundMessage.update({ where: { id: row.id }, data: { status: input.action === 'retry' ? 'PENDING' : 'CANCELLED', attempts: 0, nextAttemptAt: new Date(), lastError: null } });
      } else {
        const row = await tx.integrationDelivery.findFirst({ where: { id: input.id, businessId: ctx.businessId } });
        if (!row) return fail(404, 'Delivery not found');
        if (input.action !== 'retry' || !['RETRY', 'DEAD_LETTER'].includes(row.status)) return fail(409, 'Only failed appointment deliveries can be retried');
        await tx.integrationDelivery.update({ where: { id: row.id }, data: { status: 'PENDING', attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null } });
      }
      await audit(tx, ctx, 'DELIVERY_ACTION', 'Delivery', input.id, input);
      return { success: true };
    });
  });
}
