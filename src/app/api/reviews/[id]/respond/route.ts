import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, context, endpoint, fail } from '@/lib/operations/core';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params;
    const input = z.object({ response: z.string().trim().min(1).max(5000) }).parse(await req.json());
    return prisma.$transaction(async tx => {
      const review = await tx.review.findFirst({ where: { id, client: { businessId: ctx.businessId } } });
      if (!review) return fail(404, 'Review not found');
      const updated = await tx.review.update({ where: { id }, data: { response: input.response, respondedAt: new Date() } });
      await audit(tx, ctx, 'REVIEW_RESPONSE_SAVED', 'Review', id, { before: review.response, response: input.response });
      return updated;
    });
  });
}
