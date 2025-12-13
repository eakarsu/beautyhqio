import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/booking/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!locationId || !date) {
      return NextResponse.json(
        { error: "locationId and date are required" },
        { status: 400 }
      );
    }

    // Get service duration
    let duration = 60; // Default 60 minutes
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
      });
      if (service) duration = service.duration;
    }

    // Get location operating hours
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { operatingHours: true },
    });

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    }).toLowerCase();
    const operatingHours = location?.operatingHours as Record<string, { open: string; close: string }> | null;
    const hours = operatingHours?.[dayOfWeek] || {
      open: "09:00",
      close: "18:00",
    };

    // Get available staff
    const staffWhere: Record<string, unknown> = { locationId, isActive: true };
    if (staffId) staffWhere.id = staffId;

    const availableStaff = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        displayName: true,
        photo: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        locationId,
        scheduledStart: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        ...(staffId && { staffId }),
      },
      select: {
        staffId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // Generate time slots
    const slots: Array<{
      time: string;
      available: boolean;
      availableStaff: typeof availableStaff;
    }> = [];

    const [openHour, openMin] = hours.open.split(":").map(Number);
    const [closeHour, closeMin] = hours.close.split(":").map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    for (let time = openTime; time + duration <= closeTime; time += 30) {
      const slotHour = Math.floor(time / 60);
      const slotMin = time % 60;
      const slotTime = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;

      const slotStart = new Date(date);
      slotStart.setHours(slotHour, slotMin, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Check which staff are available at this time
      const staffAvailable = availableStaff.filter((staff) => {
        const hasConflict = existingAppointments.some((apt) => {
          if (apt.staffId !== staff.id) return false;
          const aptStart = new Date(apt.scheduledStart);
          const aptEnd = new Date(apt.scheduledEnd);
          return slotStart < aptEnd && slotEnd > aptStart;
        });
        return !hasConflict;
      });

      slots.push({
        time: slotTime,
        available: staffAvailable.length > 0,
        availableStaff: staffAvailable,
      });
    }

    return NextResponse.json({
      date,
      locationId,
      serviceId,
      duration,
      slots,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
