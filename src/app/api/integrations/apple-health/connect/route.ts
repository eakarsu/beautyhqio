import { z } from 'zod';
import { endpoint } from '@/lib/operations/core';
import { healthKitConsent, wearableContext } from '@/lib/operations/wearables';
export async function POST(req: Request) { return endpoint(async () => { const ctx = await wearableContext(); const { granted } = z.object({ granted: z.boolean() }).parse(await req.json()); return healthKitConsent(ctx, granted); }); }
export async function GET() { return endpoint(async () => { await wearableContext(); return { provider: 'apple-health', nativeAuthorizationRequired: true, message: 'Use the BeautyHQ iPhone app to grant HealthKit access and import step samples.' }; }); }
