import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/daily-closeout/history - Get closeout history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const staffId = searchParams.get("staffId");
    const limit = parseInt(searchParams.get("limit") || "30");

    const whereClause: Record<string, unknown> = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        (whereClause.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const closeouts = await prisma.dailyCloseout.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        staff: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Calculate summary stats
    const summary = {
      totalDays: closeouts.length,
      totalRevenue: closeouts.reduce((sum, c) => sum + Number(c.grandTotal), 0),
      totalTransactions: closeouts.reduce((sum, c) => sum + c.totalTransactions, 0),
      totalTips: closeouts.reduce((sum, c) => sum + Number(c.tips), 0),
      averageDailyRevenue: 0,
      averageTransactionsPerDay: 0,
      cashVarianceTotal: closeouts.reduce(
        (sum, c) => sum + Number(c.cashVariance || 0),
        0
      ),
    };

    if (closeouts.length > 0) {
      summary.averageDailyRevenue = summary.totalRevenue / closeouts.length;
      summary.averageTransactionsPerDay = summary.totalTransactions / closeouts.length;
    }

    return NextResponse.json({
      closeouts: closeouts.map((c) => ({
        id: c.id,
        date: c.date,
        staff: c.staff
          ? c.staff.displayName || `${c.staff.user.firstName} ${c.staff.user.lastName}`
          : "All Staff",
        totalTransactions: c.totalTransactions,
        grossSales: Number(c.grossSales),
        discounts: Number(c.discounts),
        netSales: Number(c.netSales),
        tax: Number(c.tax),
        tips: Number(c.tips),
        grandTotal: Number(c.grandTotal),
        cashVariance: c.cashVariance ? Number(c.cashVariance) : null,
        appointmentsTotal: c.appointmentsTotal,
        appointmentsCompleted: c.appointmentsCompleted,
        newClients: c.newClients,
        closedAt: c.closedAt,
      })),
      summary,
    });
  } catch (error) {
    console.error("Error fetching closeout history:", error);
    return NextResponse.json(
      { error: "Failed to fetch closeout history" },
      { status: 500 }
    );
  }
}
