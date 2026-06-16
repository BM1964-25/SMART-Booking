import nodemailer from "nodemailer";
import { createIcsFallback } from "@/lib/calendar/caldav";
import { buildSlotLabel } from "@/lib/date";
import { getEnv } from "@/lib/env";
import { getMeetingLocationDetails } from "@/lib/meeting-location";
import { BookingType } from "@/lib/types";

const DEFAULT_PUBLIC_SITE_URL = "https://booking.builtsmart-ai.app";

type BookingEmail = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  meeting_location?: string | null;
  meeting_url?: string | null;
  phone?: string | null;
  topic: string;
  starts_at: string;
  ends_at: string;
  cancellation_token: string;
  bookingType: BookingType;
};

export async function sendBookingEmails(booking: BookingEmail) {
  const env = getEnv();

  if (!hasSmtpConfig(env)) {
    console.warn("SMTP-Konfiguration fehlt. E-Mail-Versand wurde übersprungen.");
    return;
  }

  const transporter = createMailTransport(env);
  const ownerEmail = env.BOOKING_OWNER_EMAIL || "bernhard@builtsmart-ai.app";
  const cancelUrl = buildPublicUrl(env, `/cancel/${booking.cancellation_token}`);
  const changeUrl = buildPublicUrl(env, `/change/${booking.cancellation_token}`);
  const label = buildSlotLabel(new Date(booking.starts_at), new Date(booking.ends_at));
  const ics = createIcsFallback(booking);
  const from = env.MAIL_FROM || "SMART Booking <termine@builtsmart-ai.app>";

  await Promise.all([
    transporter.sendMail({
      from,
      to: booking.customer_email,
      replyTo: ownerEmail,
      subject: `Terminbestätigung: ${booking.bookingType.name}`,
      text: customerText(booking, label, cancelUrl, changeUrl),
      html: customerHtml(booking, label, cancelUrl, changeUrl),
      attachments: [
        {
          filename: "termin-builtsmart-ai.ics",
          content: ics,
          contentType: "text/calendar; charset=utf-8; method=PUBLISH"
        }
      ]
    }),
    transporter.sendMail({
      from,
      to: ownerEmail,
      replyTo: booking.customer_email,
      subject: `Neue Buchung: ${booking.bookingType.name}`,
      text: ownerText(booking, label),
      html: ownerHtml(booking, label)
    })
  ]);
}

export async function sendBookingCancellationEmails(booking: BookingEmail) {
  const env = getEnv();

  if (!hasSmtpConfig(env)) {
    console.warn("SMTP-Konfiguration fehlt. Storno-E-Mail wurde übersprungen.");
    return;
  }

  const transporter = createMailTransport(env);
  const ownerEmail = env.BOOKING_OWNER_EMAIL || "bernhard@builtsmart-ai.app";
  const label = buildSlotLabel(new Date(booking.starts_at), new Date(booking.ends_at));
  const from = env.MAIL_FROM || "SMART Booking <termine@builtsmart-ai.app>";

  await Promise.all([
    transporter.sendMail({
      from,
      to: booking.customer_email,
      replyTo: ownerEmail,
      subject: `Termin storniert: ${booking.bookingType.name}`,
      text: customerCancellationText(booking, label),
      html: customerCancellationHtml(booking, label)
    }),
    transporter.sendMail({
      from,
      to: ownerEmail,
      replyTo: booking.customer_email,
      subject: `Termin storniert: ${booking.bookingType.name}`,
      text: ownerCancellationText(booking, label),
      html: ownerCancellationHtml(booking, label)
    })
  ]);
}

export async function sendEmailTest() {
  const env = getEnv();

  if (!hasSmtpConfig(env)) {
    throw new Error("SMTP-Konfiguration fehlt.");
  }

  const ownerEmail = env.BOOKING_OWNER_EMAIL;

  if (!ownerEmail) {
    throw new Error("BOOKING_OWNER_EMAIL fehlt.");
  }

  const transporter = createMailTransport(env);
  const from = env.MAIL_FROM || "SMART Booking <termine@builtsmart-ai.app>";

  await transporter.sendMail({
    from,
    to: ownerEmail,
    subject: "SMART Booking E-Mail-Test",
    text: "E-Mail-Versand funktioniert.\n\nSMART Booking kann E-Mails über Brevo SMTP versenden.",
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h1>E-Mail-Versand funktioniert</h1>
        <p>SMART Booking kann E-Mails über Brevo SMTP versenden.</p>
      </div>
    `
  });
}

function buildPublicUrl(env: ReturnType<typeof getEnv>, path: string) {
  return `${getPublicSiteUrl(env)}${path}`;
}

function getPublicSiteUrl(env: ReturnType<typeof getEnv>) {
  const configuredUrl = env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

  if (!configuredUrl || configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1")) {
    return DEFAULT_PUBLIC_SITE_URL;
  }

  return configuredUrl;
}

function hasSmtpConfig(env: ReturnType<typeof getEnv>) {
  return Boolean(env.SMTP_USER && env.SMTP_PASSWORD);
}

function createMailTransport(env: ReturnType<typeof getEnv>) {
  const port = env.SMTP_PORT || 587;

  return nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD
    }
  });
}

function customerHtml(booking: BookingEmail, label: string, cancelUrl: string, changeUrl: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <h1>Termin bestätigt</h1>
      <p>Guten Tag ${escapeHtml(booking.customer_name)},</p>
      <p>Ihr Termin mit BuiltSmart AI wurde bestätigt.</p>
      <p><strong>${escapeHtml(booking.bookingType.name)}</strong><br>${label}</p>
      <p>Terminort: ${escapeHtml(meeting.label)}<br>
      ${escapeHtml(meeting.description)}
      ${meeting.link ? `<br><a href="${escapeHtml(meeting.link)}">${escapeHtml(meeting.linkLabel || meeting.link)}</a>` : ""}</p>
      <p>Änderung vorschlagen: <a href="${escapeHtml(changeUrl)}">${escapeHtml(changeUrl)}</a></p>
      <p>Stornierung: <a href="${escapeHtml(cancelUrl)}">${escapeHtml(cancelUrl)}</a></p>
      <p>BuiltSmart AI · Powered by BuiltSmart Hub</p>
    </div>
  `;
}

function customerText(booking: BookingEmail, label: string, cancelUrl: string, changeUrl: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);

  return joinTextLines([
    `Guten Tag ${booking.customer_name},`,
    "",
    "Ihr Termin wurde bestätigt.",
    "",
    booking.bookingType.name,
    label,
    `Terminort: ${meeting.label}`,
    meeting.description,
    meeting.link ? `${meeting.linkLabel || "Link"}: ${meeting.link}` : null,
    "",
    `Änderung vorschlagen: ${changeUrl}`,
    `Termin stornieren: ${cancelUrl}`,
    "",
    "BuiltSmart AI · Powered by BuiltSmart Hub"
  ]);
}

function ownerHtml(booking: BookingEmail, label: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);

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

function ownerText(booking: BookingEmail, label: string) {
  const meeting = getMeetingLocationDetails(booking.meeting_location, booking.phone, booking.meeting_url);

  return joinTextLines([
    "Neue Buchung",
    "",
    booking.bookingType.name,
    label,
    "",
    `Name: ${booking.customer_name}`,
    `E-Mail: ${booking.customer_email}`,
    `Unternehmen: ${booking.company}`,
    `Terminort: ${meeting.label}`,
    `Hinweis: ${meeting.description}`,
    meeting.link ? `${meeting.linkLabel || "Link"}: ${meeting.link}` : null,
    `Telefon: ${booking.phone || "-"}`,
    "",
    booking.topic
  ]);
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

function customerCancellationText(booking: BookingEmail, label: string) {
  return joinTextLines([
    `Guten Tag ${booking.customer_name},`,
    "",
    "Ihr Termin wurde storniert.",
    "",
    booking.bookingType.name,
    label,
    "",
    "Falls Sie einen neuen Termin buchen möchten, nutzen Sie bitte die Buchungsseite.",
    "",
    "BuiltSmart AI · Powered by BuiltSmart Hub"
  ]);
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

function ownerCancellationText(booking: BookingEmail, label: string) {
  return joinTextLines([
    "Termin storniert",
    "",
    booking.bookingType.name,
    label,
    "",
    `Name: ${booking.customer_name}`,
    `E-Mail: ${booking.customer_email}`,
    `Unternehmen: ${booking.company}`
  ]);
}

function joinTextLines(lines: Array<string | null>) {
  return lines.filter((line) => line !== null).join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
