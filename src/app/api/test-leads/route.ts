import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/test-leads - Test endpoint to see leads directly
export async function GET(request: NextRequest) {
  try {
    // Get the first business (Luxe Beauty Studio)
    const business = await prisma.business.findFirst({
      where: { name: "Luxe Beauty Studio" }
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" });
    }

    // Get leads for this business
    const leads = await prisma.marketplaceLead.findMany({
      where: { businessId: business.id },
      include: {
        client: {
          select: { firstName: true, lastName: true, phone: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({
      business: business.name,
      businessId: business.id,
      totalLeads: leads.length,
      leads: leads.map(l => ({
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
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
