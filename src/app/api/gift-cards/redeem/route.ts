import { context, endpoint, mutation } from '@/lib/operations/core';
import { redeemGift, giftRedemptionSchema } from '@/lib/operations/balances';
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST']);
    const input = giftRedemptionSchema.parse(await req.json());
    return mutation(ctx, req, 'gift-cards/redeem', input, tx => redeemGift(tx, ctx, input));
  });
}
