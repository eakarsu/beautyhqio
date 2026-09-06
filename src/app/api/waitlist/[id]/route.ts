import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, mutation } from '@/lib/operations/core';
import { updateWaitlist } from '@/lib/operations/waitlist';
type Params = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(); const { id } = await params; return await prisma.waitlistEntry.findFirst({ where: { id, location: { businessId: ctx.businessId } }, include: { client: true, location: true } }) || fail(404, 'Waitlist entry not found'); }); }
export async function PATCH(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(); const { id } = await params; const { status } = z.object({ status: z.enum(['SEATED', 'LEFT', 'NOTIFIED']) }).parse(await req.json()); return mutation(ctx, req, 'waitlist.update', { id, status }, tx => updateWaitlist(tx, ctx, id, status)); }); }
export const PUT = PATCH;
export async function DELETE(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(); const { id } = await params; return mutation(ctx, req, 'waitlist.leave', { id }, tx => updateWaitlist(tx, ctx, id, 'LEFT')); }); }
