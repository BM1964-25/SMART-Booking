import { getEnv } from "@/lib/env";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { BookingType } from "@/lib/types";

type MeetingLinkBooking = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  meeting_location?: string | null;
  starts_at: string;
  ends_at: string;
  bookingType?: BookingType;
};

type ZoomTokenResponse = {
  access_token: string;
};

type ZoomMeetingResponse = {
  join_url?: string;
};

export async function createMeetingLink(booking: MeetingLinkBooking) {
  const settings = await getEffectiveAppSettings();
  const env = getEnv();

  switch (booking.meeting_location) {
    case "zoom":
      return settings.zoomMeetingMode === "api" ? createZoomMeeting(booking) : settings.zoomMeetingUrl || env.ZOOM_MEETING_URL || null;
    case "teams":
      if (settings.teamsMeetingMode === "api" && settings.activeCalendarProvider === "microsoft") {
        return null;
      }

      return settings.teamsMeetingUrl || env.TEAMS_MEETING_URL || null;
    case "google_meet":
      if (settings.googleMeetingMode === "api" && settings.activeCalendarProvider === "google") {
        return null;
      }

      return settings.googleMeetUrl || env.GOOGLE_MEET_URL || null;
    case "onsite":
      return settings.onsiteMeetingUrl || env.ONSITE_MEETING_URL || null;
    default:
      return null;
  }
}

export async function testZoomMeetingLink() {
  const startsAt = new Date(Date.now() + 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

  return createZoomMeeting({
    id: "zoom-test",
    customer_name: "SMART Booking Test",
    customer_email: "test@builtsmart-ai.app",
    company: "BuiltSmart AI",
    meeting_location: "zoom",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    bookingType: {
      id: "zoom-test",
      slug: "zoom-test",
      name: "SMART Booking Zoom-Test",
      description: null,
      duration_minutes: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      is_active: true,
      sort_order: 1
    }
  });
}

async function createZoomMeeting(booking: MeetingLinkBooking) {
  const env = getEnv();
  const settings = await getEffectiveAppSettings();

  const accountId = settings.zoomAccountId || env.ZOOM_ACCOUNT_ID;
  const clientId = settings.zoomClientId || env.ZOOM_CLIENT_ID;
  const clientSecret = settings.zoomClientSecret || env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    return settings.zoomMeetingUrl || env.ZOOM_MEETING_URL || null;
  }

  const accessToken = await getZoomAccessToken({
    accountId,
    clientId,
    clientSecret
  });
  const startsAt = new Date(booking.starts_at);
  const endsAt = new Date(booking.ends_at);
  const durationMinutes = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic: `${booking.bookingType?.name || "Termin"} - ${booking.company}`,
      type: 2,
      start_time: startsAt.toISOString(),
      duration: durationMinutes,
      timezone: "Europe/Berlin",
      agenda: `SMART Booking Termin mit ${booking.customer_name} (${booking.customer_email})`,
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2,
        registrants_email_notification: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Zoom-Meeting konnte nicht erstellt werden (${response.status}): ${await response.text()}`);
  }

  const meeting = (await response.json()) as ZoomMeetingResponse;

  if (!meeting.join_url) {
    throw new Error("Zoom hat keinen Meeting-Link zurückgegeben.");
  }

  return meeting.join_url;
}

async function getZoomAccessToken(input: { accountId: string; clientId: string; clientSecret: string }) {
  const credentials = Buffer.from(`${input.clientId}:${input.clientSecret}`).toString("base64");
  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(input.accountId)}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`
    }
  });

  if (!response.ok) {
    throw new Error(`Zoom-Zugang konnte nicht authentifiziert werden (${response.status}): ${await response.text()}`);
  }

  const token = (await response.json()) as ZoomTokenResponse;

  if (!token.access_token) {
    throw new Error("Zoom hat kein Zugriffstoken zurückgegeben.");
  }

  return token.access_token;
}
