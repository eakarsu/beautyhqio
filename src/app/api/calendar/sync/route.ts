import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  appointmentToCalendarEvent,
  getColorForService,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const syncSchema = z.object({
  appointmentId: z.string().trim().min(1).max(191),
  action: z.enum(["create", "update", "delete"]),
});

// POST /api/calendar/sync - Sync one appointment to the staff member's Google Calendar.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { appointmentId, action } = syncSchema.parse(await request.json());

    // Tenant-scoped read: an appointment in another business is not found.
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId: ctx.businessId },
      include: {
        client: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        services: { include: { service: true } },
      },
    });

    if (!appointment) return fail(404, "Appointment not found");

    if (!appointment.staff.googleCalendarToken) {
      return fail(400, "Staff member has not connected Google Calendar");
    }

    const calendarId = appointment.staff.googleCalendarId || "primary";
    const accessToken = appointment.staff.googleCalendarToken;
    const refreshToken = appointment.staff.googleRefreshToken || undefined;

    switch (action) {
      case "create": {
        const event = appointmentToCalendarEvent(appointment);
        const serviceName = appointment.services[0]?.service?.name || "Appointment";
        event.colorId = getColorForService(serviceName);

        const created = await createCalendarEvent(accessToken, refreshToken, calendarId, event);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: created.id },
        });

        return { success: true, eventId: created.id };
      }

      case "update": {
        if (!appointment.googleEventId) {
          const event = appointmentToCalendarEvent(appointment);
          const updateServiceName = appointment.services[0]?.service?.name || "Appointment";
          event.colorId = getColorForService(updateServiceName);

          const created = await createCalendarEvent(accessToken, refreshToken, calendarId, event);

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: created.id },
          });

          return { success: true, eventId: created.id, action: "created" };
        }

        const event = appointmentToCalendarEvent(appointment);
        await updateCalendarEvent(
          accessToken,
          refreshToken,
          calendarId,
          appointment.googleEventId,
          event
        );

        return { success: true, eventId: appointment.googleEventId };
      }

      case "delete": {
        if (appointment.googleEventId) {
          await deleteCalendarEvent(
            accessToken,
            refreshToken,
            calendarId,
            appointment.googleEventId
          );

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: null },
          });
        }

        return { success: true };
      }
    }
  });
}

// GET /api/calendar/sync - Sync all unsynced appointments for this business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
        select: { id: true },
      });
      if (!staff) return fail(404, "Staff member not found");
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: ctx.businessId,
        ...(staffId ? { staffId } : {}),
        googleEventId: null,
        status: { in: ["CONFIRMED", "BOOKED"] },
        scheduledStart: { gte: new Date() },
      },
      include: {
        client: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        services: { include: { service: true } },
      },
      take: 200,
    });

    const results = [];

    for (const appointment of appointments) {
      if (!appointment.staff.googleCalendarToken) {
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: "Staff not connected to Google Calendar",
        });
        continue;
      }

      try {
        const event = appointmentToCalendarEvent(appointment);
        const bulkServiceName = appointment.services[0]?.service?.name || "Appointment";
        event.colorId = getColorForService(bulkServiceName);

        const created = await createCalendarEvent(
          appointment.staff.googleCalendarToken,
          appointment.staff.googleRefreshToken || undefined,
          appointment.staff.googleCalendarId || "primary",
          event
        );

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: created.id },
        });

        results.push({
          appointmentId: appointment.id,
          success: true,
          eventId: created.id,
        });
      } catch (error) {
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: appointments.length,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  });
}
