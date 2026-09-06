import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, mutation } from '@/lib/operations/core';
import { purchaseOrderStatus } from '@/lib/operations/purchasing';
type Params = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params; return await prisma.purchaseOrder.findFirst({ where: { id, vendor: { businessId: ctx.businessId } }, include: { items: true, vendor: true } }) || fail(404, 'Order not found'); }); }
export async function PUT(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params; const { status } = z.object({ status: z.enum(['submitted', 'cancelled']) }).parse(await req.json()); return mutation(ctx, req, 'purchase-order.status', { id, status }, tx => purchaseOrderStatus(tx, ctx, id, status)); }); }
export async function DELETE(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params; return mutation(ctx, req, 'purchase-order.cancel', { id }, tx => purchaseOrderStatus(tx, ctx, id, 'cancelled')); }); }
