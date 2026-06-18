import { getEffectiveAppSettings } from "@/lib/app-settings";
import { TIMEZONE } from "@/lib/date";
import { getMeetingLocationCalendarLines, getMeetingLocationDetails } from "@/lib/meeting-location";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType, CalendarConnection } from "@/lib/types";

type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  primary?: boolean;
};

type GoogleCalendarEvent = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type GoogleEventItem = {
  id: string;
  htmlLink?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleAccountConnection = {
  access_token: string | null;
  account_email: string | null;
  expires_at: string | null;
  refresh_token: string | null;
  scope: string | null;
};

type BookingForGoogleCalendar = {
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

export async function listGoogleCalendars() {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Kalender konnten nicht geladen werden (${response.status}).`);
  }

  const data = (await response.json()) as { items?: GoogleCalendarListItem[] };

  return (data.items || []).map((calendar) => ({
    id: calendar.id,
    displayName: calendar.summary || calendar.id,
    primary: calendar.primary === true
  }));
}

export async function getGoogleEvents(startDate: Date, endDate: Date) {
  const calendars = await getAvailabilityCalendars();

  if (calendars.length === 0) {
    throw new Error("Kein Google Kalender für den Abgleich gefunden.");
  }

  const accessToken = await getGoogleAccessToken();
  const eventGroups = await Promise.allSettled(
    calendars.map(async (calendar) => {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString()
      });
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id || "")}/events?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Google Kalender konnte nicht gelesen werden (${response.status}).`);
      }

      return (await response.json()) as { items?: GoogleEventItem[] };
    })
  );
  const successful = eventGroups.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  if (successful.length === 0) {
    throw new Error("Google Kalender konnten nicht gelesen werden.");
  }

  return successful.flatMap((group) =>
    (group.items || []).flatMap((event) => {
      const startsAt = event.start?.dateTime || event.start?.date;
      const endsAt = event.end?.dateTime || event.end?.date;

      if (!startsAt || !endsAt) {
        return [];
      }

      return [
        {
          uid: event.id,
          href: event.htmlLink,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          summary: event.summary
        }
      ];
    })
  );
}

export async function createGoogleCalendarEvent(booking: BookingForGoogleCalendar) {
  const calendar = await getBookingCalendar();

  if (!calendar?.calendar_id) {
    throw new Error("Kein Google Buchungskalender gefunden.");
  }

  const accessToken = await getGoogleAccessToken();
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
  const createConference = booking.meeting_location === "google_meet";
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events?conferenceDataVersion=${createConference ? "1" : "0"}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: `${booking.bookingType?.name || "Termin"}: ${booking.customer_name}`,
        description,
        location: meetingDetails.label,
        start: {
          dateTime: booking.starts_at,
          timeZone: TIMEZONE
        },
        end: {
          dateTime: booking.ends_at,
          timeZone: TIMEZONE
        },
        attendees: [{ email: booking.customer_email }],
        conferenceData: createConference
          ? {
              createRequest: {
                requestId: `smart-booking-${booking.id}`,
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            }
          : undefined
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Termin konnte nicht erstellt werden (${response.status}): ${await response.text()}`);
  }

  const event = (await response.json()) as GoogleCalendarEvent;
  const meetLink =
    event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video" && entry.uri)?.uri ||
    event.hangoutLink ||
    null;

  return {
    eventId: event.id,
    eventUrl: event.htmlLink || null,
    meetingUrl: meetLink
  };
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const calendar = await getBookingCalendar();

  if (!calendar?.calendar_id) {
    throw new Error("Kein Google Buchungskalender gefunden.");
  }

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Google Termin konnte nicht gelöscht werden (${response.status}): ${await response.text()}`);
  }
}

async function getBookingCalendar() {
  const connections = await getCalendarConnections();
  return connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id) || getPrimaryGoogleCalendarFallback();
}

async function getAvailabilityCalendars() {
  const connections = await getCalendarConnections();
  const selected = connections.filter((connection) => connection.is_active && connection.use_for_availability && connection.calendar_id);
  const bookingCalendar = connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id);

  return selected.length > 0 ? selected : bookingCalendar ? [bookingCalendar] : [getPrimaryGoogleCalendarFallback()];
}

function getPrimaryGoogleCalendarFallback(): CalendarConnection {
  const now = new Date().toISOString();

  return {
    id: "google-primary-fallback",
    provider: "google",
    calendar_id: "primary",
    display_name: "Primärer Google Kalender",
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
    .eq("provider", "google")
    .eq("is_active", true)
    .returns<CalendarConnection[]>();

  if (error) {
    return [];
  }

  return data || [];
}

async function getGoogleAccessToken() {
  const settings = await getEffectiveAppSettings();

  if (!settings.googleClientId || !settings.googleClientSecret) {
    throw new Error("Google OAuth ist nicht vollständig konfiguriert.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("calendar_oauth_connections")
    .select("access_token,account_email,expires_at,refresh_token,scope")
    .eq("provider", "google")
    .eq("is_active", true)
    .maybeSingle<GoogleAccountConnection>();

  if (error || !data?.refresh_token) {
    throw new Error("Google Kalender ist noch nicht verbunden.");
  }

  if (data.access_token && data.expires_at && new Date(data.expires_at).getTime() > Date.now() + 60_000) {
    return data.access_token;
  }

  const refreshed = await refreshGoogleToken({
    clientId: settings.googleClientId,
    clientSecret: settings.googleClientSecret,
    refreshToken: data.refresh_token
  });
  const expiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null;

  await supabase
    .from("calendar_oauth_connections")
    .update({
      access_token: refreshed.access_token,
      expires_at: expiresAt,
      scope: refreshed.scope || data.scope,
      updated_at: new Date().toISOString()
    })
    .eq("provider", "google");

  return refreshed.access_token;
}

async function refreshGoogleToken(input: { clientId: string; clientSecret: string; refreshToken: string }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: "refresh_token",
      refresh_token: input.refreshToken
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(getGoogleTokenErrorMessage(response.status, details));
  }

  return (await response.json()) as GoogleTokenResponse;
}

function getGoogleTokenErrorMessage(status: number, details: string) {
  if (details.includes("invalid_client") || details.includes("client secret")) {
    return "Google Kalender muss neu verbunden werden. Bitte prüfen Sie die Google OAuth Client ID und den Google OAuth Client Secret in Kalender & Meetings und klicken Sie danach auf „Google verbinden“. Der gespeicherte Client Secret ist aktuell ungültig.";
  }

  return `Google Kalender muss neu verbunden werden (${status}). Bitte öffnen Sie Kalender & Meetings und klicken Sie auf „Google verbinden“.`;
}
