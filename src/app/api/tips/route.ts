import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const createSchema = z.object({
  transactionId: idSchema,
  staffId: idSchema,
  amount: z.coerce.number().finite().positive().max(1_000_000),
  method: z
    .enum([
      "CASH",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "GIFT_CARD",
      "PREPAID_PACKAGE",
      "POINTS",
      "APPLE_PAY",
      "GOOGLE_PAY",
      "OTHER",
    ])
    .default("CREDIT_CARD"),
});

// GET /api/tips - List tips with filters
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(request.url);
    const staffId = idSchema.optional().parse(searchParams.get("staffId") || undefined);
    const startDate = z
      .string()
      .datetime()
      .optional()
      .parse(searchParams.get("startDate") || undefined);
    const endDate = z
      .string()
      .datetime()
      .optional()
      .parse(searchParams.get("endDate") || undefined);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .parse(searchParams.get("limit") || 100);

    // Tips have no businessId; scope through transaction -> location.
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

    const tips = await prisma.tip.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            displayName: true,
            photo: true,
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
    const summary = await prisma.tip.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    return {
      tips: tips.map((t) => ({
        ...t,
        amount: Number(t.amount),
        transaction: t.transaction
          ? {
              ...t.transaction,
              totalAmount: Number(t.transaction.totalAmount),
            }
          : null,
      })),
      summary: {
        totalTips: Number(summary._sum.amount) || 0,
        tipCount: summary._count,
        averageTip: Number(summary._avg.amount) || 0,
      },
    };
  });
}

// POST /api/tips - Add tip to transaction
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { transactionId, staffId, amount, method } = createSchema.parse(
      await request.json()
    );

    // Both the staff member and the source transaction must belong to this tenant.
    const [staff, transaction] = await Promise.all([
      prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
        select: { id: true },
      }),
      prisma.transaction.findFirst({
        where: { id: transactionId, location: { businessId: ctx.businessId } },
        select: { id: true },
      }),
    ]);
    if (!staff) fail(404, "Staff not found");
    if (!transaction) fail(404, "Transaction not found");

    // Create the tip
    const tip = await prisma.tip.create({
      data: {
        transactionId,
        staffId,
        amount,
        method,
      },
      include: {
        staff: {
          select: { displayName: true },
        },
      },
    });

    // Update transaction tip amount
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tipAmount: {
          increment: amount,
        },
      },
    });

    return {
      ...tip,
      amount: Number(tip.amount),
    };
  });
}
