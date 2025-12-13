import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/revenue - Revenue report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const locationId = searchParams.get("locationId");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    const where: Record<string, unknown> = {
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    if (locationId) where.locationId = locationId;

    // Get transactions data
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        subtotal: true,
        taxAmount: true,
        tipAmount: true,
        discountAmount: true,
        date: true,
        lineItems: {
          select: {
            type: true,
            totalPrice: true,
          },
        },
        payments: {
          select: {
            method: true,
            amount: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Aggregate totals
    let totalRevenue = 0;
    let totalTax = 0;
    let totalTips = 0;
    let totalDiscounts = 0;
    let serviceRevenue = 0;
    let productRevenue = 0;
    const paymentMethods: Record<string, number> = {};

    for (const tx of transactions) {
      totalRevenue += Number(tx.totalAmount);
      totalTax += Number(tx.taxAmount);
      totalTips += Number(tx.tipAmount || 0);
      totalDiscounts += Number(tx.discountAmount || 0);

      for (const payment of tx.payments) {
        const method = payment.method || "OTHER";
        paymentMethods[method] = (paymentMethods[method] || 0) + Number(payment.amount);
      }

      for (const item of tx.lineItems) {
        if (item.type === "SERVICE") {
          serviceRevenue += Number(item.totalPrice);
        } else if (item.type === "PRODUCT") {
          productRevenue += Number(item.totalPrice);
        }
      }
    }

    // Group by time period
    const grouped: Record<string, { revenue: number; count: number }> = {};

    for (const tx of transactions) {
      if (!tx.date) continue;
      const date = new Date(tx.date);
      let key: string;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = date.toISOString().split("T")[0];
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0 };
      }
      grouped[key].revenue += Number(tx.totalAmount);
      grouped[key].count += 1;
    }

    const timeSeries = Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalTax,
        totalTips,
        totalDiscounts,
        serviceRevenue,
        productRevenue,
        transactionCount: transactions.length,
        averageTransaction: transactions.length ? totalRevenue / transactions.length : 0,
      },
      paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
        method,
        amount,
        percentage: totalRevenue ? (amount / totalRevenue) * 100 : 0,
      })),
      timeSeries,
    });
  } catch (error) {
    console.error("Error generating revenue report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
