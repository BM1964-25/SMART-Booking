import { Resend } from "resend";
import { createIcsFallback } from "@/lib/calendar/caldav";
import { buildSlotLabel } from "@/lib/date";
import { getEnv } from "@/lib/env";
import { getMeetingLocationDetails } from "@/lib/meeting-location";
import { BookingType } from "@/lib/types";

type BookingEmail = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  meeting_location?: string | null;
  phone?: string | null;
  topic: string;
  starts_at: string;
  ends_at: string;
  cancellation_token: string;
  bookingType: BookingType;
};

export async function sendBookingEmails(booking: BookingEmail) {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY fehlt. E-Mail-Versand wurde übersprungen.");
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const ownerEmail = env.BOOKING_OWNER_EMAIL || "bernhard@builtsmart-ai.app";
  const cancelUrl = `${env.NEXT_PUBLIC_SITE_URL}/cancel/${booking.cancellation_token}`;
  const changeUrl = `${env.NEXT_PUBLIC_SITE_URL}/change/${booking.cancellation_token}`;
  const label = buildSlotLabel(new Date(booking.starts_at), new Date(booking.ends_at));
  const ics = createIcsFallback(booking);

  await Promise.all([
    resend.emails.send({
      from: "BuiltSmart AI <termine@builtsmart-ai.app>",
      to: booking.customer_email,
      subject: "Ihre Terminbuchung bei BuiltSmart AI",
      html: customerHtml(booking, label, cancelUrl, changeUrl),
      attachments: [
        {
          filename: "termin-builtsmart-ai.ics",
          content: Buffer.from(ics).toString("base64")
        }
      ]
    }),
    resend.emails.send({
      from: "SMART Booking <termine@builtsmart-ai.app>",
      to: ownerEmail,
      subject: `Neue Buchung: ${booking.bookingType.name}`,
      html: ownerHtml(booking, label)
    })
  ]);
}

export async function sendBookingCancellationEmails(booking: BookingEmail) {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY fehlt. Storno-E-Mail wurde übersprungen.");
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const ownerEmail = env.BOOKING_OWNER_EMAIL || "bernhard@builtsmart-ai.app";
  const label = buildSlotLabel(new Date(booking.starts_at), new Date(booking.ends_at));

  await Promise.all([
    resend.emails.send({
      from: "BuiltSmart AI <termine@builtsmart-ai.app>",
      to: booking.customer_email,
      subject: "Ihr Termin bei BuiltSmart AI wurde storniert",
      html: customerCancellationHtml(booking, label)
    }),
    resend.emails.send({
      from: "SMART Booking <termine@builtsmart-ai.app>",
      to: ownerEmail,
      subject: `Termin storniert: ${booking.bookingType.name}`,
      html: ownerCancellationHtml(booking, label)
    })
  ]);
}

function customerHtml(booking: BookingEmail, label: string, cancelUrl: string, changeUrl: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone);

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <h1>Termin bestätigt</h1>
      <p>Guten Tag ${escapeHtml(booking.customer_name)},</p>
      <p>Ihr Termin mit BuiltSmart AI wurde bestätigt.</p>
      <p><strong>${escapeHtml(booking.bookingType.name)}</strong><br>${label}</p>
      <p>Terminort: ${escapeHtml(meeting.label)}<br>
      ${escapeHtml(meeting.description)}
      ${meeting.link ? `<br><a href="${escapeHtml(meeting.link)}">${escapeHtml(meeting.linkLabel || meeting.link)}</a>` : ""}</p>
      <p>Änderung vorschlagen: <a href="${changeUrl}">${changeUrl}</a></p>
      <p>Stornierung: <a href="${cancelUrl}">${cancelUrl}</a></p>
      <p>BuiltSmart AI · Powered by BuiltSmart Hub</p>
    </div>
  `;
}

function ownerHtml(booking: BookingEmail, label: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone);

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <h1>Neue Buchung</h1>
      <p><strong>${escapeHtml(booking.bookingType.name)}</strong><br>${label}</p>
      <p>Name: ${escapeHtml(booking.customer_name)}<br>
      E-Mail: ${escapeHtml(booking.customer_email)}<br>
      Unternehmen: ${escapeHtml(booking.company)}<br>
      Terminort: ${escapeHtml(meeting.label)}<br>
      Hinweis: ${escapeHtml(meeting.description)}<br>
      ${meeting.link ? `Link: <a href="${escapeHtml(meeting.link)}">${escapeHtml(meeting.linkLabel || meeting.link)}</a><br>` : ""}
      Telefon: ${escapeHtml(booking.phone || "-")}</p>
      <p>${escapeHtml(booking.topic)}</p>
    </div>
  `;
}

function customerCancellationHtml(booking: BookingEmail, label: string) {
  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <h1>Termin storniert</h1>
      <p>Guten Tag ${escapeHtml(booking.customer_name)},</p>
      <p>Ihr Termin mit BuiltSmart AI wurde storniert.</p>
      <p><strong>${escapeHtml(booking.bookingType.name)}</strong><br>${label}</p>
      <p>Falls Sie einen neuen Termin buchen möchten, nutzen Sie bitte die Buchungsseite.</p>
      <p>BuiltSmart AI · Powered by BuiltSmart Hub</p>
    </div>
  `;
}

function ownerCancellationHtml(booking: BookingEmail, label: string) {
  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <h1>Termin storniert</h1>
      <p><strong>${escapeHtml(booking.bookingType.name)}</strong><br>${label}</p>
      <p>Name: ${escapeHtml(booking.customer_name)}<br>
      E-Mail: ${escapeHtml(booking.customer_email)}<br>
      Unternehmen: ${escapeHtml(booking.company)}</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
