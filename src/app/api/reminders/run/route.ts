import { addMinutes } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { sendBookingReminderEmail } from "@/lib/email";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

type ReminderBookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  phone: string | null;
  meeting_location: string | null;
  meeting_url: string | null;
  topic: string;
  starts_at: string;
  ends_at: string;
  cancellation_token: string;
  reminder_sent_at: string | null;
  reminder_2_sent_at: string | null;
  booking_types: BookingType | BookingType[] | null;
};

type DueReminder = {
  number: 1 | 2;
  minutesBefore: number;
  note: string | null | undefined;
  sentField: "reminder_sent_at" | "reminder_2_sent_at";
  attemptedField: "reminder_attempted_at" | "reminder_2_attempted_at";
  errorField: "reminder_last_error" | "reminder_2_last_error";
};

export async function GET(request: NextRequest) {
  return runReminders(request);
}

export async function POST(request: NextRequest) {
  return runReminders(request);
}

async function runReminders(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Nicht autorisiert." }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date();
  const horizon = addMinutes(now, 10080);
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_types(*)")
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true })
    .limit(50)
    .returns<ReminderBookingRow[]>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let checked = 0;
  let sent = 0;
  let failed = 0;

  for (const booking of data || []) {
    checked += 1;
    const bookingType = normalizeBookingType(booking.booking_types);

    if (!bookingType?.reminder_enabled && !bookingType?.reminder_2_enabled) {
      continue;
    }

    const dueReminder = getDueReminder(booking, bookingType, now);

    if (!dueReminder) {
      continue;
    }

    try {
      await sendBookingReminderEmail({
        ...booking,
        company: booking.company || "",
        meeting_location: booking.meeting_location,
        meeting_url: booking.meeting_url,
        phone: booking.phone,
        bookingType,
        reminder_note: renderReminderNote(dueReminder.note, dueReminder.minutesBefore)
      });

      await supabase
        .from("bookings")
        .update({
          [dueReminder.sentField]: new Date().toISOString(),
          [dueReminder.attemptedField]: new Date().toISOString(),
          [dueReminder.errorField]: null
        })
        .eq("id", booking.id);
      sent += 1;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unbekannter Fehler";
      await supabase
        .from("bookings")
        .update({
          [dueReminder.attemptedField]: new Date().toISOString(),
          [dueReminder.errorField]: message
        })
        .eq("id", booking.id);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, checked, sent, failed });
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}

function normalizeBookingType(value: BookingType | BookingType[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function getDueReminder(booking: ReminderBookingRow, bookingType: BookingType, now: Date): DueReminder | null {
  const candidates: DueReminder[] = [];

  if (bookingType.reminder_enabled && !booking.reminder_sent_at) {
    candidates.push({
      number: 1,
      minutesBefore: clampReminderMinutes(bookingType.reminder_minutes_before),
      note: bookingType.reminder_note,
      sentField: "reminder_sent_at",
      attemptedField: "reminder_attempted_at",
      errorField: "reminder_last_error"
    });
  }

  if (bookingType.reminder_2_enabled && !booking.reminder_2_sent_at) {
    candidates.push({
      number: 2,
      minutesBefore: clampReminderMinutes(bookingType.reminder_2_minutes_before),
      note: bookingType.reminder_2_note,
      sentField: "reminder_2_sent_at",
      attemptedField: "reminder_2_attempted_at",
      errorField: "reminder_2_last_error"
    });
  }

  return (
    candidates
      .filter((candidate) => addMinutes(new Date(booking.starts_at), -candidate.minutesBefore).getTime() <= now.getTime())
      .sort((a, b) => b.minutesBefore - a.minutesBefore)[0] || null
  );
}

function clampReminderMinutes(value: number | null | undefined) {
  const minutes = Number(value || 120);

  if (!Number.isFinite(minutes)) {
    return 120;
  }

  return Math.min(10080, Math.max(15, Math.trunc(minutes)));
}

function renderReminderNote(note: string | null | undefined, minutesBefore: number) {
  return String(note || "").replaceAll("{zeit}", formatReminderLeadTime(minutesBefore));
}

function formatReminderLeadTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} Minuten`;
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "1 Tag" : `${days} Tage`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
  }

  return `${minutes} Minuten`;
}
