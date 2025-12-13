import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/services - Service analytics report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get all services with their category
    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        isActive: true,
        category: {
          select: { name: true },
        },
      },
    });

    const servicePerformance = await Promise.all(
      services.map(async (service) => {
        // Count appointments
        const appointmentServices = await prisma.appointmentService.findMany({
          where: {
            serviceId: service.id,
            appointment: {
              ...(Object.keys(dateFilter).length && { scheduledStart: dateFilter }),
            },
          },
          include: {
            appointment: {
              select: { status: true },
            },
          },
        });

        const totalBookings = appointmentServices.length;
        const completedBookings = appointmentServices.filter(
          (as) => as.appointment.status === "COMPLETED"
        ).length;

        // Get revenue from transaction line items
        const lineItems = await prisma.transactionLineItem.findMany({
          where: {
            serviceId: service.id,
            transaction: {
              status: "COMPLETED",
              ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            },
          },
          select: { totalPrice: true },
        });

        const revenue = lineItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        );

        return {
          service: {
            id: service.id,
            name: service.name,
            category: service.category?.name || "Uncategorized",
            price: Number(service.price),
            duration: service.duration,
            isActive: service.isActive,
          },
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            completionRate: totalBookings
              ? (completedBookings / totalBookings) * 100
              : 0,
          },
          revenue,
          averageRevenue: completedBookings ? revenue / completedBookings : 0,
        };
      })
    );

    // Sort by revenue
    servicePerformance.sort((a, b) => b.revenue - a.revenue);

    // Group by category
    const byCategory: Record<string, { revenue: number; bookings: number }> = {};
    for (const sp of servicePerformance) {
      const cat = sp.service.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { revenue: 0, bookings: 0 };
      }
      byCategory[cat].revenue += sp.revenue;
      byCategory[cat].bookings += sp.bookings.completed;
    }

    return NextResponse.json({
      services: servicePerformance,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
      totals: {
        totalServices: services.length,
        activeServices: services.filter((s) => s.isActive).length,
        totalRevenue: servicePerformance.reduce((sum, s) => sum + s.revenue, 0),
        totalBookings: servicePerformance.reduce(
          (sum, s) => sum + s.bookings.completed,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error generating service report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
