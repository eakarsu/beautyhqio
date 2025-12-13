import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/daily-closeout - Get daily closeout report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const staffId = searchParams.get("staffId");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause
    const transactionWhere: Record<string, unknown> = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (staffId) {
      transactionWhere.staffId = staffId;
    }

    // Get all transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
      include: {
        lineItems: {
          include: {
            service: true,
            product: true,
          },
        },
        payments: true,
        tips: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        client: true,
      },
    });

    // Calculate totals
    const totals = {
      grossSales: 0,
      discounts: 0,
      netSales: 0,
      tax: 0,
      tips: 0,
      refunds: 0,
      grandTotal: 0,
    };

    const paymentBreakdown: Record<string, number> = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      GIFT_CARD: 0,
      CHECK: 0,
      OTHER: 0,
    };

    const serviceBreakdown: Record<string, { count: number; revenue: number }> = {};
    const productBreakdown: Record<string, { count: number; revenue: number }> = {};
    const staffBreakdown: Record<string, { transactions: number; revenue: number; tips: number }> = {};

    transactions.forEach((tx) => {
      if (tx.status === "REFUNDED") {
        totals.refunds += Number(tx.totalAmount);
        return;
      }

      totals.grossSales += Number(tx.subtotal);
      totals.discounts += Number(tx.discountAmount || 0);
      totals.tax += Number(tx.taxAmount);
      totals.tips += tx.tips.reduce((sum, t) => sum + Number(t.amount), 0);
      totals.netSales += Number(tx.subtotal) - Number(tx.discountAmount || 0);
      totals.grandTotal += Number(tx.totalAmount);

      // Payment breakdown
      tx.payments.forEach((payment) => {
        const method = payment.method as string;
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(payment.amount);
      });

      // Item breakdown
      tx.lineItems.forEach((item) => {
        if (item.service) {
          if (!serviceBreakdown[item.service.name]) {
            serviceBreakdown[item.service.name] = { count: 0, revenue: 0 };
          }
          serviceBreakdown[item.service.name].count += item.quantity;
          serviceBreakdown[item.service.name].revenue += Number(item.totalPrice);
        }
        if (item.product) {
          if (!productBreakdown[item.product.name]) {
            productBreakdown[item.product.name] = { count: 0, revenue: 0 };
          }
          productBreakdown[item.product.name].count += item.quantity;
          productBreakdown[item.product.name].revenue += Number(item.totalPrice);
        }
      });

      // Staff breakdown
      if (tx.staff) {
        const staffName = tx.staff.displayName || `${tx.staff.user.firstName} ${tx.staff.user.lastName}`;
        if (!staffBreakdown[staffName]) {
          staffBreakdown[staffName] = { transactions: 0, revenue: 0, tips: 0 };
        }
        staffBreakdown[staffName].transactions++;
        staffBreakdown[staffName].revenue += Number(tx.totalAmount);
        staffBreakdown[staffName].tips += tx.tips.reduce((sum, t) => sum + Number(t.amount), 0);
      }
    });

    // Get appointment stats
    const appointmentWhere: Record<string, unknown> = {
      scheduledStart: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (staffId) {
      appointmentWhere.staffId = staffId;
    }

    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
    });

    const appointmentStats = {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      noShow: appointments.filter((a) => a.status === "NO_SHOW").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    };

    // Get new clients
    const newClients = await prisma.client.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return NextResponse.json({
      date: targetDate.toDateString(),
      transactionCount: transactions.filter((t) => t.status !== "REFUNDED").length,
      totals,
      paymentBreakdown,
      serviceBreakdown,
      productBreakdown,
      staffBreakdown,
      appointmentStats,
      newClients,
    });
  } catch (error) {
    console.error("Error generating closeout report:", error);
    return NextResponse.json(
      { error: "Failed to generate closeout report" },
      { status: 500 }
    );
  }
}

// POST /api/daily-closeout - Close out the day and create report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, notes, cashCounted, staffId } = body;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get the closeout data
    const closeoutResponse = await fetch(
      new URL(
        `/api/daily-closeout?date=${targetDate.toISOString()}${staffId ? `&staffId=${staffId}` : ""}`,
        request.url
      ).toString()
    );

    const closeoutData = await closeoutResponse.json();

    // Calculate cash variance if cash counted is provided
    let cashVariance = null;
    if (cashCounted !== undefined) {
      const expectedCash = closeoutData.paymentBreakdown.CASH || 0;
      cashVariance = cashCounted - expectedCash;
    }

    // Create closeout record
    const closeout = await prisma.dailyCloseout.create({
      data: {
        date: targetDate,
        staffId: staffId || null,
        totalTransactions: closeoutData.transactionCount,
        grossSales: closeoutData.totals.grossSales,
        discounts: closeoutData.totals.discounts,
        netSales: closeoutData.totals.netSales,
        tax: closeoutData.totals.tax,
        tips: closeoutData.totals.tips,
        refunds: closeoutData.totals.refunds,
        grandTotal: closeoutData.totals.grandTotal,
        cashTotal: closeoutData.paymentBreakdown.CASH || 0,
        cardTotal:
          (closeoutData.paymentBreakdown.CREDIT_CARD || 0) +
          (closeoutData.paymentBreakdown.DEBIT_CARD || 0),
        otherTotal:
          (closeoutData.paymentBreakdown.GIFT_CARD || 0) +
          (closeoutData.paymentBreakdown.CHECK || 0) +
          (closeoutData.paymentBreakdown.OTHER || 0),
        cashCounted: cashCounted || null,
        cashVariance: cashVariance,
        appointmentsTotal: closeoutData.appointmentStats.total,
        appointmentsCompleted: closeoutData.appointmentStats.completed,
        appointmentsNoShow: closeoutData.appointmentStats.noShow,
        newClients: closeoutData.newClients,
        notes: notes || null,
        closedAt: new Date(),
        reportData: closeoutData,
      },
    });

    return NextResponse.json({
      success: true,
      closeout: {
        id: closeout.id,
        date: closeout.date,
        grandTotal: closeout.grandTotal,
        cashVariance: closeout.cashVariance,
      },
      report: closeoutData,
    });
  } catch (error) {
    console.error("Error creating closeout:", error);
    return NextResponse.json(
      { error: "Failed to create closeout" },
      { status: 500 }
    );
  }
}
