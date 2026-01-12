import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/client/status - Get client's calendar connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        googleCalendarToken: true,
        googleCalendarId: true,
        outlookCalendarToken: true,
        outlookCalendarId: true,
        outlookTokenExpiry: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      google: {
        connected: !!client.googleCalendarToken,
        calendarId: client.googleCalendarId,
      },
      outlook: {
        connected: !!client.outlookCalendarToken,
        calendarId: client.outlookCalendarId,
        tokenExpiry: client.outlookTokenExpiry,
      },
    });
  } catch (error) {
    console.error("Error getting calendar status:", error);
    return NextResponse.json(
      { error: "Failed to get calendar status" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/client/status - Disconnect a calendar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const provider = searchParams.get("provider"); // "google" or "outlook"

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    if (!provider || !["google", "outlook"].includes(provider)) {
      return NextResponse.json(
        { error: "provider must be 'google' or 'outlook'" },
        { status: 400 }
      );
    }

    const updateData = provider === "google"
      ? {
          googleCalendarToken: null,
          googleRefreshToken: null,
          googleCalendarId: null,
        }
      : {
          outlookCalendarToken: null,
          outlookRefreshToken: null,
          outlookCalendarId: null,
          outlookTokenExpiry: null,
        };

    await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
