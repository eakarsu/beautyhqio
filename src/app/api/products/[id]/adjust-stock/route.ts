import { z } from 'zod';
import { audit, context, endpoint, fail, mutation } from '@/lib/operations/core';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params;
    const input = z.object({ adjustment: z.number().int().min(-1000000).max(1000000).refine(n => n !== 0), reason: z.string().trim().min(3).max(1000) }).parse(await req.json());
    return mutation(ctx, req, 'stock.adjust', { id, ...input }, async tx => {
      const product = await tx.product.findFirst({ where: { id, businessId: ctx.businessId } });
      if (!product) return fail(404, 'Product not found');
      if (product.quantityOnHand + input.adjustment < 0) return fail(409, 'Stock cannot be negative');
      const changed = await tx.product.updateMany({ where: { id, quantityOnHand: product.quantityOnHand }, data: { quantityOnHand: { increment: input.adjustment } } });
      if (!changed.count) return fail(409, 'Stock changed; retry');
      await audit(tx, ctx, 'STOCK_ADJUSTED', 'Product', id, { ...input, before: product.quantityOnHand });
      return tx.product.findUniqueOrThrow({ where: { id } });
    });
  });
}
