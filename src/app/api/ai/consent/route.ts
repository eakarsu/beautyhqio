import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint, fail, idSchema } from '@/lib/operations/core';
const feature = z.enum(['skin_analyzer', 'mental_health', 'symptom_checker', 'posture', 'sleep']);
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const input = z.object({ clientId: idSchema, feature, granted: z.boolean(), signature: z.string().max(200000).optional() }).parse(await req.json());
    if (ctx.user.role === 'CLIENT' && input.clientId !== ctx.user.clientId) return fail(403, 'Consent must belong to your profile');
    if (!await prisma.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId } })) return fail(404, 'Client not found');
    return prisma.$transaction(async tx => {
      const row = await tx.aIConsent.create({ data: { ...input, businessId: ctx.businessId, userId: ctx.user.id } });
      await tx.wellnessAuditLog.create({ data: { businessId: ctx.businessId, clientId: input.clientId, userId: ctx.user.id, feature: input.feature, action: input.granted ? 'consent_granted' : 'consent_revoked', resourceId: row.id } });
      return row;
    });
  });
}
export async function GET(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const p = new URL(req.url).searchParams;
    const clientId = ctx.user.role === 'CLIENT' ? ctx.user.clientId || '__none__' : p.get('clientId') || undefined;
    const rows = await prisma.aIConsent.findMany({ where: { businessId: ctx.businessId, clientId, ...(p.get('feature') ? { feature: feature.parse(p.get('feature')) } : {}) }, orderBy: { createdAt: 'desc' }, take: 100 });
    return { data: rows, total: rows.length, page: 1, pageSize: 100 };
  });
}
