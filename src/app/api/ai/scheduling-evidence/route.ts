import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { schedulingEvidence } from '@/lib/appointments/scheduling-evidence';

export async function POST(request: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const body = await request.json();
    if (body?.historyUseAcknowledged !== true) return Response.json({ error: 'Acknowledge authorized use of historical scheduling data' }, { status: 422 });
    const since = new Date(Date.now() - 84 * 86_400_000);
    const [business, rows] = await Promise.all([
      prisma.business.findUnique({ where: { id: ctx.businessId }, select: { timezone: true } }),
      prisma.appointment.findMany({ where: { businessId: ctx.businessId, scheduledStart: { gte: since, lt: new Date() }, status: { in: ['COMPLETED', 'NO_SHOW'] } }, select: { staffId: true, scheduledStart: true, scheduledEnd: true, status: true }, orderBy: { scheduledStart: 'desc' }, take: 20_000 }),
    ]);
    if (!business) return Response.json({ error: 'Business not found' }, { status: 404 });
    await prisma.auditLog.create({ data: { userId: ctx.user.id, businessId: ctx.businessId, action: 'SCHEDULING_HISTORY_ANALYZED', entityType: 'Business', entityId: ctx.businessId, changes: { since: since.toISOString(), rows: rows.length, acknowledged: true } } });
    return Response.json({ ...schedulingEvidence(rows, business.timezone), historyStart: since.toISOString(), historyEnd: new Date().toISOString(), timeZone: business.timezone, recordsTruncated: rows.length === 20_000 });
  });
}
