import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/availability - Get available time slots with buffer time
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    const bufferMinutes = parseInt(searchParams.get("buffer") || "15");

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get service duration if serviceId provided
    let serviceDuration = 60; // Default 60 minutes
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true, bufferTime: true },
      });
      if (service) {
        serviceDuration = service.duration;
        // Use service-specific buffer time if set
        if (service.bufferTime) {
          // bufferMinutes = service.bufferTime; // Could override here
        }
      }
    }

    // Get business hours from settings
    const settings = await prisma.settings.findFirst();
    const businessHours = {
      open: settings?.openTime || "09:00",
      close: settings?.closeTime || "19:00",
    };

    // Get staff to check
    const staffWhere: Record<string, unknown> = { isActive: true };
    if (staffId) {
      staffWhere.id = staffId;
    }

    const staff = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        displayName: true,
        workingHours: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Get existing appointments for the day
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "BOOKED", "IN_SERVICE"],
        },
        ...(staffId ? { staffId } : {}),
      },
      select: {
        staffId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // Generate available slots for each staff member
    const availability: {
      staffId: string;
      staffName: string;
      slots: { start: string; end: string }[];
    }[] = [];

    for (const staffMember of staff) {
      // Get staff-specific working hours or use business hours
      const workingHours = (staffMember.workingHours as Record<string, unknown>) || {};
      const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const staffHours = (workingHours[dayOfWeek] as { start: string; end: string }) || {
        start: businessHours.open,
        end: businessHours.close,
      };

      // Parse hours
      const [openHour, openMin] = staffHours.start.split(":").map(Number);
      const [closeHour, closeMin] = staffHours.end.split(":").map(Number);

      const dayStart = new Date(targetDate);
      dayStart.setHours(openHour, openMin, 0, 0);

      const dayEnd = new Date(targetDate);
      dayEnd.setHours(closeHour, closeMin, 0, 0);

      // Get appointments for this staff member
      const staffAppointments = existingAppointments
        .filter((a) => a.staffId === staffMember.id)
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

      // Generate slots
      const slots: { start: string; end: string }[] = [];
      let currentTime = new Date(dayStart);

      // Add buffer time to each appointment's end time
      const blockedTimes = staffAppointments.map((apt) => ({
        start: new Date(apt.scheduledStart),
        end: new Date(new Date(apt.scheduledEnd).getTime() + bufferMinutes * 60000),
      }));

      while (currentTime.getTime() + serviceDuration * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

        // Check if slot conflicts with any blocked time
        const hasConflict = blockedTimes.some(
          (blocked) =>
            (currentTime >= blocked.start && currentTime < blocked.end) ||
            (slotEnd > blocked.start && slotEnd <= blocked.end) ||
            (currentTime <= blocked.start && slotEnd >= blocked.end)
        );

        if (!hasConflict) {
          slots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        // Move to next slot (30 min intervals)
        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }

      availability.push({
        staffId: staffMember.id,
        staffName: staffMember.displayName || `${staffMember.user.firstName} ${staffMember.user.lastName}`,
        slots,
      });
    }

    return NextResponse.json({
      date: targetDate.toDateString(),
      serviceDuration,
      bufferMinutes,
      availability,
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      { error: "Failed to get availability" },
      { status: 500 }
    );
  }
}

// POST /api/appointments/availability - Check if specific time is available
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, startTime, endTime, excludeAppointmentId, bufferMinutes = 15 } = body;

    if (!staffId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "staffId, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const requestedStart = new Date(startTime);
    const requestedEnd = new Date(endTime);

    // Add buffer time
    const bufferedStart = new Date(requestedStart.getTime() - bufferMinutes * 60000);
    const bufferedEnd = new Date(requestedEnd.getTime() + bufferMinutes * 60000);

    // Check for conflicts
    const whereClause: Record<string, unknown> = {
      staffId,
      status: {
        in: ["CONFIRMED", "BOOKED", "IN_PROGRESS"],
      },
      OR: [
        {
          // Appointment starts during requested time
          scheduledStart: {
            gte: bufferedStart,
            lt: bufferedEnd,
          },
        },
        {
          // Appointment ends during requested time
          endTime: {
            gt: bufferedStart,
            lte: bufferedEnd,
          },
        },
        {
          // Appointment spans requested time
          AND: [
            { scheduledStart: { lte: bufferedStart } },
            { endTime: { gte: bufferedEnd } },
          ],
        },
      ],
    };

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflictingAppointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        services: { include: { service: true } },
        client: true,
      },
    });

    const isAvailable = conflictingAppointments.length === 0;

    return NextResponse.json({
      available: isAvailable,
      conflicts: conflictingAppointments.map((apt) => ({
        id: apt.id,
        service: apt.services[0]?.service?.name || "Service",
        client: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : "Walk-in",
        scheduledStart: apt.scheduledStart,
        endTime: apt.scheduledEnd,
      })),
      requestedTime: {
        start: requestedStart,
        end: requestedEnd,
        withBuffer: {
          start: bufferedStart,
          end: bufferedEnd,
        },
      },
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
