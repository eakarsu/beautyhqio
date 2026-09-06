import { context, endpoint, mutation } from '@/lib/operations/core';
import { redeemLoyalty, loyaltyRedemptionSchema } from '@/lib/operations/balances';
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const input = loyaltyRedemptionSchema.parse(await req.json());
    return mutation(ctx, req, 'loyalty/redeem', input, tx => redeemLoyalty(tx, ctx, input));
  });
}
