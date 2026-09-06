import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, idSchema, type Context } from './core';
const amount = z.number().finite().nonnegative().max(1000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001, 'Use amounts with at most two decimal places');
export const purchaseOrderSchema = z.object({ vendorId: idSchema, expectedDate: z.coerce.date().optional(), taxAmount: amount.default(0), shippingAmount: amount.default(0), notes: z.string().max(1000).optional(), items: z.array(z.object({ productId: idSchema, quantityOrdered: z.number().int().positive().max(100000), unitCost: amount })).min(1).max(100) }).refine(v => new Set(v.items.map(i => i.productId)).size === v.items.length, 'Use one line per product');
export async function createPurchaseOrder(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof purchaseOrderSchema>) {
  if (!await tx.vendor.findFirst({ where: { id: input.vendorId, businessId: ctx.businessId, isActive: true } })) return fail(404, 'Vendor not found');
  const products = await tx.product.findMany({ where: { id: { in: input.items.map(i => i.productId) }, businessId: ctx.businessId, isActive: true } });
  if (products.length !== input.items.length) return fail(422, 'Some products are not available in this business');
  const lines = input.items.map(i => ({ ...i, productName: products.find(p => p.id === i.productId)!.name, totalCost: new Prisma.Decimal(i.unitCost).mul(i.quantityOrdered) }));
  const subtotal = lines.reduce((sum, l) => sum.plus(l.totalCost), new Prisma.Decimal(0));
  const row = await tx.purchaseOrder.create({ data: { poNumber: `PO-${randomUUID()}`, vendorId: input.vendorId, createdById: ctx.user.id, expectedDate: input.expectedDate, notes: input.notes, subtotal, taxAmount: input.taxAmount, shippingAmount: input.shippingAmount, totalAmount: subtotal.plus(input.taxAmount).plus(input.shippingAmount), items: { create: lines } }, include: { items: true, vendor: { select: { name: true } } } });
  await audit(tx, ctx, 'PURCHASE_ORDER_CREATED', 'PurchaseOrder', row.id, { total: row.totalAmount.toString() });
  return row;
}
export async function purchaseOrderStatus(tx: Prisma.TransactionClient, ctx: Context, id: string, status: 'submitted' | 'cancelled') {
  const row = await tx.purchaseOrder.findFirst({ where: { id, vendor: { businessId: ctx.businessId } } });
  if (!row) return fail(404, 'Order not found');
  if ((status === 'submitted' && row.status !== 'draft') || (status === 'cancelled' && !['draft', 'submitted', 'partial'].includes(row.status))) return fail(409, 'Invalid order status change');
  const updated = await tx.purchaseOrder.update({ where: { id }, data: { status } });
  await audit(tx, ctx, 'PURCHASE_ORDER_STATUS', 'PurchaseOrder', id, { from: row.status, to: status });
  return updated;
}
