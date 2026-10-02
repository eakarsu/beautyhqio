import { NextRequest } from "next/server";
import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"] as const;

// GET /api/calendar/client/status - Get a client's calendar connection status.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("clientId");
    // A client user may only read their own connection; staff pass an explicit id.
    const clientId = ctx.user.clientId || requested;
    if (!clientId) return fail(400, "clientId is required");
    if (ctx.user.clientId && requested && requested !== ctx.user.clientId) {
      return fail(403, "You cannot view another client's calendar");
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId: ctx.businessId },
      select: {
        googleCalendarToken: true,
        googleCalendarId: true,
        outlookCalendarToken: true,
        outlookCalendarId: true,
        outlookTokenExpiry: true,
      },
    });

    if (!client) return fail(404, "Client not found");

    return {
      google: {
        connected: !!client.googleCalendarToken,
        calendarId: client.googleCalendarId,
      },
      outlook: {
        connected: !!client.outlookCalendarToken,
        calendarId: client.outlookCalendarId,
        tokenExpiry: client.outlookTokenExpiry,
      },
    };
  });
}

// DELETE /api/calendar/client/status - Disconnect a client's calendar.
export async function DELETE(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("clientId");
    const clientId = ctx.user.clientId || requested;
    const provider = searchParams.get("provider"); // "google" or "outlook"

    if (!clientId) return fail(400, "clientId is required");
    if (ctx.user.clientId && requested && requested !== ctx.user.clientId) {
      return fail(403, "You cannot modify another client's calendar");
    }
    if (!provider || !["google", "outlook"].includes(provider)) {
      return fail(400, "provider must be 'google' or 'outlook'");
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) return fail(404, "Client not found");

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
      where: { id: client.id },
      data: updateData,
    });

    return { success: true };
  });
}
