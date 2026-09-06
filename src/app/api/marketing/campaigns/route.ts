import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { campaignSchema } from '@/lib/operations/campaigns';
export async function GET() { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); return prisma.campaign.findMany({ where: { businessId: ctx.businessId }, orderBy: { createdAt: 'desc' }, take: 200 }); }); }
export async function POST(req: Request) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const input = campaignSchema.parse(await req.json()); return prisma.campaign.create({ data: { ...input, businessId: ctx.businessId, status: input.scheduledAt ? 'scheduled' : 'draft' } }); }); }
