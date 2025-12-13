import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/client-analytics - Client analytics report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get total clients
    const totalClients = await prisma.client.count();

    // New clients in period
    const newClients = await prisma.client.count({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {},
    });

    // Active clients (status = ACTIVE)
    const activeClients = await prisma.client.count({
      where: { status: "ACTIVE" },
    });

    // Get client appointments for retention analysis
    const clientsWithMultipleAppointments = await prisma.appointment.groupBy({
      by: ["clientId"],
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
    });
    const returningClients = clientsWithMultipleAppointments.length;

    // Top clients by transaction total
    const topClientsBySpend = await prisma.transaction.groupBy({
      by: ["clientId"],
      _sum: { totalAmount: true },
      where: {
        clientId: { not: null },
        status: "COMPLETED",
      },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    });

    // Get client details for top spenders
    const topClientIds = topClientsBySpend
      .filter((t) => t.clientId !== null)
      .map((t) => t.clientId as string);
    const topClientsDetails = await prisma.client.findMany({
      where: { id: { in: topClientIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const topClients = topClientsBySpend.map((t) => {
      const client = topClientsDetails.find((c) => c.id === t.clientId);
      return {
        id: t.clientId,
        firstName: client?.firstName || "",
        lastName: client?.lastName || "",
        email: client?.email || "",
        totalSpend: Number(t._sum.totalAmount || 0),
      };
    });

    // Clients by referral source
    const clientsBySource = await prisma.client.groupBy({
      by: ["referralSource"],
      _count: { id: true },
    });

    // Average transactions per client
    const avgTransactions = await prisma.transaction.groupBy({
      by: ["clientId"],
      _count: { id: true },
      where: { clientId: { not: null } },
    });
    const avgVisitsPerClient =
      avgTransactions.length > 0
        ? avgTransactions.reduce((sum, t) => sum + t._count.id, 0) / avgTransactions.length
        : 0;

    // Average spend from transactions
    const avgSpendResult = await prisma.transaction.aggregate({
      _avg: { totalAmount: true },
      where: { status: "COMPLETED" },
    });

    // Churn analysis - clients with no appointment in 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentActiveClientIds = await prisma.appointment.findMany({
      where: {
        scheduledStart: { gte: ninetyDaysAgo },
        clientId: { not: null },
      },
      select: { clientId: true },
      distinct: ["clientId"],
    });

    const allClientIds = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    const recentIds = new Set(recentActiveClientIds.map((a) => a.clientId));
    const atRiskClients = allClientIds.filter((c) => !recentIds.has(c.id)).length;

    // Loyalty tier distribution
    const loyaltyDistribution = await prisma.loyaltyAccount.groupBy({
      by: ["tier"],
      _count: { id: true },
    });

    // Birthday this month
    const today = new Date();
    const birthdaysThisMonth = await prisma.client.count({
      where: {
        birthdayMonth: today.getMonth() + 1,
      },
    });

    return NextResponse.json({
      overview: {
        totalClients,
        newClients,
        activeClients,
        returningClients,
        retentionRate: totalClients ? (returningClients / totalClients) * 100 : 0,
        atRiskClients,
      },
      averages: {
        lifetimeValue: Number(avgSpendResult._avg.totalAmount || 0),
        visitsPerClient: avgVisitsPerClient,
      },
      topClients,
      distribution: {
        bySource: clientsBySource.map((s) => ({
          source: s.referralSource || "unknown",
          count: s._count.id,
        })),
        byLoyaltyTier: loyaltyDistribution.map((l) => ({
          tier: l.tier,
          count: l._count.id,
        })),
      },
      birthdaysThisMonth,
    });
  } catch (error) {
    console.error("Error generating client analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
