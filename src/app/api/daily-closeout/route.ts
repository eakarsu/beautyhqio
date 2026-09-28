import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, json } from "@/lib/operations/core";

const CLOSEOUT_ROLES = ["OWNER", "MANAGER", "RECEPTIONIST"] as const;

function parseReportDate(value: unknown): Date {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) fail(422, "A valid date is required");
  return date;
}

// Report is always built inside the caller's tenant; staff, appointments,
// clients and transactions are filtered by the business they belong to.
async function buildCloseoutReport(
  businessId: string,
  targetDate: Date,
  staffId: string | null
) {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Transactions have no businessId of their own; they belong to a location.
  const transactionWhere: Record<string, unknown> = {
    createdAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
    location: { businessId },
  };

  if (staffId) {
    transactionWhere.staffId = staffId;
  }

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

    tx.payments.forEach((payment) => {
      const method = payment.method as string;
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(payment.amount);
    });

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

  const appointmentWhere: Record<string, unknown> = {
    scheduledStart: {
      gte: startOfDay,
      lte: endOfDay,
    },
    businessId,
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

  const newClients = await prisma.client.count({
    where: {
      businessId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return {
    date: targetDate.toDateString(),
    transactionCount: transactions.filter((t) => t.status !== "REFUNDED").length,
    totals,
    paymentBreakdown,
    serviceBreakdown,
    productBreakdown,
    staffBreakdown,
    appointmentStats,
    newClients,
  };
}

// GET /api/daily-closeout - Get daily closeout report for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...CLOSEOUT_ROLES]);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const targetDate = parseReportDate(searchParams.get("date"));

    return NextResponse.json(await buildCloseoutReport(ctx.businessId, targetDate, staffId));
  });
}

// POST /api/daily-closeout - Close out the day for the caller's business
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...CLOSEOUT_ROLES]);
    const body = await request.json().catch(() => ({}));

    const targetDate = parseReportDate(body.date);
    const staffId = typeof body.staffId === "string" && body.staffId ? body.staffId : null;

    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
        select: { id: true },
      });
      if (!staff) fail(404, "Staff member not found in this business");
    }

    let cashCounted: number | null = null;
    if (body.cashCounted !== undefined && body.cashCounted !== null && body.cashCounted !== "") {
      cashCounted = Number(body.cashCounted);
      if (!Number.isFinite(cashCounted)) fail(422, "cashCounted must be a number");
    }

    const report = await buildCloseoutReport(ctx.businessId, targetDate, staffId);
    const cashVariance =
      cashCounted === null ? null : cashCounted - (report.paymentBreakdown.CASH || 0);

    const closeout = await prisma.dailyCloseout.create({
      data: {
        businessId: ctx.businessId,
        date: targetDate,
        staffId,
        totalTransactions: report.transactionCount,
        grossSales: report.totals.grossSales,
        discounts: report.totals.discounts,
        netSales: report.totals.netSales,
        tax: report.totals.tax,
        tips: report.totals.tips,
        refunds: report.totals.refunds,
        grandTotal: report.totals.grandTotal,
        cashTotal: report.paymentBreakdown.CASH || 0,
        cardTotal:
          (report.paymentBreakdown.CREDIT_CARD || 0) +
          (report.paymentBreakdown.DEBIT_CARD || 0),
        otherTotal:
          (report.paymentBreakdown.GIFT_CARD || 0) +
          (report.paymentBreakdown.CHECK || 0) +
          (report.paymentBreakdown.OTHER || 0),
        cashCounted,
        cashVariance,
        appointmentsTotal: report.appointmentStats.total,
        appointmentsCompleted: report.appointmentStats.completed,
        appointmentsNoShow: report.appointmentStats.noShow,
        newClients: report.newClients,
        notes: typeof body.notes === "string" && body.notes ? body.notes : null,
        closedAt: new Date(),
        reportData: json(report),
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
      report,
    });
  });
}
