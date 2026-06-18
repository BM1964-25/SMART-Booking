import { getEffectiveAppSettings } from "@/lib/app-settings";
import { TIMEZONE } from "@/lib/date";
import { getMeetingLocationCalendarLines, getMeetingLocationDetails } from "@/lib/meeting-location";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType, CalendarConnection } from "@/lib/types";

const graphBaseUrl = "https://graph.microsoft.com/v1.0";

type MicrosoftCalendarListItem = {
  id: string;
  name?: string;
  isDefaultCalendar?: boolean;
};

type MicrosoftCalendarViewEvent = {
  id: string;
  subject?: string;
  webLink?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
};

type MicrosoftCreatedEvent = {
  id: string;
  webLink?: string;
  onlineMeeting?: {
    joinUrl?: string;
  };
};

type MicrosoftTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type MicrosoftAccountConnection = {
  access_token: string | null;
  account_email: string | null;
  expires_at: string | null;
  refresh_token: string | null;
  scope: string | null;
};

type BookingForMicrosoftCalendar = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  topic: string;
  meeting_location?: string | null;
  meeting_url?: string | null;
  phone?: string | null;
  starts_at: string;
  ends_at: string;
  cancellation_token: string;
  bookingType?: BookingType;
};

export async function listMicrosoftCalendars() {
  const accessToken = await getMicrosoftAccessToken();
  const response = await fetch(`${graphBaseUrl}/me/calendars?$select=id,name,isDefaultCalendar`, {
    headers: graphHeaders(accessToken)
  });

  if (!response.ok) {
    throw new Error(`Microsoft Kalender konnten nicht geladen werden (${response.status}).`);
  }

  const data = (await response.json()) as { value?: MicrosoftCalendarListItem[] };

  return (data.value || []).map((calendar) => ({
    id: calendar.id,
    displayName: calendar.name || calendar.id,
    primary: calendar.isDefaultCalendar === true
  }));
}

export async function getMicrosoftEvents(startDate: Date, endDate: Date) {
  const calendars = await getAvailabilityCalendars();

  if (calendars.length === 0) {
    throw new Error("Kein Microsoft Kalender für den Abgleich gefunden.");
  }

  const accessToken = await getMicrosoftAccessToken();
  const eventGroups = await Promise.allSettled(
    calendars.map(async (calendar) => {
      const params = new URLSearchParams({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        "$select": "id,subject,webLink,start,end"
      });
      const response = await fetch(`${graphBaseUrl}/me/calendars/${encodeURIComponent(calendar.calendar_id || "")}/calendarView?${params}`, {
        headers: graphHeaders(accessToken)
      });

      if (!response.ok) {
        throw new Error(`Microsoft Kalender konnte nicht gelesen werden (${response.status}).`);
      }

      return (await response.json()) as { value?: MicrosoftCalendarViewEvent[] };
    })
  );
  const successful = eventGroups.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  if (successful.length === 0) {
    throw new Error("Microsoft Kalender konnten nicht gelesen werden.");
  }

  return successful.flatMap((group) =>
    (group.value || []).flatMap((event) => {
      const startsAt = event.start?.dateTime;
      const endsAt = event.end?.dateTime;

      if (!startsAt || !endsAt) {
        return [];
      }

      return [
        {
          uid: event.id,
          href: event.webLink,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          summary: event.subject
        }
      ];
    })
  );
}

export async function createMicrosoftCalendarEvent(booking: BookingForMicrosoftCalendar) {
  const calendar = await getBookingCalendar();

  if (!calendar?.calendar_id) {
    throw new Error("Kein Microsoft Buchungskalender gefunden.");
  }

  const accessToken = await getMicrosoftAccessToken();
  const meetingDetails = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);
  const description = [
    `Unternehmen: ${booking.company}`,
    `E-Mail: ${booking.customer_email}`,
    booking.phone ? `Telefon: ${booking.phone}` : null,
    ...getMeetingLocationCalendarLines(booking.meeting_location, booking.phone, booking.meeting_url),
    "",
    booking.topic
  ]
    .filter(Boolean)
    .join("\n");
  const createTeamsMeeting = booking.meeting_location === "teams";
  const response = await fetch(`${graphBaseUrl}/me/calendars/${encodeURIComponent(calendar.calendar_id)}/events`, {
    method: "POST",
    headers: {
      ...graphHeaders(accessToken),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: `${booking.bookingType?.name || "Termin"}: ${booking.customer_name}`,
      body: {
        contentType: "Text",
        content: description
      },
      location: {
        displayName: meetingDetails.link || meetingDetails.label
      },
      start: {
        dateTime: booking.starts_at,
        timeZone: TIMEZONE
      },
      end: {
        dateTime: booking.ends_at,
        timeZone: TIMEZONE
      },
      attendees: [
        {
          emailAddress: {
            address: booking.customer_email,
            name: booking.customer_name
          },
          type: "required"
        }
      ],
      isOnlineMeeting: createTeamsMeeting,
      onlineMeetingProvider: createTeamsMeeting ? "teamsForBusiness" : undefined
    })
  });

  if (!response.ok) {
    throw new Error(`Microsoft Termin konnte nicht erstellt werden (${response.status}): ${await response.text()}`);
  }

  const event = (await response.json()) as MicrosoftCreatedEvent;

  return {
    eventId: event.id,
    eventUrl: event.webLink || null,
    meetingUrl: event.onlineMeeting?.joinUrl || null
  };
}

export async function deleteMicrosoftCalendarEvent(eventId: string) {
  const accessToken = await getMicrosoftAccessToken();
  const response = await fetch(`${graphBaseUrl}/me/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: graphHeaders(accessToken)
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Microsoft Termin konnte nicht gelöscht werden (${response.status}): ${await response.text()}`);
  }
}

async function getBookingCalendar() {
  const connections = await getCalendarConnections();
  return connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id) || getDefaultMicrosoftCalendarFallback();
}

async function getAvailabilityCalendars() {
  const connections = await getCalendarConnections();
  const selected = connections.filter((connection) => connection.is_active && connection.use_for_availability && connection.calendar_id);
  const bookingCalendar = connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id);

  return selected.length > 0 ? selected : bookingCalendar ? [bookingCalendar] : [getDefaultMicrosoftCalendarFallback()];
}

function getDefaultMicrosoftCalendarFallback(): CalendarConnection {
  const now = new Date().toISOString();

  return {
    id: "microsoft-default-fallback",
    provider: "microsoft",
    calendar_id: "calendar",
    display_name: "Microsoft Standardkalender",
    is_active: true,
    use_for_booking: true,
    use_for_availability: true,
    last_checked_at: null,
    created_at: now,
    updated_at: now
  };
}

async function getCalendarConnections() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("provider", "microsoft")
    .eq("is_active", true)
    .returns<CalendarConnection[]>();

  if (error) {
    return [];
  }

  return data || [];
}

async function getMicrosoftAccessToken() {
  const settings = await getEffectiveAppSettings();

  if (!settings.microsoftClientId || !settings.microsoftClientSecret) {
    throw new Error("Microsoft OAuth ist nicht vollständig konfiguriert.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("calendar_oauth_connections")
    .select("access_token,account_email,expires_at,refresh_token,scope")
    .eq("provider", "microsoft")
    .eq("is_active", true)
    .maybeSingle<MicrosoftAccountConnection>();

  if (error || !data?.refresh_token) {
    throw new Error("Microsoft Kalender ist noch nicht verbunden.");
  }

  if (data.access_token && data.expires_at && new Date(data.expires_at).getTime() > Date.now() + 60_000) {
    return data.access_token;
  }

  const refreshed = await refreshMicrosoftToken({
    clientId: settings.microsoftClientId,
    clientSecret: settings.microsoftClientSecret,
    refreshToken: data.refresh_token
  });
  const expiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null;

  await supabase
    .from("calendar_oauth_connections")
    .update({
      access_token: refreshed.access_token,
      expires_at: expiresAt,
      refresh_token: refreshed.refresh_token || data.refresh_token,
      scope: refreshed.scope || data.scope,
      updated_at: new Date().toISOString()
    })
    .eq("provider", "microsoft");

  return refreshed.access_token;
}

async function refreshMicrosoftToken(input: { clientId: string; clientSecret: string; refreshToken: string }) {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: "refresh_token",
      refresh_token: input.refreshToken,
      scope: "offline_access User.Read Calendars.ReadWrite"
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(getMicrosoftTokenErrorMessage(response.status, details));
  }

  return (await response.json()) as MicrosoftTokenResponse;
}

function graphHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Prefer: `outlook.timezone="${TIMEZONE}"`
  };
}

function getMicrosoftTokenErrorMessage(status: number, details: string) {
  if (details.includes("invalid_client") || details.includes("client_secret")) {
    return "Microsoft Kalender muss neu verbunden werden. Bitte prüfen Sie Microsoft OAuth Client ID und Client Secret in Kalender & Meetings und klicken Sie danach auf „Microsoft verbinden“. Der gespeicherte Client Secret ist aktuell ungültig.";
  }

  return `Microsoft Kalender muss neu verbunden werden (${status}). Bitte öffnen Sie Kalender & Meetings und klicken Sie auf „Microsoft verbinden“.`;
}
