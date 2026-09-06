import { prisma } from '@/lib/prisma';
import { context, endpoint, mutation } from '@/lib/operations/core';
import { createPurchaseOrder, purchaseOrderSchema } from '@/lib/operations/purchasing';
export async function GET() { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); return prisma.purchaseOrder.findMany({ where: { vendor: { businessId: ctx.businessId } }, include: { vendor: { select: { name: true } }, items: true }, orderBy: { createdAt: 'desc' }, take: 200 }); }); }
export async function POST(req: Request) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const input = purchaseOrderSchema.parse(await req.json()); return mutation(ctx, req, 'purchase-order.create', input, tx => createPurchaseOrder(tx, ctx, input)); }); }
