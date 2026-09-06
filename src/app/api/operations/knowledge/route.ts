import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, context, endpoint, fail, idSchema, mutation } from '@/lib/operations/core';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context();
    return { documents: await prisma.knowledgeDocument.findMany({ where: { businessId: ctx.businessId, isActive: true }, orderBy: { updatedAt: 'desc' }, take: 200 }), canEdit: ['OWNER', 'MANAGER'].includes(ctx.user.role) };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const input = z.discriminatedUnion('action', [
      z.object({ action: z.literal('save'), id: idSchema.optional(), title: z.string().trim().min(1).max(200), content: z.string().trim().min(1).max(30000), sourceUrl: z.string().url().startsWith('https://').optional(), tags: z.array(z.string().max(40)).max(20).default([]) }),
      z.object({ action: z.literal('archive'), id: idSchema }),
    ]).parse(await req.json());
    return mutation(ctx, req, 'knowledge', input, async tx => {
      if (input.id && !await tx.knowledgeDocument.findFirst({ where: { id: input.id, businessId: ctx.businessId } })) return fail(404, 'Document not found');
      const row = input.action === 'archive' ? await tx.knowledgeDocument.update({ where: { id: input.id }, data: { isActive: false } }) : await tx.knowledgeDocument.upsert({ where: { id: input.id || '__new__' }, create: { businessId: ctx.businessId, createdById: ctx.user.id, title: input.title, content: input.content, sourceUrl: input.sourceUrl, tags: input.tags }, update: { title: input.title, content: input.content, sourceUrl: input.sourceUrl, tags: input.tags } });
      await audit(tx, ctx, `KNOWLEDGE_${input.action.toUpperCase()}`, 'KnowledgeDocument', row.id, { title: row.title });
      return row;
    });
  });
}
