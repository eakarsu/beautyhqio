import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}
function monthName(d: Date) {
  return d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeframe, includeSeasonality, businessId: bodyBusinessId } = body;

    const user = await getAuthenticatedUser();

    let businessId = bodyBusinessId || user?.businessId;
    if (!businessId) {
      const firstBiz = await prisma.business.findFirst({
        select: { id: true },
      });
      businessId = firstBiz?.id;
    }
    if (!businessId) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    const locations = await prisma.location.findMany({
      where: { businessId },
      select: { id: true },
    });
    const locationIds = locations.map((l) => l.id);

    if (!locationIds.length) {
      return NextResponse.json(
        { error: "No locations for business" },
        { status: 404 }
      );
    }

    const now = new Date();
    const lastMonthStart = addMonths(startOfMonth(now), -1);
    const lastMonthEnd = startOfMonth(now);
    const yearAgo = addMonths(startOfMonth(now), -12);
    const weekStart = new Date(now.getTime() - 7 * DAY_MS);
    const weekEnd = new Date(now.getTime() + 7 * DAY_MS);
    const nextWeekEnd = new Date(now.getTime() + 14 * DAY_MS);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = addMonths(thisMonthStart, 1);

    // Last month transactions
    const [lastMonthTx, last12Tx, lastYearTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          locationId: { in: locationIds },
          status: "COMPLETED",
          date: { gte: lastMonthStart, lt: lastMonthEnd },
        },
        include: { lineItems: true, client: { select: { createdAt: true } } },
      }),
      prisma.transaction.findMany({
        where: {
          locationId: { in: locationIds },
          status: "COMPLETED",
          date: { gte: yearAgo },
        },
        select: {
          date: true,
          totalAmount: true,
          subtotal: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          locationId: { in: locationIds },
          status: "COMPLETED",
          date: { gte: addMonths(yearAgo, -12), lt: yearAgo },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const lastMonthRevenue = lastMonthTx.reduce(
      (s, t) => s + Number(t.totalAmount),
      0
    );
    const lastMonthAppts = await prisma.appointment.count({
      where: {
        locationId: { in: locationIds },
        scheduledStart: { gte: lastMonthStart, lt: lastMonthEnd },
        status: { in: ["COMPLETED", "CHECKED_IN", "IN_SERVICE"] },
      },
    });
    const avgTicket = lastMonthAppts
      ? Math.round(lastMonthRevenue / lastMonthAppts)
      : 0;

    const newClientsLastMonth = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: lastMonthStart, lt: lastMonthEnd },
      },
    });

    const productSales = lastMonthTx.reduce((sum, t) => {
      const productLines = t.lineItems.filter((li) => li.type === "PRODUCT");
      return sum + productLines.reduce((s, li) => s + Number(li.totalPrice), 0);
    }, 0);

    // Top services (last month)
    const topServiceLines = await prisma.transactionLineItem.groupBy({
      by: ["name"],
      where: {
        type: "SERVICE",
        transaction: {
          locationId: { in: locationIds },
          status: "COMPLETED",
          date: { gte: lastMonthStart, lt: lastMonthEnd },
        },
      },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 3,
    });
    const topServices = topServiceLines.map((s) => s.name);

    // Monthly buckets for last 12 months
    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const m = addMonths(startOfMonth(now), -11 + i);
      monthlyMap.set(m.toISOString().slice(0, 7), 0);
    }
    for (const t of last12Tx) {
      const key = t.date.toISOString().slice(0, 7);
      monthlyMap.set(
        key,
        (monthlyMap.get(key) || 0) + Number(t.totalAmount)
      );
    }
    const monthlySeries = [...monthlyMap.entries()];
    const lastQuarterRevenue = monthlySeries.slice(-3).map(([, v]) => Math.round(v));

    // Growth rate vs prior 3-month avg
    const prior3 = monthlySeries.slice(-6, -3).map(([, v]) => v);
    const recent3 = monthlySeries.slice(-3).map(([, v]) => v);
    const priorAvg = prior3.length
      ? prior3.reduce((a, b) => a + b, 0) / prior3.length
      : 0;
    const recentAvg = recent3.length
      ? recent3.reduce((a, b) => a + b, 0) / recent3.length
      : 0;
    const growthRate =
      priorAvg > 0
        ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100 * 10) / 10
        : 0;

    // Client retention: clients with appointment in last 90 days who also had one in prior 90
    const ninety = new Date(now.getTime() - 90 * DAY_MS);
    const oneEighty = new Date(now.getTime() - 180 * DAY_MS);
    const recentClients = new Set(
      (
        await prisma.appointment.findMany({
          where: {
            locationId: { in: locationIds },
            scheduledStart: { gte: ninety, lte: now },
            status: "COMPLETED",
            clientId: { not: null },
          },
          select: { clientId: true },
        })
      ).map((a) => a.clientId)
    );
    const priorClients = new Set(
      (
        await prisma.appointment.findMany({
          where: {
            locationId: { in: locationIds },
            scheduledStart: { gte: oneEighty, lt: ninety },
            status: "COMPLETED",
            clientId: { not: null },
          },
          select: { clientId: true },
        })
      ).map((a) => a.clientId)
    );
    const retainedCount = [...priorClients].filter((id) =>
      recentClients.has(id)
    ).length;
    const clientRetention = priorClients.size
      ? Math.round((retainedCount / priorClients.size) * 100)
      : 0;

    // Annual context
    const totalRevenuePrevYear = Number(lastYearTx._sum.totalAmount || 0);
    const monthSums: { name: string; total: number }[] = [];
    for (const [key, val] of monthlyMap) {
      const d = new Date(key + "-01T00:00:00Z");
      monthSums.push({ name: monthName(d), total: val });
    }
    const sortedByRevenue = [...monthSums].sort((a, b) => b.total - a.total);
    const peakMonths = sortedByRevenue.slice(0, 2).map((m) => m.name);
    const slowMonths = sortedByRevenue.slice(-2).map((m) => m.name);

    // Current bookings
    const [thisWeekBookings, nextWeekBookings, thisMonthBookings, bookedRevAgg] =
      await Promise.all([
        prisma.appointment.count({
          where: {
            locationId: { in: locationIds },
            scheduledStart: { gte: weekStart, lte: weekEnd },
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        }),
        prisma.appointment.count({
          where: {
            locationId: { in: locationIds },
            scheduledStart: { gt: weekEnd, lte: nextWeekEnd },
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        }),
        prisma.appointment.count({
          where: {
            locationId: { in: locationIds },
            scheduledStart: { gte: thisMonthStart, lt: thisMonthEnd },
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        }),
        prisma.appointmentService.aggregate({
          where: {
            appointment: {
              locationId: { in: locationIds },
              scheduledStart: { gte: now, lt: thisMonthEnd },
              status: { notIn: ["CANCELLED", "NO_SHOW"] },
            },
          },
          _sum: { price: true },
        }),
      ]);
    const bookedRevenue = Number(bookedRevAgg._sum.price || 0);

    // Staff metrics
    const allStaff = await prisma.staff.findMany({
      where: { locationId: { in: locationIds }, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        schedules: true,
      },
    });
    const totalStaff = allStaff.length;

    // Utilization estimate: hours booked / hours scheduled (last month)
    const lastMonthApptHours =
      lastMonthAppts > 0
        ? (
            await prisma.appointment.findMany({
              where: {
                locationId: { in: locationIds },
                scheduledStart: { gte: lastMonthStart, lt: lastMonthEnd },
                status: { in: ["COMPLETED", "CHECKED_IN", "IN_SERVICE"] },
              },
              select: { scheduledStart: true, scheduledEnd: true },
            })
          ).reduce(
            (sum, a) =>
              sum +
              (a.scheduledEnd.getTime() - a.scheduledStart.getTime()) /
                (60 * 60 * 1000),
            0
          )
        : 0;
    const totalScheduledHours = allStaff.reduce((sum, s) => {
      // ~22 working days per month, sum daily hours from schedules
      const daily = s.schedules
        .filter((sc) => sc.isWorking)
        .reduce((dSum, sc) => {
          const [sh, sm] = sc.startTime.split(":").map(Number);
          const [eh, em] = sc.endTime.split(":").map(Number);
          return dSum + (eh * 60 + em - sh * 60 - sm) / 60;
        }, 0);
      return sum + daily * 4;
    }, 0);
    const avgUtilization = totalScheduledHours
      ? Math.min(100, Math.round((lastMonthApptHours / totalScheduledHours) * 100))
      : 0;

    // Top performer
    const staffRevenueLastMonth = await prisma.transaction.groupBy({
      by: ["staffId"],
      where: {
        locationId: { in: locationIds },
        status: "COMPLETED",
        date: { gte: lastMonthStart, lt: lastMonthEnd },
      },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 1,
    });
    let topPerformer = "—";
    if (staffRevenueLastMonth[0]) {
      const top = allStaff.find((s) => s.id === staffRevenueLastMonth[0].staffId);
      if (top) {
        topPerformer =
          top.displayName || `${top.user.firstName} ${top.user.lastName}`;
      }
    }

    const historicalData = {
      lastMonth: {
        revenue: Math.round(lastMonthRevenue),
        appointments: lastMonthAppts,
        avgTicket,
        newClients: newClientsLastMonth,
        productSales: Math.round(productSales),
        topServices,
      },
      lastQuarter: {
        revenueByMonth: lastQuarterRevenue,
        growthRate,
        clientRetention,
      },
      lastYear: {
        totalRevenue: Math.round(totalRevenuePrevYear),
        peakMonths,
        slowMonths,
      },
      currentBookings: {
        thisWeek: thisWeekBookings,
        nextWeek: nextWeekBookings,
        thisMonth: thisMonthBookings,
        bookedRevenue: Math.round(bookedRevenue),
      },
      staffMetrics: {
        totalStaff,
        avgUtilization,
        topPerformer,
      },
    };

    const prompt = `You are a business analytics AI for a beauty salon. Based on the following REAL historical data from the database, predict future revenue and provide growth strategies.

HISTORICAL DATA:
Last Month Performance:
- Revenue: $${historicalData.lastMonth.revenue.toLocaleString()}
- Appointments: ${historicalData.lastMonth.appointments}
- Average Ticket: $${historicalData.lastMonth.avgTicket}
- New Clients: ${historicalData.lastMonth.newClients}
- Product Sales: $${historicalData.lastMonth.productSales.toLocaleString()}
- Top Services: ${historicalData.lastMonth.topServices.join(", ") || "None"}

Quarterly Trend:
- Revenue by Month: $${historicalData.lastQuarter.revenueByMonth.map((r) => r.toLocaleString()).join(", $")}
- Growth Rate: ${historicalData.lastQuarter.growthRate}%
- Client Retention: ${historicalData.lastQuarter.clientRetention}%

Annual Context:
- Total Revenue Last Year: $${historicalData.lastYear.totalRevenue.toLocaleString()}
- Peak Months: ${historicalData.lastYear.peakMonths.join(", ")}
- Slow Months: ${historicalData.lastYear.slowMonths.join(", ")}

Current Bookings:
- This Week: ${historicalData.currentBookings.thisWeek} appointments
- Next Week: ${historicalData.currentBookings.nextWeek} appointments
- This Month Total: ${historicalData.currentBookings.thisMonth} appointments
- Booked Revenue: $${historicalData.currentBookings.bookedRevenue.toLocaleString()}

Staff Metrics:
- Total Staff: ${historicalData.staffMetrics.totalStaff}
- Average Utilization: ${historicalData.staffMetrics.avgUtilization}%
- Top Performer: ${historicalData.staffMetrics.topPerformer}

Timeframe: ${timeframe || "Next Month"}
${includeSeasonality ? "Include seasonal factors in analysis." : ""}

Provide comprehensive revenue predictions in JSON format:
{
  "prediction": {
    "expectedRevenue": 50000,
    "confidenceInterval": { "low": 45000, "high": 55000 },
    "confidence": 85,
    "comparedToLastMonth": "+10.5%",
    "comparedToLastYear": "+15.2%"
  },
  "breakdown": {
    "servicesRevenue": 38000,
    "productRevenue": 9500,
    "expectedAppointments": 340,
    "expectedNewClients": 38
  },
  "monthlyForecast": [
    { "month": "January", "revenue": 42000, "trend": "down" }
  ],
  "growthDrivers": [
    { "factor": "Factor name", "impact": "+$5000", "confidence": 80, "actionable": true }
  ],
  "risks": [
    { "factor": "Risk factor", "potentialImpact": "-$3000", "probability": 30, "mitigation": "How to mitigate" }
  ],
  "opportunities": [
    { "opportunity": "Description", "potentialValue": 5000, "effort": "low/medium/high", "timeframe": "immediate/short-term/long-term" }
  ],
  "recommendations": [
    { "priority": 1, "action": "Specific action", "expectedImpact": "+$3000", "implementation": "How to implement" }
  ],
  "kpiTargets": {
    "revenueTarget": 48000,
    "appointmentTarget": 330,
    "avgTicketTarget": 150,
    "newClientTarget": 40
  }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an expert business analyst specializing in beauty and wellness industry. Provide accurate predictions based on the real historical data provided. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 10000, temperature: 0.5 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        data: result,
        historicalData,
      });
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Revenue Predictor Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate revenue prediction",
      },
      { status: 500 }
    );
  }
}
