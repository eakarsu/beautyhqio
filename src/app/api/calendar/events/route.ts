import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import { getCalendarEvents, getFreeBusy } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const availabilitySchema = z.object({
  staffIds: z.array(z.string().trim().min(1).max(191)).min(1).max(50),
  start: z.string().min(1),
  end: z.string().min(1),
});

// GET /api/calendar/events - Get calendar events for a staff member in this business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!staffId) return fail(400, "staffId is required");

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, location: { businessId: ctx.businessId } },
    });
    if (!staff) return fail(404, "Staff not found");

    if (!staff.googleCalendarToken) {
      return fail(400, "Staff has not connected Google Calendar");
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

    return {
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        status: event.status,
      })),
    };
  });
}

// POST /api/calendar/events - Check availability (free/busy) for this business's staff.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { staffIds, start, end } = availabilitySchema.parse(await request.json());

    const timeMin = new Date(start);
    const timeMax = new Date(end);
    if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
      return fail(422, "start and end must be valid dates");
    }

    const results: Record<string, { busy: { start: string; end: string }[] }> = {};

    for (const staffId of staffIds) {
      // findFirst keeps the tenant filter: staff in another business are invisible.
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
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

    return { availability: results };
  });
}
