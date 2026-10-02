import { NextRequest } from "next/server";
import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

const staffSelect = {
  id: true,
  displayName: true,
  googleCalendarToken: true,
  googleCalendarId: true,
  outlookCalendarToken: true,
  outlookCalendarId: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

type StaffRow = {
  id: string;
  displayName: string | null;
  googleCalendarToken: string | null;
  googleCalendarId: string | null;
  outlookCalendarToken: string | null;
  outlookCalendarId: string | null;
  user: { firstName: string; lastName: string; email: string };
};

function serialize(staff: StaffRow) {
  return {
    id: staff.id,
    name: staff.displayName || `${staff.user.firstName} ${staff.user.lastName}`,
    email: staff.user.email,
    google: {
      connected: !!staff.googleCalendarToken,
      calendarId: staff.googleCalendarId,
    },
    outlook: {
      connected: !!staff.outlookCalendarToken,
      calendarId: staff.outlookCalendarId,
    },
    // Keep legacy field for backwards compatibility
    connected: !!staff.googleCalendarToken,
    calendarId: staff.googleCalendarId,
  };
}

// GET /api/calendar/status - Calendar connection status for staff in this business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, location: { businessId: ctx.businessId } },
        select: staffSelect,
      });
      if (!staff) return fail(404, "Staff member not found");
      return serialize(staff);
    }

    const staffList = await prisma.staff.findMany({
      where: { isActive: true, location: { businessId: ctx.businessId } },
      select: staffSelect,
      orderBy: { user: { firstName: "asc" } },
    });

    return staffList.map(serialize);
  });
}

// DELETE /api/calendar/status - Disconnect calendar for a staff member.
export async function DELETE(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const provider = searchParams.get("provider"); // "google" or "outlook"

    if (!staffId) return fail(400, "Staff ID is required");

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, location: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!staff) return fail(404, "Staff member not found");

    if (provider === "outlook") {
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          outlookCalendarToken: null,
          outlookRefreshToken: null,
          outlookCalendarId: null,
          outlookTokenExpiry: null,
        },
      });
    } else {
      // Default to Google for backwards compatibility
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          googleCalendarToken: null,
          googleRefreshToken: null,
          googleCalendarId: null,
        },
      });
    }

    return { success: true };
  });
}
