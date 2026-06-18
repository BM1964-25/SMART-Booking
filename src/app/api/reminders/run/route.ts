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
  booking_types: BookingType | BookingType[] | null;
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
    .is("reminder_sent_at", null)
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

    if (!bookingType?.reminder_enabled) {
      continue;
    }

    const reminderMinutes = clampReminderMinutes(bookingType.reminder_minutes_before);
    const reminderAt = addMinutes(new Date(booking.starts_at), -reminderMinutes);

    if (reminderAt.getTime() > now.getTime()) {
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
        reminder_note: bookingType.reminder_note
      });

      await supabase
        .from("bookings")
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_attempted_at: new Date().toISOString(),
          reminder_last_error: null
        })
        .eq("id", booking.id);
      sent += 1;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unbekannter Fehler";
      await supabase
        .from("bookings")
        .update({
          reminder_attempted_at: new Date().toISOString(),
          reminder_last_error: message
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

function clampReminderMinutes(value: number | null | undefined) {
  const minutes = Number(value || 120);

  if (!Number.isFinite(minutes)) {
    return 120;
  }

  return Math.min(10080, Math.max(15, Math.trunc(minutes)));
}
