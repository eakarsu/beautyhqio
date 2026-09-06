import { context, endpoint, mutation } from '@/lib/operations/core';
import { queueCampaign } from '@/lib/operations/messaging';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params;
    return mutation(ctx, req, 'campaign.queue', { id }, tx => queueCampaign(tx, ctx, id));
  });
}
