import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { scheduleSchema, saveSchedule, staffAccess } from '@/lib/operations/staffing';
type Params = { params: Promise<{ id: string }> };
export async function GET(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF']); const { id } = await params; await staffAccess(prisma, ctx, id); return prisma.staffSchedule.findMany({ where: { staffId: id }, include: { breaks: true }, orderBy: { dayOfWeek: 'asc' } }); }); }
export async function PUT(req: Request, { params }: Params) { return endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const { id } = await params; const input = scheduleSchema.parse(await req.json()); return prisma.$transaction(async tx => { await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ctx.businessId}, 0))::text`; return saveSchedule(tx, ctx, id, input); }); }); }
