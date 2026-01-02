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

    // Parse date for day of week - use local time parsing
    const [yearForDay, monthForDay, dayForDay] = date.split("-").map(Number);
    const dateObj = new Date(yearForDay, monthForDay - 1, dayForDay);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
    }).toLowerCase();
    const operatingHours = location?.operatingHours as Record<string, { open: string; close: string }> | null;
    const hours = operatingHours?.[dayOfWeek] || {
      open: "09:00",
      close: "18:00",
    };

    // Get the business for this location
    const locationData = await prisma.location.findUnique({
      where: { id: locationId },
      select: { businessId: true },
    });

    if (!locationData) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Get available staff - find by business (staff can serve any location in the business)
    const staffWhere: Record<string, unknown> = {
      isActive: true,
      isBookableOnline: true,
      user: { businessId: locationData.businessId },
    };
    if (staffId) staffWhere.id = staffId;

    const availableStaff = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        displayName: true,
        photo: true,
        color: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get existing appointments for the date
    // Check ALL locations - staff can have appointments at any location in the business
    // Parse date properly to avoid timezone issues
    const [year, month, day] = date.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const staffIds = availableStaff.map(s => s.id);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId: { in: staffIds },
        scheduledStart: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: {
        staffId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // Generate time slots
    type MappedStaff = {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      color: string;
    };
    const slots: Array<{
      time: string;
      available: boolean;
      availableStaff: MappedStaff[];
    }> = [];

    const [openHour, openMin] = hours.open.split(":").map(Number);
    const [closeHour, closeMin] = hours.close.split(":").map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    const now = new Date();

    for (let time = openTime; time + duration <= closeTime; time += 30) {
      const slotHour = Math.floor(time / 60);
      const slotMin = time % 60;
      const slotTime = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;

      const slotStart = new Date(year, month - 1, day, slotHour, slotMin, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Skip time slots that have already passed
      if (slotStart <= now) {
        slots.push({
          time: slotTime,
          available: false,
          availableStaff: [],
        });
        continue;
      }

      // Check which staff are available at this time
      const staffAvailable = availableStaff
        .filter((staff) => {
          const hasConflict = existingAppointments.some((apt) => {
            if (apt.staffId !== staff.id) return false;
            const aptStart = new Date(apt.scheduledStart);
            const aptEnd = new Date(apt.scheduledEnd);
            return slotStart < aptEnd && slotEnd > aptStart;
          });
          return !hasConflict;
        })
        .map((staff) => ({
          id: staff.id,
          firstName: staff.user?.firstName || staff.displayName || "Staff",
          lastName: staff.user?.lastName || "",
          avatar: staff.photo,
          color: staff.color || "#ec4899",
        }));

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
