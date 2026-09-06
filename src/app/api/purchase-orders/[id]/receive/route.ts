import { context, endpoint, mutation } from '@/lib/operations/core';
import { receiveOrder, receiveSchema } from '@/lib/operations/balances';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const { id } = await params;
    const input = receiveSchema.parse(await req.json());
    return mutation(ctx, req, 'purchase-order.receive', { id, ...input }, tx => receiveOrder(tx, ctx, id, input));
  });
}
