import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { endpoint } from '@/lib/operations/core';
import { wearableContext } from '@/lib/operations/wearables';
export async function GET() { return endpoint(async () => { const ctx = await wearableContext(); return { samples: await prisma.wearableSample.findMany({ where: { businessId: ctx.businessId, clientId: ctx.clientId }, orderBy: { measuredAt: 'desc' }, take: 500 }), notice: 'Optional personal wellness records; not diagnostic measurements.' }; }); }
export async function DELETE(req: Request) { return endpoint(async () => { const ctx = await wearableContext(); const { provider } = z.object({ provider: z.enum(['apple-health', 'google-health']) }).parse(await req.json()); const deleted = await prisma.wearableSample.deleteMany({ where: { businessId: ctx.businessId, clientId: ctx.clientId, provider } }); return { deleted: deleted.count }; }); }
