import { NextRequest, NextResponse } from "next/server";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  appointmentToCalendarEvent,
  getColorForService,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// POST /api/calendar/sync - Sync appointment to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, action } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    // Get appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        services: { include: { service: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if staff has Google Calendar connected
    if (!appointment.staff.googleCalendarToken) {
      return NextResponse.json(
        { error: "Staff member has not connected Google Calendar" },
        { status: 400 }
      );
    }

    const calendarId = appointment.staff.googleCalendarId || "primary";
    const accessToken = appointment.staff.googleCalendarToken;
    const refreshToken = appointment.staff.googleRefreshToken || undefined;

    let result;

    switch (action) {
      case "create": {
        const event = appointmentToCalendarEvent(appointment);
        const serviceName = appointment.services[0]?.service?.name || "Appointment";
        event.colorId = getColorForService(serviceName);

        const created = await createCalendarEvent(
          accessToken,
          refreshToken,
          calendarId,
          event
        );

        // Store Google Calendar event ID
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { googleEventId: created.id },
        });

        result = { success: true, eventId: created.id };
        break;
      }

      case "update": {
        if (!appointment.googleEventId) {
          // Create if doesn't exist
          const event = appointmentToCalendarEvent(appointment);
          const updateServiceName = appointment.services[0]?.service?.name || "Appointment";
          event.colorId = getColorForService(updateServiceName);

          const created = await createCalendarEvent(
            accessToken,
            refreshToken,
            calendarId,
            event
          );

          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { googleEventId: created.id },
          });

          result = { success: true, eventId: created.id, action: "created" };
        } else {
          // Update existing
          const event = appointmentToCalendarEvent(appointment);

          await updateCalendarEvent(
            accessToken,
            refreshToken,
            calendarId,
            appointment.googleEventId,
            event
          );

          result = { success: true, eventId: appointment.googleEventId };
        }
        break;
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
            where: { id: appointmentId },
            data: { googleEventId: null },
          });
        }

        result = { success: true };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use create, update, or delete" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing to calendar:", error);
    return NextResponse.json(
      { error: "Failed to sync with Google Calendar" },
      { status: 500 }
    );
  }
}

// GET /api/calendar/sync - Sync all unsync'd appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    // Find appointments that need syncing
    const whereClause: Record<string, unknown> = {
      googleEventId: null,
      status: {
        in: ["CONFIRMED", "BOOKED"],
      },
      scheduledStart: {
        gte: new Date(),
      },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        services: { include: { service: true } },
      },
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

    return NextResponse.json({
      total: appointments.length,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error bulk syncing:", error);
    return NextResponse.json(
      { error: "Failed to sync appointments" },
      { status: 500 }
    );
  }
}
