import { context, endpoint, mutation } from '@/lib/operations/core';
import { updateWaitlist } from '@/lib/operations/waitlist';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { return endpoint(async () => { const ctx = await context(); const { id } = await params; return mutation(ctx, req, 'waitlist.seat', { id }, tx => updateWaitlist(tx, ctx, id, 'SEATED')); }); }
