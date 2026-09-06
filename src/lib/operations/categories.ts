import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint } from './core';
export function categories(kind: 'product' | 'service') {
  return {
    GET: () => endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'STAFF']); return kind === 'product' ? prisma.productCategory.findMany({ where: { businessId: ctx.businessId }, orderBy: { sortOrder: 'asc' } }) : prisma.serviceCategory.findMany({ where: { businessId: ctx.businessId, isActive: true }, orderBy: { sortOrder: 'asc' } }); }),
    POST: (req: Request) => endpoint(async () => { const ctx = await context(['OWNER', 'MANAGER']); const input = z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(1000).optional().nullable(), color: z.string().max(40).optional().nullable(), sortOrder: z.number().int().min(0).max(10000).default(0) }).parse(await req.json()); return kind === 'product' ? prisma.productCategory.create({ data: { ...input, businessId: ctx.businessId } }) : prisma.serviceCategory.create({ data: { ...input, businessId: ctx.businessId } }); }),
  };
}
