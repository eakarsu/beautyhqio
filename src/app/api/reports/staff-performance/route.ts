import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/staff-performance - Staff performance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const locationId = searchParams.get("locationId");

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get all staff
    const staff = await prisma.staff.findMany({
      where: locationId ? { locationId } : {},
      select: {
        id: true,
        displayName: true,
        photo: true,
        title: true,
        avgRating: true,
        reviewCount: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const staffPerformance = await Promise.all(
      staff.map(async (member) => {
        // Get appointments
        const appointments = await prisma.appointment.findMany({
          where: {
            staffId: member.id,
            ...(Object.keys(dateFilter).length && { scheduledStart: dateFilter }),
          },
          select: {
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
        });

        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(
          (a) => a.status === "COMPLETED"
        ).length;
        const cancelledAppointments = appointments.filter(
          (a) => a.status === "CANCELLED"
        ).length;
        const noShowAppointments = appointments.filter(
          (a) => a.status === "NO_SHOW"
        ).length;

        // Calculate total hours worked
        let totalMinutes = 0;
        appointments
          .filter((a) => a.status === "COMPLETED")
          .forEach((a) => {
            if (a.scheduledStart && a.scheduledEnd) {
              totalMinutes +=
                (new Date(a.scheduledEnd).getTime() - new Date(a.scheduledStart).getTime()) /
                60000;
            }
          });

        // Get revenue from line items performed by staff
        const lineItems = await prisma.transactionLineItem.findMany({
          where: {
            performedById: member.id,
            transaction: {
              status: "COMPLETED",
              ...(Object.keys(dateFilter).length && { date: dateFilter }),
            },
          },
          select: {
            totalPrice: true,
            type: true,
          },
        });

        const totalRevenue = lineItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        );
        const serviceRevenue = lineItems
          .filter((i) => i.type === "SERVICE")
          .reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const productRevenue = lineItems
          .filter((i) => i.type === "PRODUCT")
          .reduce((sum, item) => sum + Number(item.totalPrice), 0);

        // Use staff's average rating from their profile
        const avgRating = member.avgRating ? Number(member.avgRating) : null;
        const reviewCount = member.reviewCount || 0;

        return {
          staff: member,
          appointments: {
            total: totalAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments,
            noShow: noShowAppointments,
            completionRate: totalAppointments
              ? (completedAppointments / totalAppointments) * 100
              : 0,
          },
          hoursWorked: Math.round(totalMinutes / 60 * 10) / 10,
          revenue: {
            total: totalRevenue,
            services: serviceRevenue,
            products: productRevenue,
            perHour: totalMinutes > 0 ? totalRevenue / (totalMinutes / 60) : 0,
          },
          reviews: {
            count: reviewCount,
            averageRating: avgRating,
          },
        };
      })
    );

    // Sort by revenue
    staffPerformance.sort((a, b) => b.revenue.total - a.revenue.total);

    return NextResponse.json({
      period: { startDate, endDate },
      staff: staffPerformance,
      totals: {
        appointments: staffPerformance.reduce(
          (sum, s) => sum + s.appointments.total,
          0
        ),
        revenue: staffPerformance.reduce((sum, s) => sum + s.revenue.total, 0),
        hoursWorked: staffPerformance.reduce((sum, s) => sum + s.hoursWorked, 0),
      },
    });
  } catch (error) {
    console.error("Error generating staff performance report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
