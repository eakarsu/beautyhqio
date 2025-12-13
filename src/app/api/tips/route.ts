import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tips - List tips with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (startDate || endDate) {
      where.transaction = {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      };
    }

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 }
    );
  }
}

// POST /api/tips - Add tip to transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, staffId, amount, method } = body;

    if (!transactionId || !staffId || !amount) {
      return NextResponse.json(
        { error: "transactionId, staffId, and amount are required" },
        { status: 400 }
      );
    }

    // Create the tip
    const tip = await prisma.tip.create({
      data: {
        transactionId,
        staffId,
        amount,
        method: method || "CREDIT_CARD",
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

    return NextResponse.json(
      {
        ...tip,
        amount: Number(tip.amount),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { error: "Failed to create tip" },
      { status: 500 }
    );
  }
}
