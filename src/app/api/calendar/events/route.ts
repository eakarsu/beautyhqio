import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, getFreeBusy } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/events - Get calendar events for a staff member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (!staff.googleCalendarToken) {
      return NextResponse.json(
        { error: "Staff has not connected Google Calendar" },
        { status: 400 }
      );
    }

    const timeMin = startDate ? new Date(startDate) : new Date();
    const timeMax = endDate
      ? new Date(endDate)
      : new Date(timeMin.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const events = await getCalendarEvents(
      staff.googleCalendarToken,
      staff.googleRefreshToken || undefined,
      staff.googleCalendarId || "primary",
      timeMin,
      timeMax
    );

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        status: event.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Check availability (free/busy)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffIds, start, end } = body;

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { error: "staffIds array is required" },
        { status: 400 }
      );
    }

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end dates are required" },
        { status: 400 }
      );
    }

    const timeMin = new Date(start);
    const timeMax = new Date(end);

    const results: Record<string, { busy: { start: string; end: string }[] }> =
      {};

    for (const staffId of staffIds) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });

      if (!staff || !staff.googleCalendarToken) {
        results[staffId] = { busy: [] };
        continue;
      }

      try {
        const freeBusy = await getFreeBusy(
          staff.googleCalendarToken,
          staff.googleRefreshToken || undefined,
          [staff.googleCalendarId || "primary"],
          timeMin,
          timeMax
        );

        const calendarBusy =
          freeBusy?.[staff.googleCalendarId || "primary"]?.busy || [];

        results[staffId] = {
          busy: calendarBusy.map((b) => ({
            start: b.start || "",
            end: b.end || "",
          })),
        };
      } catch {
        results[staffId] = { busy: [] };
      }
    }

    return NextResponse.json({ availability: results });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
