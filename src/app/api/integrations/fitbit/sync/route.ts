import { z } from 'zod';
import { endpoint } from '@/lib/operations/core';
import { wearableContext } from '@/lib/operations/wearables';
import { syncGoogleHealth } from '@/lib/operations/google-health';
export async function POST(req: Request) { return endpoint(async () => { const ctx = await wearableContext(); const input = z.object({ pageToken: z.string().max(10000).optional() }).parse(await req.json().catch(() => ({}))); return syncGoogleHealth(ctx, input.pageToken); }); }
