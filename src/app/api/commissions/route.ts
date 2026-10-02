import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const createSchema = z.object({
  transactionId: idSchema,
  staffId: idSchema,
  type: z.string().trim().min(1).max(50),
  baseAmount: z.coerce.number().finite().positive().max(1_000_000),
  customRate: z.coerce.number().finite().min(0).max(100).optional(),
});

// GET /api/commissions - List commissions with filters
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(request.url);
    const staffId = idSchema.optional().parse(searchParams.get("staffId") || undefined);
    const startDate = z.string().datetime().optional().parse(searchParams.get("startDate") || undefined);
    const endDate = z.string().datetime().optional().parse(searchParams.get("endDate") || undefined);
    const type = z.string().trim().max(50).optional().parse(searchParams.get("type") || undefined);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .parse(searchParams.get("limit") || 100);

    // Commissions have no businessId; scope through transaction -> location.
    const transactionWhere: Record<string, unknown> = {
      location: { businessId: ctx.businessId },
    };
    if (startDate || endDate) {
      transactionWhere.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const where: Record<string, unknown> = { transaction: transactionWhere };
    if (staffId) where.staffId = staffId;
    if (type) where.type = type;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            displayName: true,
            photo: true,
            commissionPct: true,
            productCommissionPct: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
            date: true,
            totalAmount: true,
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { transaction: { date: "desc" } },
      take: limit,
    });

    // Calculate summary
    const summary = await prisma.commission.aggregate({
      where,
      _sum: { amount: true, baseAmount: true },
      _count: true,
    });

    // Group by type
    const byType = await prisma.commission.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      commissions: commissions.map((c) => ({
        ...c,
        amount: Number(c.amount),
        rate: Number(c.rate),
        baseAmount: Number(c.baseAmount),
        staff: {
          ...c.staff,
          commissionPct: c.staff.commissionPct
            ? Number(c.staff.commissionPct)
            : null,
          productCommissionPct: c.staff.productCommissionPct
            ? Number(c.staff.productCommissionPct)
            : null,
        },
        transaction: c.transaction
          ? {
              ...c.transaction,
              totalAmount: Number(c.transaction.totalAmount),
            }
          : null,
      })),
      summary: {
        totalCommissions: Number(summary._sum.amount) || 0,
        totalBaseAmount: Number(summary._sum.baseAmount) || 0,
        count: summary._count,
        effectiveRate:
          summary._sum.baseAmount && Number(summary._sum.baseAmount) > 0
            ? ((Number(summary._sum.amount) || 0) /
                Number(summary._sum.baseAmount)) *
              100
            : 0,
      },
      byType: byType.map((t) => ({
        type: t.type,
        total: Number(t._sum.amount) || 0,
        count: t._count,
      })),
    };
  });
}

// POST /api/commissions - Calculate and record commission
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { transactionId, staffId, type, baseAmount, customRate } =
      createSchema.parse(await request.json());

    // Both the staff member and the source transaction must belong to this tenant.
    const [staff, transaction] = await Promise.all([
      prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
        select: {
          id: true,
          commissionPct: true,
          productCommissionPct: true,
        },
      }),
      prisma.transaction.findFirst({
        where: { id: transactionId, location: { businessId: ctx.businessId } },
        select: { id: true },
      }),
    ]);
    if (!staff) fail(404, "Staff not found");
    if (!transaction) fail(404, "Transaction not found");

    // Determine rate
    let rate: number;
    if (customRate !== undefined) {
      rate = customRate;
    } else if (type === "product") {
      rate = staff.productCommissionPct
        ? Number(staff.productCommissionPct)
        : 10;
    } else {
      rate = staff.commissionPct ? Number(staff.commissionPct) : 50;
    }

    // Calculate commission amount
    const amount = (baseAmount * rate) / 100;

    // Create the commission
    const commission = await prisma.commission.create({
      data: {
        transactionId,
        staffId,
        type,
        baseAmount,
        rate,
        amount,
      },
      include: {
        staff: {
          select: { displayName: true },
        },
      },
    });

    return {
      ...commission,
      amount: Number(commission.amount),
      rate: Number(commission.rate),
      baseAmount: Number(commission.baseAmount),
    };
  });
}
