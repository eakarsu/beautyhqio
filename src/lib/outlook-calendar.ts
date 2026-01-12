// Outlook Calendar Integration via Microsoft Graph API

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0";
const GRAPH_API_URL = "https://graph.microsoft.com/v1.0";

const SCOPES = [
  "Calendars.ReadWrite",
  "User.Read",
  "offline_access",
];

// Get authorization URL for OAuth
export function getOutlookAuthUrl(state?: string, redirectUri?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri || process.env.MICROSOFT_REDIRECT_URI!,
    scope: SCOPES.join(" "),
    response_mode: "query",
    state: state || "",
  });
  return `${MICROSOFT_AUTH_URL}/authorize?${params}`;
}

// Exchange authorization code for tokens
export async function getOutlookTokensFromCode(code: string, redirectUri?: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const response = await fetch(`${MICROSOFT_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri || process.env.MICROSOFT_REDIRECT_URI!,
      grant_type: "authorization_code",
      scope: SCOPES.join(" "),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get tokens: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// Refresh expired token
export async function refreshOutlookToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const response = await fetch(`${MICROSOFT_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES.join(" "),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// Helper to make authenticated Graph API calls
async function graphRequest<T>(
  accessToken: string,
  method: string,
  endpoint: string,
  body?: object
): Promise<T | null> {
  const response = await fetch(`${GRAPH_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error: ${response.status} - ${error}`);
  }

  if (method === "DELETE" || response.status === 204) {
    return null;
  }

  return response.json();
}

// Calendar Event interface (similar to Google)
export interface OutlookCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: { email: string; name?: string }[];
}

// Create a calendar event
export async function createOutlookCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  event: OutlookCalendarEvent
) {
  const endpoint = calendarId === "primary"
    ? "/me/calendar/events"
    : `/me/calendars/${calendarId}/events`;

  const graphEvent = {
    subject: event.summary,
    body: {
      contentType: "text",
      content: event.description || "",
    },
    start: {
      dateTime: event.start.toISOString().slice(0, -1), // Remove Z suffix
      timeZone: "UTC",
    },
    end: {
      dateTime: event.end.toISOString().slice(0, -1),
      timeZone: "UTC",
    },
    location: event.location ? { displayName: event.location } : undefined,
    attendees: event.attendees?.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required",
    })),
    isReminderOn: true,
    reminderMinutesBeforeStart: 60,
  };

  return graphRequest<{ id: string }>(accessToken, "POST", endpoint, graphEvent);
}

// Update a calendar event
export async function updateOutlookCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  eventId: string,
  event: Partial<OutlookCalendarEvent>
) {
  const endpoint = calendarId === "primary"
    ? `/me/calendar/events/${eventId}`
    : `/me/calendars/${calendarId}/events/${eventId}`;

  const updateData: Record<string, unknown> = {};

  if (event.summary) updateData.subject = event.summary;
  if (event.description) {
    updateData.body = { contentType: "text", content: event.description };
  }
  if (event.location) {
    updateData.location = { displayName: event.location };
  }
  if (event.start) {
    updateData.start = {
      dateTime: event.start.toISOString().slice(0, -1),
      timeZone: "UTC",
    };
  }
  if (event.end) {
    updateData.end = {
      dateTime: event.end.toISOString().slice(0, -1),
      timeZone: "UTC",
    };
  }
  if (event.attendees) {
    updateData.attendees = event.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required",
    }));
  }

  return graphRequest(accessToken, "PATCH", endpoint, updateData);
}

// Delete a calendar event
export async function deleteOutlookCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  eventId: string
) {
  const endpoint = calendarId === "primary"
    ? `/me/calendar/events/${eventId}`
    : `/me/calendars/${calendarId}/events/${eventId}`;

  await graphRequest(accessToken, "DELETE", endpoint);
  return { success: true };
}

// Get calendar events
export async function getOutlookCalendarEvents(
  accessToken: string,
  calendarId: string = "primary",
  startDateTime?: Date,
  endDateTime?: Date
) {
  const start = startDateTime || new Date();
  const end = endDateTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const endpoint = calendarId === "primary"
    ? `/me/calendar/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`
    : `/me/calendars/${calendarId}/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`;

  const response = await graphRequest<{ value: unknown[] }>(accessToken, "GET", endpoint);
  return response?.value || [];
}

// List user's calendars
export async function listOutlookCalendars(accessToken: string) {
  const response = await graphRequest<{ value: unknown[] }>(accessToken, "GET", "/me/calendars");
  return response?.value || [];
}

// Get user profile (for email/name after connection)
export async function getOutlookUserProfile(accessToken: string) {
  return graphRequest<{ mail: string; displayName: string; userPrincipalName: string }>(
    accessToken,
    "GET",
    "/me"
  );
}

// Create event from appointment (same as Google for consistency)
export function appointmentToOutlookEvent(
  appointment: {
    services: Array<{ service: { name: string } | null }>;
    client: { firstName: string; lastName: string; email?: string | null } | null;
    staff: { displayName?: string | null; user: { firstName: string; lastName: string } };
    scheduledStart: Date;
    scheduledEnd: Date;
    notes?: string | null;
  },
  businessName: string = "Beauty & Wellness"
): OutlookCalendarEvent {
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
