import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from "date-fns";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/dashboard - Get dashboard data
export async function GET() {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clients and Platform Admin get redirected to their respective dashboards
    if (user.role === "CLIENT") {
      return NextResponse.json({ error: "Use /api/client/dashboard for client dashboard" }, { status: 400 });
    }

    // Get locations for the user's business (for filtering)
    let locationIds: string[] = [];
    if (!user.isPlatformAdmin && user.businessId) {
      const locations = await prisma.location.findMany({
        where: { businessId: user.businessId },
        select: { id: true },
      });
      locationIds = locations.map((l) => l.id);
    }

    // Build filter based on user role
    const locationFilter = !user.isPlatformAdmin && locationIds.length > 0
      ? { locationId: { in: locationIds } }
      : {};

    const businessFilter = !user.isPlatformAdmin && user.businessId
      ? { businessId: user.businessId }
      : {};

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Get today's appointments (filtered by business)
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: todayStart,
          lte: todayEnd,
        },
        ...locationFilter,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
    });

    // Count yesterday's appointments for comparison (filtered by business)
    const yesterdayAppointmentCount = await prisma.appointment.count({
      where: {
        scheduledStart: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        ...locationFilter,
      },
    });

    // Get today's revenue from completed transactions (filtered by business)
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "COMPLETED",
        ...locationFilter,
      },
      select: {
        totalAmount: true,
      },
    });

    const todayRevenue = todayTransactions.reduce(
      (sum, t) => sum + Number(t.totalAmount || 0),
      0
    );

    // Get average daily revenue for comparison (last 7 days) (filtered by business)
    const last7DaysStart = subDays(todayStart, 7);
    const last7DaysTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: last7DaysStart,
          lt: todayStart,
        },
        status: "COMPLETED",
        ...locationFilter,
      },
      select: {
        totalAmount: true,
      },
    });

    const avgDailyRevenue =
      last7DaysTransactions.length > 0
        ? last7DaysTransactions.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0) / 7
        : 0;

    // Get walk-in queue (waitlist entries) (filtered by business)
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: {
        seatedAt: null, // Not yet seated = waiting
        addedAt: {
          gte: todayStart,
        },
        ...locationFilter,
      },
      select: {
        id: true,
        estimatedWait: true,
      },
    });

    // Get staff on duty today (filtered by business)
    const dayOfWeek = today.getDay();
    const staffOnDutyWhere: Record<string, unknown> = {
      isActive: true,
      schedules: {
        some: {
          dayOfWeek: dayOfWeek,
          isWorking: true,
        },
      },
    };
    if (!user.isPlatformAdmin && locationIds.length > 0) {
      staffOnDutyWhere.locationId = { in: locationIds };
    }
    const staffOnDuty = await prisma.staff.findMany({
      where: staffOnDutyWhere,
      select: {
        id: true,
      },
    });

    // Get alerts (filtered by business)
    // 1. Low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        quantityOnHand: {
          lte: 5,
        },
        isActive: true,
        ...businessFilter,
      },
      select: {
        name: true,
        quantityOnHand: true,
      },
      take: 3,
    });

    // 2. Birthdays this week (filtered by business)
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const weekEndDay = endOfWeek(today).getDate();

    const birthdaysThisWeek = await prisma.client.count({
      where: {
        birthdayMonth: currentMonth,
        birthdayDay: {
          gte: currentDay,
          lte: weekEndDay,
        },
        status: "ACTIVE",
        ...businessFilter,
      },
    });

    // 3. Recent reviews (filtered by business through client)
    const reviewWhere: Record<string, unknown> = {
      createdAt: {
        gte: subDays(today, 7),
      },
    };
    if (!user.isPlatformAdmin && user.businessId) {
      reviewWhere.client = { businessId: user.businessId };
    }
    const recentReviews = await prisma.review.findMany({
      where: reviewWhere,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // Get recent clients (filtered by business)
    const recentClients = await prisma.client.findMany({
      where: businessFilter,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
      },
      take: 50, // Limit to recent 50
    });

    // Get total client count (filtered by business)
    const totalClients = await prisma.client.count({
      where: businessFilter,
    });

    // Calculate stats
    const appointmentChange = todayAppointments.length - yesterdayAppointmentCount;
    const revenueChangePercent =
      avgDailyRevenue > 0
        ? Math.round(((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100)
        : 0;

    // Format appointments for frontend
    const formattedAppointments = todayAppointments.map((apt) => ({
      id: apt.id,
      time: apt.scheduledStart,
      client: apt.client
        ? `${apt.client.firstName} ${apt.client.lastName}`
        : apt.clientName || "Walk-in",
      clientId: apt.clientId,
      service: apt.services.map((s) => s.service.name).join(", ") || "Service",
      staff: apt.staff.displayName || `${apt.staff.user.firstName} ${apt.staff.user.lastName}`,
      staffId: apt.staffId,
      status: apt.status.toLowerCase().replace("_", "-"),
    }));

    // Format alerts
    const alerts = [];

    if (lowStockProducts.length > 0) {
      alerts.push({
        type: "inventory",
        message: `Low stock: ${lowStockProducts[0].name} (${lowStockProducts[0].quantityOnHand} left)`,
        href: "/products",
      });
    }

    if (birthdaysThisWeek > 0) {
      alerts.push({
        type: "birthday",
        message: `${birthdaysThisWeek} client birthday${birthdaysThisWeek > 1 ? "s" : ""} this week`,
        href: "/clients",
      });
    }

    if (recentReviews.length > 0) {
      const review = recentReviews[0];
      alerts.push({
        type: "review",
        message: `New ${review.rating}-star review from ${review.client?.firstName || "Anonymous"}`,
        href: "/reviews",
      });
    }

    // If no alerts, add default ones
    if (alerts.length === 0) {
      alerts.push({
        type: "info",
        message: "No new alerts",
        href: "/dashboard",
      });
    }

    // Format recent clients
    const formattedClients = recentClients.map((client) => ({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      phone: client.phone,
      email: client.email,
      status: client.status.toLowerCase(),
      createdAt: client.createdAt,
    }));

    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments.length,
        appointmentChange:
          appointmentChange >= 0
            ? `+${appointmentChange} from yesterday`
            : `${appointmentChange} from yesterday`,
        todayRevenue: todayRevenue,
        revenueChange:
          revenueChangePercent >= 0
            ? `+${revenueChangePercent}% vs avg`
            : `${revenueChangePercent}% vs avg`,
        walkInQueue: waitlistEntries.length,
        avgWaitTime:
          waitlistEntries.length > 0
            ? `~${Math.round(waitlistEntries.reduce((sum, w) => sum + (w.estimatedWait || 15), 0) / waitlistEntries.length)} min wait`
            : "No wait",
        staffOnDuty: staffOnDuty.length,
        totalClients: totalClients,
      },
      appointments: formattedAppointments,
      recentClients: formattedClients,
      alerts: alerts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
