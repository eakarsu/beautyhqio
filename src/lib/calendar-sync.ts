// Unified Calendar Sync Service
// Handles auto-sync of appointments to Google Calendar and Outlook Calendar

import { prisma } from "@/lib/prisma";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  appointmentToCalendarEvent,
  getColorForService,
} from "@/lib/google-calendar";
import {
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
  appointmentToOutlookEvent,
  refreshOutlookToken,
} from "@/lib/outlook-calendar";

export type SyncAction = "create" | "update" | "delete";

export interface SyncResult {
  provider: "google" | "outlook";
  success: boolean;
  eventId?: string;
  error?: string;
}

// Appointment type for sync operations
interface AppointmentWithRelations {
  id: string;
  staffId: string;
  clientId: string | null;
  googleEventId: string | null;
  outlookEventId: string | null;
  clientGoogleEventId: string | null;
  clientOutlookEventId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  notes: string | null;
  services: Array<{ service: { name: string } | null }>;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    googleCalendarToken: string | null;
    googleRefreshToken: string | null;
    googleCalendarId: string | null;
    outlookCalendarToken: string | null;
    outlookRefreshToken: string | null;
    outlookCalendarId: string | null;
    outlookTokenExpiry: Date | null;
  } | null;
  staff: {
    displayName: string | null;
    user: { firstName: string; lastName: string };
    googleCalendarToken: string | null;
    googleRefreshToken: string | null;
    googleCalendarId: string | null;
    outlookCalendarToken: string | null;
    outlookRefreshToken: string | null;
    outlookCalendarId: string | null;
    outlookTokenExpiry: Date | null;
  };
}

// Get staff with token refresh for Outlook if needed
async function ensureValidOutlookToken(staffId: string, staff: AppointmentWithRelations["staff"]) {
  if (!staff.outlookCalendarToken || !staff.outlookTokenExpiry) {
    return staff.outlookCalendarToken;
  }

  const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
  if (new Date(staff.outlookTokenExpiry).getTime() - expiryBuffer > Date.now()) {
    return staff.outlookCalendarToken;
  }

  // Token expired or about to expire, refresh it
  if (!staff.outlookRefreshToken) {
    console.error("No refresh token available for Outlook");
    return null;
  }

  try {
    const newTokens = await refreshOutlookToken(staff.outlookRefreshToken);
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        outlookCalendarToken: newTokens.accessToken,
        outlookRefreshToken: newTokens.refreshToken,
        outlookTokenExpiry: newTokens.expiresAt,
      },
    });
    return newTokens.accessToken;
  } catch (error) {
    console.error("Failed to refresh Outlook token:", error);
    // Clear invalid tokens
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        outlookCalendarToken: null,
        outlookRefreshToken: null,
        outlookCalendarId: null,
        outlookTokenExpiry: null,
      },
    });
    return null;
  }
}

// Ensure valid Outlook token for client
async function ensureValidClientOutlookToken(clientId: string, client: NonNullable<AppointmentWithRelations["client"]>) {
  if (!client.outlookCalendarToken || !client.outlookTokenExpiry) {
    return client.outlookCalendarToken;
  }

  const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
  if (new Date(client.outlookTokenExpiry).getTime() - expiryBuffer > Date.now()) {
    return client.outlookCalendarToken;
  }

  // Token expired or about to expire, refresh it
  if (!client.outlookRefreshToken) {
    console.error("No refresh token available for client Outlook");
    return null;
  }

  try {
    const newTokens = await refreshOutlookToken(client.outlookRefreshToken);
    await prisma.client.update({
      where: { id: clientId },
      data: {
        outlookCalendarToken: newTokens.accessToken,
        outlookRefreshToken: newTokens.refreshToken,
        outlookTokenExpiry: newTokens.expiresAt,
      },
    });
    return newTokens.accessToken;
  } catch (error) {
    console.error("Failed to refresh client Outlook token:", error);
    // Clear invalid tokens
    await prisma.client.update({
      where: { id: clientId },
      data: {
        outlookCalendarToken: null,
        outlookRefreshToken: null,
        outlookCalendarId: null,
        outlookTokenExpiry: null,
      },
    });
    return null;
  }
}

// Sync appointment to all connected calendars
export async function syncAppointmentToCalendars(
  appointmentId: string,
  action: SyncAction
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  // Get appointment with all related data
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          googleCalendarToken: true,
          googleRefreshToken: true,
          googleCalendarId: true,
          outlookCalendarToken: true,
          outlookRefreshToken: true,
          outlookCalendarId: true,
          outlookTokenExpiry: true,
        },
      },
      staff: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      services: { include: { service: true } },
    },
  });

  if (!appointment) {
    return [{ provider: "google", success: false, error: "Appointment not found" }];
  }

  // Get staff calendar settings
  const staff = await prisma.staff.findUnique({
    where: { id: appointment.staffId },
    select: {
      id: true,
      displayName: true,
      googleCalendarToken: true,
      googleRefreshToken: true,
      googleCalendarId: true,
      outlookCalendarToken: true,
      outlookRefreshToken: true,
      outlookCalendarId: true,
      outlookTokenExpiry: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!staff) {
    return [{ provider: "google", success: false, error: "Staff not found" }];
  }

  // Build appointment with staff and client data for event conversion
  const appointmentWithRelations: AppointmentWithRelations = {
    ...appointment,
    staff: {
      displayName: staff.displayName,
      user: staff.user,
      googleCalendarToken: staff.googleCalendarToken,
      googleRefreshToken: staff.googleRefreshToken,
      googleCalendarId: staff.googleCalendarId,
      outlookCalendarToken: staff.outlookCalendarToken,
      outlookRefreshToken: staff.outlookRefreshToken,
      outlookCalendarId: staff.outlookCalendarId,
      outlookTokenExpiry: staff.outlookTokenExpiry,
    },
  };

  // ============ STAFF CALENDAR SYNC ============

  // Sync to Staff's Google Calendar
  if (staff.googleCalendarToken) {
    try {
      const result = await syncToGoogleCalendar(appointmentWithRelations, action);
      results.push(result);
    } catch (error) {
      results.push({
        provider: "google",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Sync to Staff's Outlook Calendar
  if (staff.outlookCalendarToken) {
    try {
      const validToken = await ensureValidOutlookToken(staff.id, appointmentWithRelations.staff);
      if (validToken) {
        appointmentWithRelations.staff.outlookCalendarToken = validToken;
        const result = await syncToOutlookCalendar(appointmentWithRelations, action);
        results.push(result);
      } else {
        results.push({
          provider: "outlook",
          success: false,
          error: "Invalid or expired token",
        });
      }
    } catch (error) {
      results.push({
        provider: "outlook",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ============ CLIENT CALENDAR SYNC ============

  if (appointment.client) {
    // Sync to Client's Google Calendar
    if (appointment.client.googleCalendarToken) {
      try {
        const result = await syncToClientGoogleCalendar(appointmentWithRelations, action);
        results.push({ ...result, provider: "google" });
      } catch (error) {
        results.push({
          provider: "google",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Sync to Client's Outlook Calendar
    if (appointment.client.outlookCalendarToken) {
      try {
        const validToken = await ensureValidClientOutlookToken(appointment.client.id, appointment.client);
        if (validToken) {
          appointmentWithRelations.client!.outlookCalendarToken = validToken;
          const result = await syncToClientOutlookCalendar(appointmentWithRelations, action);
          results.push({ ...result, provider: "outlook" });
        } else {
          results.push({
            provider: "outlook",
            success: false,
            error: "Invalid or expired client token",
          });
        }
      } catch (error) {
        results.push({
          provider: "outlook",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return results;
}

// Sync to Google Calendar
async function syncToGoogleCalendar(
  appointment: AppointmentWithRelations,
  action: SyncAction
): Promise<SyncResult> {
  const calendarId = appointment.staff.googleCalendarId || "primary";
  const accessToken = appointment.staff.googleCalendarToken!;
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

      return { provider: "google", success: true, eventId: created.id ?? undefined };
    }

    case "update": {
      if (!appointment.googleEventId) {
        // Create if doesn't exist
        const event = appointmentToCalendarEvent(appointment);
        const serviceName = appointment.services[0]?.service?.name || "Appointment";
        event.colorId = getColorForService(serviceName);

        const created = await createCalendarEvent(accessToken, refreshToken, calendarId, event);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: created.id },
        });

        return { provider: "google", success: true, eventId: created.id ?? undefined };
      }

      const event = appointmentToCalendarEvent(appointment);
      await updateCalendarEvent(accessToken, refreshToken, calendarId, appointment.googleEventId, event);

      return { provider: "google", success: true, eventId: appointment.googleEventId };
    }

    case "delete": {
      if (appointment.googleEventId) {
        await deleteCalendarEvent(accessToken, refreshToken, calendarId, appointment.googleEventId);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: null },
        });
      }
      return { provider: "google", success: true };
    }
  }
}

// Sync to Outlook Calendar
async function syncToOutlookCalendar(
  appointment: AppointmentWithRelations,
  action: SyncAction
): Promise<SyncResult> {
  const calendarId = appointment.staff.outlookCalendarId || "primary";
  const accessToken = appointment.staff.outlookCalendarToken!;

  switch (action) {
    case "create": {
      const event = appointmentToOutlookEvent(appointment);
      const created = await createOutlookCalendarEvent(accessToken, calendarId, event);

      if (created?.id) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { outlookEventId: created.id },
        });
      }

      return { provider: "outlook", success: true, eventId: created?.id };
    }

    case "update": {
      if (!appointment.outlookEventId) {
        // Create if doesn't exist
        const event = appointmentToOutlookEvent(appointment);
        const created = await createOutlookCalendarEvent(accessToken, calendarId, event);

        if (created?.id) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { outlookEventId: created.id },
          });
        }

        return { provider: "outlook", success: true, eventId: created?.id };
      }

      const event = appointmentToOutlookEvent(appointment);
      await updateOutlookCalendarEvent(accessToken, calendarId, appointment.outlookEventId, event);

      return { provider: "outlook", success: true, eventId: appointment.outlookEventId };
    }

    case "delete": {
      if (appointment.outlookEventId) {
        await deleteOutlookCalendarEvent(accessToken, calendarId, appointment.outlookEventId);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { outlookEventId: null },
        });
      }
      return { provider: "outlook", success: true };
    }
  }
}

// ============ CLIENT CALENDAR SYNC FUNCTIONS ============

// Create event from appointment for client's calendar view
function appointmentToClientCalendarEvent(
  appointment: AppointmentWithRelations,
  businessName: string = "Beauty & Wellness"
): { summary: string; description: string; location: string; start: Date; end: Date } {
  const serviceName = appointment.services[0]?.service?.name || "Appointment";
  const staffName = appointment.staff.displayName ||
    `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`;

  return {
    summary: `${serviceName} at ${businessName}`,
    description: [
      `Service: ${serviceName}`,
      `With: ${staffName}`,
      appointment.notes ? `Notes: ${appointment.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: businessName,
    start: new Date(appointment.scheduledStart),
    end: new Date(appointment.scheduledEnd),
  };
}

// Sync to Client's Google Calendar
async function syncToClientGoogleCalendar(
  appointment: AppointmentWithRelations,
  action: SyncAction
): Promise<SyncResult> {
  if (!appointment.client?.googleCalendarToken) {
    return { provider: "google", success: false, error: "Client has no Google calendar connected" };
  }

  const calendarId = appointment.client.googleCalendarId || "primary";
  const accessToken = appointment.client.googleCalendarToken;
  const refreshToken = appointment.client.googleRefreshToken || undefined;

  switch (action) {
    case "create": {
      const baseEvent = appointmentToClientCalendarEvent(appointment);
      const event = {
        ...baseEvent,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email" as const, minutes: 24 * 60 }, // 1 day before
            { method: "popup" as const, minutes: 60 }, // 1 hour before
          ],
        },
      };

      const created = await createCalendarEvent(accessToken, refreshToken, calendarId, event);

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { clientGoogleEventId: created.id },
      });

      return { provider: "google", success: true, eventId: created.id ?? undefined };
    }

    case "update": {
      if (!appointment.clientGoogleEventId) {
        // Create if doesn't exist
        const baseEvent = appointmentToClientCalendarEvent(appointment);
        const event = {
          ...baseEvent,
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email" as const, minutes: 24 * 60 },
              { method: "popup" as const, minutes: 60 },
            ],
          },
        };

        const created = await createCalendarEvent(accessToken, refreshToken, calendarId, event);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { clientGoogleEventId: created.id },
        });

        return { provider: "google", success: true, eventId: created.id ?? undefined };
      }

      const event = appointmentToClientCalendarEvent(appointment);
      await updateCalendarEvent(accessToken, refreshToken, calendarId, appointment.clientGoogleEventId, event);

      return { provider: "google", success: true, eventId: appointment.clientGoogleEventId };
    }

    case "delete": {
      if (appointment.clientGoogleEventId) {
        await deleteCalendarEvent(accessToken, refreshToken, calendarId, appointment.clientGoogleEventId);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { clientGoogleEventId: null },
        });
      }
      return { provider: "google", success: true };
    }
  }
}

// Sync to Client's Outlook Calendar
async function syncToClientOutlookCalendar(
  appointment: AppointmentWithRelations,
  action: SyncAction
): Promise<SyncResult> {
  if (!appointment.client?.outlookCalendarToken) {
    return { provider: "outlook", success: false, error: "Client has no Outlook calendar connected" };
  }

  const calendarId = appointment.client.outlookCalendarId || "primary";
  const accessToken = appointment.client.outlookCalendarToken;

  switch (action) {
    case "create": {
      const baseEvent = appointmentToClientCalendarEvent(appointment);
      const event = {
        summary: baseEvent.summary,
        description: baseEvent.description,
        location: baseEvent.location,
        start: baseEvent.start,
        end: baseEvent.end,
      };

      const created = await createOutlookCalendarEvent(accessToken, calendarId, event);

      if (created?.id) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { clientOutlookEventId: created.id },
        });
      }

      return { provider: "outlook", success: true, eventId: created?.id };
    }

    case "update": {
      if (!appointment.clientOutlookEventId) {
        // Create if doesn't exist
        const baseEvent = appointmentToClientCalendarEvent(appointment);
        const event = {
          summary: baseEvent.summary,
          description: baseEvent.description,
          location: baseEvent.location,
          start: baseEvent.start,
          end: baseEvent.end,
        };

        const created = await createOutlookCalendarEvent(accessToken, calendarId, event);

        if (created?.id) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { clientOutlookEventId: created.id },
          });
        }

        return { provider: "outlook", success: true, eventId: created?.id };
      }

      const baseEvent = appointmentToClientCalendarEvent(appointment);
      await updateOutlookCalendarEvent(accessToken, calendarId, appointment.clientOutlookEventId, {
        summary: baseEvent.summary,
        description: baseEvent.description,
        location: baseEvent.location,
        start: baseEvent.start,
        end: baseEvent.end,
      });

      return { provider: "outlook", success: true, eventId: appointment.clientOutlookEventId };
    }

    case "delete": {
      if (appointment.clientOutlookEventId) {
        await deleteOutlookCalendarEvent(accessToken, calendarId, appointment.clientOutlookEventId);

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { clientOutlookEventId: null },
        });
      }
      return { provider: "outlook", success: true };
    }
  }
}
