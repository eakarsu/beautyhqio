import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/me/earnings - Get current staff's earnings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        commissionPct: true,
        payType: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get completed appointments this month
    const thisMonthAppointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        status: "COMPLETED",
        scheduledStart: { gte: startOfMonth },
      },
      include: {
        services: {
          select: {
            price: true,
            service: { select: { name: true } },
          },
        },
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledStart: "desc" },
    });

    // Get completed appointments last month
    const lastMonthAppointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        status: "COMPLETED",
        scheduledStart: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      include: {
        services: { select: { price: true } },
      },
    });

    // Get completed appointments this week
    const thisWeekAppointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        status: "COMPLETED",
        scheduledStart: { gte: startOfWeek },
      },
      include: {
        services: { select: { price: true } },
      },
    });

    // Calculate earnings based on commission
    const commissionRate = (Number(staff.commissionPct) || 0) / 100;

    const calculateTotal = (appointments: Array<{ services: Array<{ price: unknown }> }>) => {
      return appointments.reduce((sum, apt) => {
        const serviceTotal = apt.services.reduce(
          (s, svc) => s + Number(svc.price),
          0
        );
        return sum + serviceTotal * commissionRate;
      }, 0);
    };

    const thisMonth = calculateTotal(thisMonthAppointments);
    const lastMonth = calculateTotal(lastMonthAppointments);
    const thisWeek = calculateTotal(thisWeekAppointments);

    // Recent transactions (last 10)
    const recentTransactions = thisMonthAppointments.slice(0, 10).map((apt) => {
      const serviceTotal = apt.services.reduce(
        (s, svc) => s + Number(svc.price),
        0
      );
      const serviceNames = apt.services
        .map((s) => s.service?.name)
        .filter(Boolean)
        .join(", ");
      return {
        id: apt.id,
        date: apt.scheduledStart.toISOString(),
        service: serviceNames || "Service",
        amount: serviceTotal * commissionRate,
        client: apt.client
          ? `${apt.client.firstName} ${apt.client.lastName}`
          : "Walk-in",
      };
    });

    return NextResponse.json({
      totalEarnings: thisMonth,
      thisMonth,
      lastMonth,
      thisWeek,
      completedAppointments: thisMonthAppointments.length,
      averagePerAppointment:
        thisMonthAppointments.length > 0
          ? thisMonth / thisMonthAppointments.length
          : 0,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching staff earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
