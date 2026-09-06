import { context, endpoint, boundedBody } from '@/lib/operations/core';
import { refundPayment, refundSchema } from '@/lib/operations/refunds';
export async function POST(req: Request) {
  return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); return refundPayment(ctx, req, refundSchema.parse(await boundedBody(req))); });
}
