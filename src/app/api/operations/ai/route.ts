import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, idSchema } from '@/lib/operations/core';
import { aiFeatures, generateDraft, generateSchema, reviewDraft } from '@/lib/operations/ai';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context();
    const manager = ['OWNER', 'MANAGER'].includes(ctx.user.role);
    const where = { businessId: ctx.businessId, ...(manager ? {} : { userId: ctx.user.id }) };
    const rows = await prisma.aiResult.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const usage = await prisma.aiResult.aggregate({ where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } }, _sum: { tokens: true, costUsd: true }, _count: true });
    const clients = await prisma.client.findMany({ where: { businessId: ctx.businessId }, select: { id: true, firstName: true, lastName: true }, take: 200, orderBy: { firstName: 'asc' } });
    const features = Object.entries(aiFeatures).filter(([id]) => manager || !['inventory', 'revenue', 'invoice-review', 'staffing'].includes(id)).map(([id, name]) => ({ id, name }));
    return { rows, usage, clients, features, configured: process.env.ENABLE_AI_FEATURES === 'true' && Boolean(process.env.OPENROUTER_API_KEY), canReview: manager };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context();
    const body = await req.json();
    if (body.action === 'review') {
      const reviewer = await context(['OWNER', 'MANAGER']);
      const input = z.object({ id: idSchema, status: z.enum(['APPROVED', 'REJECTED']), notes: z.string().trim().max(2000).default('') }).parse(body);
      return reviewDraft(reviewer, input.id, input.status, input.notes);
    }
    return generateDraft(ctx, req, generateSchema.parse(body));
  });
}
