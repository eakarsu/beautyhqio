import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/commissions - List commissions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type"); // service, product
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.transaction = {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      };
    }

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}

// POST /api/commissions - Calculate and record commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, staffId, type, baseAmount, customRate } = body;

    if (!transactionId || !staffId || !type || !baseAmount) {
      return NextResponse.json(
        { error: "transactionId, staffId, type, and baseAmount are required" },
        { status: 400 }
      );
    }

    // Get staff commission rates
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        commissionPct: true,
        productCommissionPct: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

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

    return NextResponse.json(
      {
        ...commission,
        amount: Number(commission.amount),
        rate: Number(commission.rate),
        baseAmount: Number(commission.baseAmount),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating commission:", error);
    return NextResponse.json(
      { error: "Failed to create commission" },
      { status: 500 }
    );
  }
}
