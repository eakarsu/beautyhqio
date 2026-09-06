import { prisma } from '@/lib/prisma';
import { context, endpoint, mutation } from '@/lib/operations/core';
import { addWaitlist, waitlistSchema } from '@/lib/operations/waitlist';
export async function GET(req: Request) { return endpoint(async () => { const ctx = await context(); const locationId = new URL(req.url).searchParams.get('locationId') || undefined; return prisma.waitlistEntry.findMany({ where: { locationId, location: { businessId: ctx.businessId }, status: { in: ['WAITING', 'NOTIFIED'] } }, include: { client: true, location: true }, orderBy: { position: 'asc' }, take: 300 }); }); }
export async function POST(req: Request) { return endpoint(async () => { const ctx = await context(); const input = waitlistSchema.parse(await req.json()); return mutation(ctx, req, 'waitlist.add', input, tx => addWaitlist(tx, ctx, input)); }); }
