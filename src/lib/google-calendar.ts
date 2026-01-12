// Google Calendar Integration
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get authorization URL for OAuth
export function getAuthUrl(state?: string, redirectUri?: string): string {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );

  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string, redirectUri?: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Create authenticated calendar client
export function getCalendarClient(accessToken: string, refreshToken?: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth });
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: { email: string; name?: string }[];
  reminders?: {
    useDefault?: boolean;
    overrides?: { method: "email" | "popup"; minutes: number }[];
  };
  colorId?: string;
}

// Create a calendar event
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  event: CalendarEvent
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        displayName: a.name,
      })),
      reminders: event.reminders || {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
      colorId: event.colorId,
    },
  });

  return response.data;
}

// Update a calendar event
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const updateData: Record<string, unknown> = {};

  if (event.summary) updateData.summary = event.summary;
  if (event.description) updateData.description = event.description;
  if (event.location) updateData.location = event.location;
  if (event.start) {
    updateData.start = {
      dateTime: event.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (event.end) {
    updateData.end = {
      dateTime: event.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (event.attendees) {
    updateData.attendees = event.attendees.map((a) => ({
      email: a.email,
      displayName: a.name,
    }));
  }

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: updateData,
  });

  return response.data;
}

// Delete a calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  eventId: string
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId,
    eventId,
  });

  return { success: true };
}

// Get calendar events
export async function getCalendarEvents(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 100
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin?.toISOString() || new Date().toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

// Get free/busy information
export async function getFreeBusy(
  accessToken: string,
  refreshToken: string | undefined,
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    },
  });

  return response.data.calendars;
}

// List user's calendars
export async function listCalendars(
  accessToken: string,
  refreshToken?: string
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.calendarList.list();

  return response.data.items || [];
}

// Create event from appointment
export function appointmentToCalendarEvent(
  appointment: {
    services: Array<{ service: { name: string } | null }>;
    client: { firstName: string; lastName: string; email?: string | null } | null;
    staff: { displayName?: string | null; user: { firstName: string; lastName: string } };
    scheduledStart: Date;
    scheduledEnd: Date;
    notes?: string | null;
  },
  businessName: string = "Beauty & Wellness"
): CalendarEvent {
  const serviceName = appointment.services[0]?.service?.name || "Appointment";
  const clientName = appointment.client
    ? `${appointment.client.firstName} ${appointment.client.lastName}`
    : "Walk-in";
  const staffName = appointment.staff.displayName ||
    `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`;

  return {
    summary: `${serviceName} - ${clientName}`,
    description: [
      `Service: ${serviceName}`,
      `Client: ${clientName}`,
      `Staff: ${staffName}`,
      appointment.notes ? `Notes: ${appointment.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: businessName,
    start: new Date(appointment.scheduledStart),
    end: new Date(appointment.scheduledEnd),
    attendees: appointment.client?.email
      ? [{ email: appointment.client.email, name: clientName }]
      : [],
  };
}

// Color mapping for different service categories
export const serviceColorMap: Record<string, string> = {
  hair: "1", // Lavender
  nails: "2", // Sage
  skin: "3", // Grape
  massage: "4", // Flamingo
  makeup: "5", // Banana
  waxing: "6", // Tangerine
  default: "7", // Peacock
};

export function getColorForService(serviceName: string): string {
  const lowerName = serviceName.toLowerCase();

  if (lowerName.includes("hair") || lowerName.includes("cut") || lowerName.includes("color")) {
    return serviceColorMap.hair;
  }
  if (lowerName.includes("nail") || lowerName.includes("manicure") || lowerName.includes("pedicure")) {
    return serviceColorMap.nails;
  }
  if (lowerName.includes("facial") || lowerName.includes("skin")) {
    return serviceColorMap.skin;
  }
  if (lowerName.includes("massage")) {
    return serviceColorMap.massage;
  }
  if (lowerName.includes("makeup") || lowerName.includes("make-up")) {
    return serviceColorMap.makeup;
  }
  if (lowerName.includes("wax")) {
    return serviceColorMap.waxing;
  }

  return serviceColorMap.default;
}
