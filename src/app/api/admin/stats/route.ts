import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/admin/stats - Platform admin statistics
export async function GET() {
  try {
    // Require PLATFORM_ADMIN role
    const authResult = await requireRoles(["PLATFORM_ADMIN"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get current date info for monthly calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all statistics in parallel
    const [
      totalSalons,
      activeSalons,
      totalUsers,
      totalClients,
      subscriptions,
      currentMonthInvoices,
      lastMonthInvoices,
      recentSalons,
    ] = await Promise.all([
      // Total salons
      prisma.business.count(),

      // Active salons (with at least one active user)
      prisma.business.count({
        where: {
          users: {
            some: {
              isActive: true,
            },
          },
        },
      }),

      // Total users
      prisma.user.count({
        where: {
          role: { not: "PLATFORM_ADMIN" },
        },
      }),

      // Total clients across all businesses
      prisma.client.count(),

      // Subscriptions breakdown
      prisma.businessSubscription.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Current month revenue (from business invoices)
      prisma.businessInvoice.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
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

      // Recent salons
      prisma.business.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Calculate subscription counts
    const totalSubscriptions = subscriptions.reduce((acc, s) => acc + s._count, 0);
    const trialSubscriptions = subscriptions.find((s) => s.status === "TRIAL")?._count || 0;

    return NextResponse.json({
      totalSalons,
      activeSalons,
      totalUsers,
      totalClients,
      monthlyRevenue: Number(currentMonthInvoices._sum.totalAmount || 0),
      previousMonthRevenue: Number(lastMonthInvoices._sum.totalAmount || 0),
      totalSubscriptions,
      trialSubscriptions,
      recentSalons: recentSalons.map((salon) => ({
        id: salon.id,
        name: salon.name,
        type: salon.type,
        createdAt: salon.createdAt.toISOString(),
        subscription: salon.subscription
          ? {
              plan: salon.subscription.plan,
              status: salon.subscription.status,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform statistics" },
      { status: 500 }
    );
  }
}
