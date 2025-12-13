import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tips/staff/[staffId] - Get tips summary for specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "month":
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get tips for the period
    const tips = await prisma.tip.findMany({
      where: {
        staffId,
        transaction: {
          date: { gte: startDate },
        },
      },
      include: {
        transaction: {
          select: {
            date: true,
            totalAmount: true,
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { transaction: { date: "desc" } },
    });

    // Aggregate by method
    const byMethod = await prisma.tip.groupBy({
      by: ["method"],
      where: {
        staffId,
        transaction: {
          date: { gte: startDate },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Calculate totals
    const totalTips = tips.reduce((sum, t) => sum + Number(t.amount), 0);
    const avgTip = tips.length > 0 ? totalTips / tips.length : 0;

    // Daily breakdown for chart
    const dailyTips: Record<string, number> = {};
    tips.forEach((tip) => {
      const date = tip.transaction.date.toISOString().split("T")[0];
      dailyTips[date] = (dailyTips[date] || 0) + Number(tip.amount);
    });

    return NextResponse.json({
      staffId,
      period,
      summary: {
        totalTips,
        tipCount: tips.length,
        averageTip: avgTip,
      },
      byMethod: byMethod.map((m) => ({
        method: m.method,
        total: Number(m._sum.amount) || 0,
        count: m._count,
      })),
      dailyBreakdown: Object.entries(dailyTips).map(([date, total]) => ({
        date,
        total,
      })),
      recentTips: tips.slice(0, 10).map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        method: t.method,
        date: t.transaction.date,
        clientName: t.transaction.client
          ? `${t.transaction.client.firstName} ${t.transaction.client.lastName}`
          : "Walk-in",
        transactionTotal: Number(t.transaction.totalAmount),
      })),
    });
  } catch (error) {
    console.error("Error fetching staff tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff tips" },
      { status: 500 }
    );
  }
}
