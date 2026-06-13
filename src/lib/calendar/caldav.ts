import { createDAVClient } from "tsdav";
import { createEvent as createIcsEvent } from "ics";
import { getEnv } from "@/lib/env";
import { getMeetingLocationCalendarLines, getMeetingLocationDetails } from "@/lib/meeting-location";
import { BookingType } from "@/lib/types";

type CalendarEvent = {
  uid: string;
  href?: string;
  etag?: string;
  startsAt: Date;
  endsAt: Date;
  summary?: string;
};

type BookingForCalendar = {
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

type AppleDavClient = Awaited<ReturnType<typeof createDAVClient>>;

let cachedClient: AppleDavClient | null = null;

export async function connectToAppleCalendar() {
  const env = getEnv();

  if (!env.APPLE_CALDAV_URL || !env.APPLE_CALDAV_USERNAME || !env.APPLE_CALDAV_APP_PASSWORD) {
    throw new Error("Apple CalDAV ist nicht vollständig konfiguriert.");
  }

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = await createDAVClient({
    serverUrl: env.APPLE_CALDAV_URL,
    credentials: {
      username: env.APPLE_CALDAV_USERNAME,
      password: env.APPLE_CALDAV_APP_PASSWORD
    },
    authMethod: "Basic",
    defaultAccountType: "caldav"
  });

  return cachedClient;
}

export async function listCalendars() {
  const client = await connectToAppleCalendar();
  return client.fetchCalendars();
}

async function getConfiguredCalendar() {
  const env = getEnv();
  const calendars = await listCalendars();
  const configured = env.APPLE_CALENDAR_ID;

  if (!configured) {
    return calendars[0];
  }

  return calendars.find((calendar) => {
    const calendarUrl = calendar.url || "";
    return (
      calendarUrl === configured ||
      calendarUrl.endsWith(`/calendars/${configured}/`) ||
      calendarUrl.includes(`/calendars/${configured}/`) ||
      calendar.displayName === configured
    );
  });
}

export async function getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
  const calendar = await getConfiguredCalendar();

  if (!calendar) {
    throw new Error("Kein Apple Kalender gefunden.");
  }

  const client = await connectToAppleCalendar();
  const objects = await client.fetchCalendarObjects({
    calendar,
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  });

  return objects.flatMap((object) => parseVEvent(object.data, object.url, object.etag));
}

export async function createEvent(booking: BookingForCalendar) {
  const calendar = await getConfiguredCalendar();

  if (!calendar) {
    throw new Error("Kein Apple Kalender für die Buchung gefunden.");
  }

  const uid = `smart-booking-${booking.id}@builtsmart-ai.app`;
  const startsAt = new Date(booking.starts_at);
  const endsAt = new Date(booking.ends_at);
  const title = `${booking.bookingType?.name || "Termin"}: ${booking.customer_name}`;
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
    .join("\\n");

  const ics = buildCalendarObject({
    uid,
    title,
    description,
    startsAt,
    endsAt,
    attendeeEmail: booking.customer_email,
    location: meetingDetails.label,
    url: meetingDetails.link
  });

  const objectUrl = `${calendar.url}${uid}.ics`;
  const client = await connectToAppleCalendar();

  await client.createCalendarObject({
    calendar,
    filename: `${uid}.ics`,
    iCalString: ics
  });

  return { eventId: objectUrl, eventUrl: objectUrl };
}

export async function deleteEvent(eventId: string) {
  const calendar = await getConfiguredCalendar();

  if (!calendar) {
    throw new Error("Kein Apple Kalender gefunden.");
  }

  const client = await connectToAppleCalendar();

  await client.deleteCalendarObject({
    calendarObject: {
      url: eventId,
      data: ""
    }
  });
}

export async function checkAvailability(startDate: Date, endDate: Date) {
  const events = await getEvents(startDate, endDate);
  return !events.some((event) => rangesOverlap(startDate, endDate, event.startsAt, event.endsAt));
}

export function createIcsFallback(booking: BookingForCalendar) {
  const startsAt = new Date(booking.starts_at);
  const endsAt = new Date(booking.ends_at);
  const meetingDetails = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);
  const description = [...getMeetingLocationCalendarLines(booking.meeting_location, booking.phone, booking.meeting_url), "", booking.topic].join("\n");

  const result = createIcsEvent({
    title: booking.bookingType?.name || "Termin mit BuiltSmart AI",
    description,
    location: meetingDetails.label,
    url: meetingDetails.link,
    start: [
      startsAt.getFullYear(),
      startsAt.getMonth() + 1,
      startsAt.getDate(),
      startsAt.getHours(),
      startsAt.getMinutes()
    ],
    end: [endsAt.getFullYear(), endsAt.getMonth() + 1, endsAt.getDate(), endsAt.getHours(), endsAt.getMinutes()],
    startInputType: "utc",
    endInputType: "utc",
    organizer: { name: "BuiltSmart AI", email: getEnv().BOOKING_OWNER_EMAIL || "kontakt@builtsmart-ai.app" },
    attendees: [{ name: booking.customer_name, email: booking.customer_email, rsvp: false }]
  });

  if (result.error || !result.value) {
    throw result.error || new Error("ICS-Datei konnte nicht erstellt werden.");
  }

  return result.value;
}

function buildCalendarObject(input: {
  uid: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  attendeeEmail: string;
  location?: string;
  url?: string;
}) {
  const now = toCalDavDate(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BuiltSmart AI//SMART Booking//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toCalDavDate(input.startsAt)}`,
    `DTEND:${toCalDavDate(input.endsAt)}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(input.description)}`,
    input.location ? `LOCATION:${escapeIcs(input.location)}` : null,
    input.url ? `URL:${escapeIcs(input.url)}` : null,
    `ATTENDEE;CN=${escapeIcs(input.attendeeEmail)}:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ]
    .filter(Boolean)
    .join("\r\n");
}

function parseVEvent(data: string, href?: string, etag?: string): CalendarEvent[] {
  const events = data.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  return events
    .map((event) => {
      const uid = readIcsField(event, "UID") || href || crypto.randomUUID();
      const dtStart = readIcsField(event, "DTSTART");
      const dtEnd = readIcsField(event, "DTEND");

      if (!dtStart || !dtEnd) {
        return null;
      }

      return {
        uid,
        href,
        etag,
        startsAt: fromCalDavDate(dtStart),
        endsAt: fromCalDavDate(dtEnd),
        summary: readIcsField(event, "SUMMARY") || undefined
      };
    })
    .filter(Boolean) as CalendarEvent[];
}

function readIcsField(event: string, field: string) {
  const match = event.match(new RegExp(`^${field}(?:;[^:]*)?:(.+)$`, "m"));
  return match?.[1]?.trim();
}

function toCalDavDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function fromCalDavDate(value: string) {
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`);
  }

  return new Date(value);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
