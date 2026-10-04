import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { endpoint, fail } from "@/lib/operations/core";
import { localDateTime } from "@/lib/appointments/availability";

/**
 * PUBLIC ENDPOINT — online booking availability.
 *
 * Anonymous visitors must see open slots for a specific location before they sign
 * in, so this route intentionally does not call context(). Every query is scoped
 * to the requested location's own business, and the response exposes only slot
 * times plus bookable staff display fields (public name/photo/colour). No client
 * records, contact details, or tenant internals are returned. The location and
 * service ids are validated against that business so a caller cannot probe
 * another tenant's calendar.
 */
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const serviceId = searchParams.get("serviceId");
    const serviceIds = (searchParams.get("serviceIds") || serviceId || "").split(",").filter(Boolean);
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!locationId || !date) {
      return fail(400, "locationId and date are required");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(422, "Use a valid YYYY-MM-DD date");

    const location = await prisma.location.findFirst({
      where: { id: locationId, isActive: true, allowOnlineBooking: true, business: { subscription: { is: { status: { in: ['ACTIVE', 'TRIAL'] } } } } },
      select: { businessId: true, operatingHours: true, advanceBookingDays: true, business: { select: { timezone: true } } },
    });
    if (!location) return fail(404, "Location not found");

    const businessId = location.businessId;
    const timeZone = location.business.timezone;

    // Get service duration (scoped to the same business)
    let duration = 60;
    if (serviceIds.length) {
      const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, businessId, isActive: true, allowOnline: true }, select: { id: true, duration: true } });
      if (services.length !== new Set(serviceIds).size) return fail(422, "One or more services are unavailable for online booking");
      duration = services.reduce((sum, service) => sum + service.duration, 0);
    }

    // Parse date for day of week - use local time parsing
    const [yearForDay, monthForDay, dayForDay] = date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(yearForDay, monthForDay - 1, dayForDay, 12));
    const dayOfWeek = dateObj
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const operatingHours = location.operatingHours as Record<
      string,
      { open: string; close: string }
    > | null;
    const hours = operatingHours?.[dayOfWeek] || {
      open: "09:00",
      close: "18:00",
    };

    // Get available staff - staff can serve any location in the business
    const staffWhere: Record<string, unknown> = {
      isActive: true,
      isBookableOnline: true,
      locationId,
      user: { businessId },
    };
    if (staffId) staffWhere.id = staffId;

    const availableStaff = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        displayName: true,
        photo: true,
        color: true,
        serviceIds: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get existing appointments for the date across this business
    if (!Number.isFinite(dateObj.getTime())) return fail(422, "Use a valid date");
    let startOfDay: Date, endOfDay: Date;
    try {
      startOfDay = localDateTime(date, "00:00", timeZone);
      const nextDate = new Date(dateObj.getTime() + 86_400_000).toISOString().slice(0, 10);
      endOfDay = localDateTime(nextDate, "00:00", timeZone);
    } catch { return fail(422, "Use a valid business-local date"); }

    const staffIds = availableStaff.map((s) => s.id);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        staffId: { in: staffIds },
        scheduledStart: { lt: endOfDay },
        scheduledEnd: { gt: startOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED"] },
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

      let slotStart: Date;
      try { slotStart = localDateTime(date, slotTime, timeZone); }
      catch { slots.push({ time: slotTime, available: false, availableStaff: [] }); continue; }
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Skip time slots that have already passed
      if (slotStart <= now || slotStart.getTime() > now.getTime() + location.advanceBookingDays * 86_400_000) {
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
          if (staff.serviceIds.length && serviceIds.some((id) => !staff.serviceIds.includes(id))) return false;
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

    return {
      date,
      locationId,
      serviceId,
      duration,
      slots,
    };
  });
}
