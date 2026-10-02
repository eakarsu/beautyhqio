import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const payTypeSchema = z.enum(["HOURLY", "COMMISSION", "SALARY", "HYBRID"]);

const updateSchema = z.object({
  commissionPct: z.coerce.number().finite().min(0).max(100).optional(),
  productCommissionPct: z.coerce.number().finite().min(0).max(100).optional(),
  payType: payTypeSchema.optional(),
});

// GET /api/commissions/staff/[staffId] - Get commission summary for specific staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { staffId } = await params;
    const { searchParams } = new URL(request.url);
    const period = z
      .enum(["day", "week", "month", "year"])
      .default("month")
      .parse(searchParams.get("period") || "month");

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

    // Get staff info (scoped through location, since Staff has no businessId)
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, location: { businessId: ctx.businessId } },
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

    if (!staff) fail(404, "Staff not found");

    const tenantTransaction = {
      location: { businessId: ctx.businessId },
      date: { gte: startDate },
    };

    // Get commissions for the period
    const commissions = await prisma.commission.findMany({
      where: {
        staffId,
        transaction: tenantTransaction,
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
        transaction: tenantTransaction,
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
        transaction: tenantTransaction,
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
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
    };
  });
}

// PATCH /api/commissions/staff/[staffId] - Update staff commission rates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { staffId } = await params;
    const { commissionPct, productCommissionPct, payType } = updateSchema.parse(
      await request.json()
    );

    const owned = await prisma.staff.findFirst({
      where: { id: staffId, location: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!owned) fail(404, "Staff not found");

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

    return {
      ...staff,
      commissionPct: staff.commissionPct ? Number(staff.commissionPct) : null,
      productCommissionPct: staff.productCommissionPct
        ? Number(staff.productCommissionPct)
        : null,
    };
  });
}
