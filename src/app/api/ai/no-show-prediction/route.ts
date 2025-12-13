import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/openrouter";

// GET /api/ai/no-show-prediction - Get upcoming appointments with risk scores
export async function GET() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: { in: ["BOOKED", "CONFIRMED"] },
      },
      include: {
        client: true,
        staff: {
          select: {
            id: true,
            displayName: true,
          },
        },
        services: {
          include: {
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
      take: 20,
    });

    // Calculate risk scores for each appointment
    const appointmentsWithRisk = await Promise.all(
      upcomingAppointments.map(async (apt) => {
        if (!apt.client) return null;

        // Get client's appointment history
        const clientHistory = await prisma.appointment.findMany({
          where: { clientId: apt.client.id },
        });

        const totalAppointments = clientHistory.length;
        const noShows = clientHistory.filter((a) => a.status === "NO_SHOW").length;
        const noShowRate = totalAppointments > 0 ? noShows / totalAppointments : 0;

        // Calculate risk score based on multiple factors
        let riskScore = 0;
        const riskFactors: string[] = [];

        // Factor 1: Historical no-show rate (max 40%)
        if (noShowRate > 0) {
          riskScore += noShowRate * 0.4;
          if (noShows > 0) {
            riskFactors.push(`Previous no-shows (${noShows})`);
          }
        }

        // Factor 2: New client (20%)
        if (totalAppointments === 0) {
          riskScore += 0.2;
          riskFactors.push("First-time client");
        }

        // Factor 3: Time of day - evening appointments have higher risk (10%)
        const hour = new Date(apt.scheduledStart).getHours();
        if (hour >= 17) {
          riskScore += 0.1;
          riskFactors.push("Evening appointment");
        }

        // Factor 4: Day of week - Mondays have higher risk (10%)
        const dayOfWeek = new Date(apt.scheduledStart).getDay();
        if (dayOfWeek === 1) {
          riskScore += 0.1;
          riskFactors.push("Monday appointment");
        }

        // Factor 5: Long service duration (10%)
        const serviceDuration = apt.services.reduce((sum, s) => sum, 0);
        if (serviceDuration > 90) {
          riskScore += 0.1;
          riskFactors.push("Long service duration");
        }

        // Factor 6: Not confirmed (10%)
        if (apt.status !== "CONFIRMED") {
          riskScore += 0.1;
          riskFactors.push("Not confirmed");
        }

        // Cap at 0.95
        riskScore = Math.min(riskScore, 0.95);

        return {
          id: apt.id,
          riskScore,
          riskFactors,
          scheduledStart: apt.scheduledStart.toISOString(),
          client: {
            id: apt.client.id,
            firstName: apt.client.firstName,
            lastName: apt.client.lastName,
            phone: apt.client.phone || "",
            email: apt.client.email || undefined,
            noShowCount: noShows,
            totalAppointments,
          },
          staff: {
            displayName: apt.staff?.displayName || "Unassigned",
          },
          services: apt.services.map((s) => ({ service: { name: s.service.name } })),
          isConfirmed: apt.status === "CONFIRMED",
          reminderSent: false,
        };
      })
    );

    // Filter out nulls and return all appointments with calculated risk scores
    const riskyAppointments = appointmentsWithRisk
      .filter((apt): apt is NonNullable<typeof apt> => apt !== null)
      .sort((a, b) => b.riskScore - a.riskScore);

    const stats = {
      totalAtRisk: riskyAppointments.length,
      highRisk: riskyAppointments.filter((a) => a.riskScore >= 0.7).length,
      mediumRisk: riskyAppointments.filter((a) => a.riskScore >= 0.4 && a.riskScore < 0.7).length,
      confirmed: riskyAppointments.filter((a) => a.isConfirmed).length,
    };

    return NextResponse.json({
      appointments: riskyAppointments,
      stats,
    });
  } catch (error) {
    console.error("Error fetching no-show predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}

// POST /api/ai/no-show-prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, clientId } = body;

    if (!appointmentId && !clientId) {
      return NextResponse.json(
        { error: "appointmentId or clientId is required" },
        { status: 400 }
      );
    }

    let appointment;
    let client;

    if (appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      if (!appointment.client) {
        return NextResponse.json(
          { error: "Appointment has no associated client" },
          { status: 400 }
        );
      }

      client = appointment.client;
    } else {
      client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }
    }

    // Get client history
    const allAppointments = await prisma.appointment.findMany({
      where: { clientId: client.id },
    });

    const totalAppointments = allAppointments.length;
    const noShows = allAppointments.filter((a) => a.status === "NO_SHOW").length;

    // Get average spend
    const transactions = await prisma.transaction.findMany({
      where: { clientId: client.id, status: "COMPLETED" },
    });
    const averageSpend =
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0) / transactions.length
        : 0;

    // Get last visit
    const lastVisit = allAppointments
      .filter((a) => a.status === "COMPLETED")
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0];

    const appointmentDate = appointment?.scheduledStart || new Date();
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString("en-US", {
      weekday: "long",
    });

    const prediction = await openRouter.predictNoShow({
      clientName: `${client.firstName} ${client.lastName}`,
      clientHistory: {
        totalAppointments,
        noShows,
        lastVisit: lastVisit?.scheduledStart?.toISOString() || null,
        averageSpend,
      },
      appointmentDetails: {
        service: appointment?.services?.[0]?.service?.name || "General appointment",
        date: new Date(appointmentDate).toLocaleDateString(),
        time: new Date(appointmentDate).toLocaleTimeString(),
        dayOfWeek,
      },
    });

    return NextResponse.json({
      success: true,
      prediction,
      clientInfo: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        totalAppointments,
        noShowRate: totalAppointments > 0 ? ((noShows / totalAppointments) * 100).toFixed(1) : 0,
      },
      appointmentInfo: appointment
        ? {
            id: appointment.id,
            service: appointment.services?.[0]?.service?.name,
            date: appointment.scheduledStart,
          }
        : null,
    });
  } catch (error) {
    console.error("No-show prediction error:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}
