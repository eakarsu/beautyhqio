import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, idSchema } from '@/lib/operations/core';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    return prisma.loyaltyReward.findMany({ where: { isActive: true, program: { businessId: ctx.businessId, isActive: true } }, orderBy: { pointsCost: 'asc' }, take: 200 });
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const input = z.object({ programId: idSchema, name: z.string().trim().min(1).max(150), description: z.string().max(1000).optional().nullable(), pointsCost: z.coerce.number().int().positive().max(1000000), type: z.string().max(40).default('CUSTOM'), value: z.coerce.number().nonnegative().max(100000).default(0) }).parse(await req.json());
    if (!await prisma.loyaltyProgram.findFirst({ where: { id: input.programId, businessId: ctx.businessId } })) return fail(404, 'Program not found');
    return prisma.loyaltyReward.create({ data: input });
  });
}
