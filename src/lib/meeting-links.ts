import { getEnv } from "@/lib/env";
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
  if (booking.meeting_location !== "zoom") {
    return null;
  }

  return createZoomMeeting(booking);
}

async function createZoomMeeting(booking: MeetingLinkBooking) {
  const env = getEnv();

  if (!env.ZOOM_ACCOUNT_ID || !env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    return env.ZOOM_MEETING_URL || null;
  }

  const accessToken = await getZoomAccessToken({
    accountId: env.ZOOM_ACCOUNT_ID,
    clientId: env.ZOOM_CLIENT_ID,
    clientSecret: env.ZOOM_CLIENT_SECRET
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
    throw new Error(`Zoom-Meeting konnte nicht erstellt werden (${response.status}).`);
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
    throw new Error(`Zoom-Zugang konnte nicht authentifiziert werden (${response.status}).`);
  }

  const token = (await response.json()) as ZoomTokenResponse;

  if (!token.access_token) {
    throw new Error("Zoom hat kein Zugriffstoken zurückgegeben.");
  }

  return token.access_token;
}
