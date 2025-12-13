import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/commissions/staff/[staffId] - Get commission summary for specific staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

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

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        displayName: true,
        photo: true,
        commissionPct: true,
        productCommissionPct: true,
        payType: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get commissions for the period
    const commissions = await prisma.commission.findMany({
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
            lineItems: {
              select: {
                type: true,
                name: true,
                totalPrice: true,
              },
            },
          },
        },
      },
      orderBy: { transaction: { date: "desc" } },
    });

    // Aggregate by type
    const byType = await prisma.commission.groupBy({
      by: ["type"],
      where: {
        staffId,
        transaction: {
          date: { gte: startDate },
        },
      },
      _sum: { amount: true, baseAmount: true },
      _count: true,
    });

    // Calculate totals
    const totalCommissions = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );
    const totalBase = commissions.reduce(
      (sum, c) => sum + Number(c.baseAmount),
      0
    );

    // Daily breakdown for chart
    const dailyCommissions: Record<string, number> = {};
    commissions.forEach((comm) => {
      const date = comm.transaction.date.toISOString().split("T")[0];
      dailyCommissions[date] =
        (dailyCommissions[date] || 0) + Number(comm.amount);
    });

    // Get tips for the same period
    const tips = await prisma.tip.aggregate({
      where: {
        staffId,
        transaction: {
          date: { gte: startDate },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      staff: {
        ...staff,
        commissionPct: staff.commissionPct
          ? Number(staff.commissionPct)
          : null,
        productCommissionPct: staff.productCommissionPct
          ? Number(staff.productCommissionPct)
          : null,
      },
      period,
      summary: {
        totalCommissions,
        totalBaseAmount: totalBase,
        commissionCount: commissions.length,
        effectiveRate: totalBase > 0 ? (totalCommissions / totalBase) * 100 : 0,
        totalTips: Number(tips._sum.amount) || 0,
        tipCount: tips._count,
        totalEarnings: totalCommissions + (Number(tips._sum.amount) || 0),
      },
      byType: byType.map((t) => ({
        type: t.type,
        totalCommissions: Number(t._sum.amount) || 0,
        totalBase: Number(t._sum.baseAmount) || 0,
        count: t._count,
      })),
      dailyBreakdown: Object.entries(dailyCommissions)
        .map(([date, total]) => ({
          date,
          total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentCommissions: commissions.slice(0, 10).map((c) => ({
        id: c.id,
        amount: Number(c.amount),
        rate: Number(c.rate),
        baseAmount: Number(c.baseAmount),
        type: c.type,
        date: c.transaction.date,
        transactionTotal: Number(c.transaction.totalAmount),
      })),
    });
  } catch (error) {
    console.error("Error fetching staff commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff commissions" },
      { status: 500 }
    );
  }
}

// PATCH /api/commissions/staff/[staffId] - Update staff commission rates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const body = await request.json();
    const { commissionPct, productCommissionPct, payType } = body;

    const updateData: Record<string, unknown> = {};
    if (commissionPct !== undefined) updateData.commissionPct = commissionPct;
    if (productCommissionPct !== undefined)
      updateData.productCommissionPct = productCommissionPct;
    if (payType !== undefined) updateData.payType = payType;

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        commissionPct: true,
        productCommissionPct: true,
        payType: true,
      },
    });

    return NextResponse.json({
      ...staff,
      commissionPct: staff.commissionPct ? Number(staff.commissionPct) : null,
      productCommissionPct: staff.productCommissionPct
        ? Number(staff.productCommissionPct)
        : null,
    });
  } catch (error) {
    console.error("Error updating staff commission rates:", error);
    return NextResponse.json(
      { error: "Failed to update commission rates" },
      { status: 500 }
    );
  }
}
