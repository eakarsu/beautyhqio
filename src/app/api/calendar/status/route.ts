import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/status - Get calendar connection status for staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (staffId) {
      // Get status for a specific staff member
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: {
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
        },
      });

      if (!staff) {
        return NextResponse.json(
          { error: "Staff member not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
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
      });
    }

    // Get status for all staff members
    const staffList = await prisma.staff.findMany({
      where: { isActive: true },
      select: {
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
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    const result = staffList.map((staff) => ({
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
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching calendar status:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar status" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/status - Disconnect calendar for a staff member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const provider = searchParams.get("provider"); // "google" or "outlook"

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    if (provider === "outlook") {
      // Disconnect Outlook Calendar
      await prisma.staff.update({
        where: { id: staffId },
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
        where: { id: staffId },
        data: {
          googleCalendarToken: null,
          googleRefreshToken: null,
          googleCalendarId: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
