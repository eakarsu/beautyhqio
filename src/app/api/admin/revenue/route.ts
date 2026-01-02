import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/admin/revenue - Platform revenue statistics
export async function GET() {
  try {
    const authResult = await requireRoles(["PLATFORM_ADMIN"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get revenue data
    const [
      currentMonthInvoices,
      lastMonthInvoices,
      subscriptionsByPlan,
      recentInvoices,
    ] = await Promise.all([
      // Current month revenue
      prisma.businessInvoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth },
        },
        _sum: {
          totalAmount: true,
          subscriptionAmount: true,
          commissionAmount: true,
        },
      }),

      // Last month revenue
      prisma.businessInvoice.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Revenue by plan
      prisma.businessSubscription.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE" },
        _count: true,
        _sum: {
          monthlyPrice: true,
        },
      }),

      // Recent invoices
      prisma.businessInvoice.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: {
            include: {
              business: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalRevenue: Number(currentMonthInvoices._sum.totalAmount || 0),
      subscriptionRevenue: Number(currentMonthInvoices._sum.subscriptionAmount || 0),
      commissionRevenue: Number(currentMonthInvoices._sum.commissionAmount || 0),
      previousMonthRevenue: Number(lastMonthInvoices._sum.totalAmount || 0),
      revenueByPlan: subscriptionsByPlan.map((p) => ({
        plan: p.plan,
        count: p._count,
        revenue: Number(p._sum.monthlyPrice || 0),
      })),
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        businessId: inv.subscription.businessId,
        businessName: inv.subscription.business.name,
        totalAmount: inv.totalAmount,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue statistics" },
      { status: 500 }
    );
  }
}
