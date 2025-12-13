import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/appointment-optimizer - AI appointment optimization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, staffId, optimize = "gaps" } = body;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query
    const whereClause: Record<string, unknown> = {
      scheduledStart: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["CONFIRMED", "BOOKED"],
      },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    // Get appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        staff: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    // Get staff schedules
    const staff = await prisma.staff.findMany({
      where: staffId ? { id: staffId } : { isActive: true },
      select: {
        id: true,
        displayName: true,
        workingHours: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format schedule for AI
    const scheduleData = staff.map((s) => {
      const staffAppointments = appointments
        .filter((a) => a.staffId === s.id)
        .map((a) => {
          const firstService = a.services[0]?.service;
          return {
            time: `${new Date(a.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(a.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            service: firstService?.name || "Service",
            client: a.client ? `${a.client.firstName} ${a.client.lastName}` : "Walk-in",
            duration: firstService?.duration || 60,
          };
        });

      return {
        staff: s.displayName || `${s.user.firstName} ${s.user.lastName}`,
        workingHours: s.workingHours,
        appointments: staffAppointments,
      };
    });

    const optimizationType =
      optimize === "revenue"
        ? "maximizing revenue by fitting in more high-value appointments"
        : optimize === "satisfaction"
          ? "client satisfaction by ensuring adequate buffer time and preferred staff"
          : "minimizing gaps and dead time between appointments";

    const prompt = `Analyze this salon schedule for ${targetDate.toDateString()} and suggest optimizations focused on ${optimizationType}.

Current Schedule:
${JSON.stringify(scheduleData, null, 2)}

Provide:
1. Identified issues (gaps, overbooking, inefficiencies)
2. Specific recommendations with time slots
3. Potential appointments that could be rescheduled
4. Open slots that could accommodate walk-ins or new bookings

Return as JSON:
{
  "issues": [{"type": "gap|overlap|efficiency", "staff": "name", "description": "..."}],
  "recommendations": [{"action": "move|add|buffer", "details": "...", "impact": "..."}],
  "openSlots": [{"staff": "name", "time": "HH:MM - HH:MM", "duration": minutes}],
  "metrics": {"utilization": percentage, "gaps": minutes, "potentialRevenue": amount}
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an AI scheduling optimizer for a beauty salon. Analyze schedules and provide actionable optimization suggestions. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1500, temperature: 0.3 }
    );

    let analysis;
    try {
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch {
      analysis = { raw: response };
    }

    return NextResponse.json({
      date: targetDate.toDateString(),
      staffCount: staff.length,
      appointmentCount: appointments.length,
      analysis,
    });
  } catch (error) {
    console.error("Error in appointment optimizer:", error);
    return NextResponse.json(
      { error: "Failed to optimize appointments" },
      { status: 500 }
    );
  }
}

// GET /api/ai/appointment-optimizer - Get optimization suggestions for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const staffId = searchParams.get("staffId");

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get appointments in range
    const whereClause: Record<string, unknown> = {
      scheduledStart: {
        gte: start,
        lte: end,
      },
      status: {
        in: ["CONFIRMED", "BOOKED"],
      },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        staff: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    // Calculate daily metrics
    const dailyMetrics: Record<
      string,
      { appointments: number; hours: number; revenue: number }
    > = {};

    appointments.forEach((apt) => {
      const dateKey = new Date(apt.scheduledStart).toDateString();
      if (!dailyMetrics[dateKey]) {
        dailyMetrics[dateKey] = { appointments: 0, hours: 0, revenue: 0 };
      }
      const firstService = apt.services[0]?.service;
      dailyMetrics[dateKey].appointments++;
      dailyMetrics[dateKey].hours += (firstService?.duration || 60) / 60;
      dailyMetrics[dateKey].revenue += Number(firstService?.price || 0);
    });

    // Find patterns
    const busyDays = Object.entries(dailyMetrics)
      .filter(([, m]) => m.appointments > 10)
      .map(([date]) => date);

    const slowDays = Object.entries(dailyMetrics)
      .filter(([, m]) => m.appointments < 5)
      .map(([date]) => date);

    return NextResponse.json({
      range: { start: start.toDateString(), end: end.toDateString() },
      totalAppointments: appointments.length,
      dailyMetrics,
      insights: {
        busyDays,
        slowDays,
        averageAppointmentsPerDay: (
          appointments.length /
          ((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        ).toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error getting optimization data:", error);
    return NextResponse.json(
      { error: "Failed to get optimization data" },
      { status: 500 }
    );
  }
}
