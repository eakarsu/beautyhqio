import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/staff/me/schedule - Get current staff's schedule/appointments
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: { userId: user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        scheduledStart: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    // Format appointments
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      time: apt.scheduledStart.toISOString(),
      endTime: apt.scheduledEnd.toISOString(),
      status: apt.status,
      client: apt.client
        ? {
            id: apt.client.id,
            name: `${apt.client.firstName} ${apt.client.lastName}`,
            phone: apt.client.phone,
          }
        : { name: apt.clientName || "Walk-in", phone: apt.clientPhone },
      services: apt.services.map((s) => ({
        name: s.service.name,
        duration: s.service.duration,
      })),
    }));

    // Get staff's schedule for the day of week
    const dayOfWeek = date.getDay();
    const schedule = await prisma.staffSchedule.findFirst({
      where: {
        staffId: staff.id,
        dayOfWeek: dayOfWeek,
      },
      include: {
        breaks: true,
      },
    });

    return NextResponse.json({
      date: date.toISOString().split("T")[0],
      appointments: formattedAppointments,
      schedule: schedule
        ? {
            isWorking: schedule.isWorking,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            breaks: schedule.breaks.map((b) => ({
              startTime: b.startTime,
              endTime: b.endTime,
              label: b.label,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching staff schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
