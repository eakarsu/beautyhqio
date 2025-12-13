import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/openrouter";
import { Decimal } from "@prisma/client/runtime/library";

// GET /api/ai/business-insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    // Get date ranges
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const whereLocation = locationId ? { locationId } : {};

    // Current period revenue
    const currentTransactions = await prisma.transaction.findMany({
      where: {
        ...whereLocation,
        createdAt: { gte: currentPeriodStart },
        status: "COMPLETED",
      },
    });
    const currentRevenue = currentTransactions.reduce(
      (sum, t) => sum + Number(t.totalAmount),
      0
    );

    // Previous period revenue
    const previousTransactions = await prisma.transaction.findMany({
      where: {
        ...whereLocation,
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
        status: "COMPLETED",
      },
    });
    const previousRevenue = previousTransactions.reduce(
      (sum, t) => sum + Number(t.totalAmount),
      0
    );

    // Current period appointments
    const currentAppointments = await prisma.appointment.count({
      where: {
        ...whereLocation,
        scheduledStart: { gte: currentPeriodStart },
      },
    });

    // Previous period appointments
    const previousAppointments = await prisma.appointment.count({
      where: {
        ...whereLocation,
        scheduledStart: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    // Top services (by revenue)
    const serviceRevenue = await prisma.transactionLineItem.groupBy({
      by: ["serviceId"],
      where: {
        serviceId: { not: null },
        transaction: {
          ...whereLocation,
          createdAt: { gte: currentPeriodStart },
          status: "COMPLETED",
        },
      },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });

    const topServiceIds = serviceRevenue
      .filter((s) => s.serviceId)
      .map((s) => s.serviceId as string);

    const topServices = await prisma.service.findMany({
      where: { id: { in: topServiceIds } },
    });

    const topServiceNames = topServiceIds.map(
      (id) => topServices.find((s) => s.id === id)?.name || "Unknown"
    );

    // Low performing services
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
    });

    const lowPerformingServices = allServices
      .filter((s) => !topServiceIds.includes(s.id))
      .slice(0, 3)
      .map((s) => s.name);

    // Client retention (clients who visited more than once in past 3 months)
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const clientVisits = await prisma.appointment.groupBy({
      by: ["clientId"],
      where: {
        ...whereLocation,
        scheduledStart: { gte: threeMonthsAgo },
        status: "COMPLETED",
      },
      _count: true,
    });

    const totalActiveClients = clientVisits.length;
    const repeatClients = clientVisits.filter((c) => c._count > 1).length;
    const clientRetention =
      totalActiveClients > 0
        ? Math.round((repeatClients / totalActiveClients) * 100)
        : 0;

    // Average ticket
    const averageTicket =
      currentTransactions.length > 0 ? currentRevenue / currentTransactions.length : 0;

    // Get AI insights
    const insights = await openRouter.getBusinessInsights({
      revenue: { current: currentRevenue, previous: previousRevenue },
      appointments: { current: currentAppointments, previous: previousAppointments },
      topServices: topServiceNames,
      lowPerformingServices,
      clientRetention,
      averageTicket,
    });

    return NextResponse.json({
      success: true,
      period: {
        current: {
          start: currentPeriodStart.toISOString(),
          end: now.toISOString(),
        },
        previous: {
          start: previousPeriodStart.toISOString(),
          end: previousPeriodEnd.toISOString(),
        },
      },
      metrics: {
        revenue: { current: currentRevenue, previous: previousRevenue },
        appointments: { current: currentAppointments, previous: previousAppointments },
        topServices: topServiceNames,
        lowPerformingServices,
        clientRetention,
        averageTicket,
      },
      insights,
    });
  } catch (error) {
    console.error("Business insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate business insights" },
      { status: 500 }
    );
  }
}
