import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

// GET /api/test-leads - Inspect the caller's own recent marketplace leads
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);

    const leads = await prisma.marketplaceLead.findMany({
      where: { businessId: ctx.businessId },
      include: {
        client: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      business: ctx.user.businessName,
      businessId: ctx.businessId,
      totalLeads: leads.length,
      leads: leads.map((l) => ({
        id: l.id,
        status: l.status,
        source: l.source,
        client: l.client ? `${l.client.firstName} ${l.client.lastName}` : null,
        clientPhone: l.client?.phone || null,
        commission: l.commissionAmount ? Number(l.commissionAmount) : null,
        createdAt: l.createdAt,
        viewedAt: l.viewedAt,
        bookedAt: l.bookedAt,
        completedAt: l.completedAt,
      })),
    };
  });
}
