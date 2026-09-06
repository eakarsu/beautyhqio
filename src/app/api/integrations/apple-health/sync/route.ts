import { z } from 'zod';
import { endpoint } from '@/lib/operations/core';
import { ingestSamples, samplesSchema, wearableContext } from '@/lib/operations/wearables';
export async function POST(req: Request) { return endpoint(async () => { const ctx = await wearableContext(); const { samples } = z.object({ samples: samplesSchema }).parse(await req.json()); return ingestSamples(ctx, 'apple-health', samples); }); }
