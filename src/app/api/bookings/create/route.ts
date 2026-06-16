import { addMinutes } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { assertSlotAvailable } from "@/lib/availability";
import { createEvent } from "@/lib/calendar/caldav";
import { hasSupabaseConfig } from "@/lib/config";
import { getEnv } from "@/lib/env";
import { createMeetingLink } from "@/lib/meeting-links";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";
import { createBookingSchema } from "@/lib/validation";
import { sendBookingEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  const env = getEnv();
  const isAjax = request.headers.get("x-smart-booking-ajax") === "1";
  const navigate = (path: string) => {
    const url = path.startsWith("http") ? path : `${env.NEXT_PUBLIC_SITE_URL}${path}`;
    return isAjax ? NextResponse.json({ redirectTo: url }) : NextResponse.redirect(url, { status: 303 });
  };
  const validationError = (message: string) => {
    return isAjax
      ? NextResponse.json({ error: message }, { status: 400 })
      : navigate(`/booking-error?reason=invalid`);
  };
  const buildRetryParams = (reason: string, type: string, start: Date, detail?: string) => {
    const params = new URLSearchParams({
      reason,
      type,
      start: start.toISOString()
    });

    if (detail) {
      params.set("detail", detail);
    }

    return `/booking-error?${params.toString()}`;
  };

  if (!hasSupabaseConfig()) {
    return navigate("/booking-error?reason=config");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const limited = rateLimit(`booking:${ip}`);

  if (!limited.ok) {
    return navigate("/booking-error?reason=unknown");
  }

  const formData = await request.formData();
  const successPath = buildSuccessPath(formData);
  const payload = {
    bookingTypeSlug: formData.get("bookingTypeSlug"),
    startsAt: formData.get("startsAt"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    company: formData.get("company"),
    phone: formData.get("phone") || undefined,
    meetingLocation: formData.get("meetingLocation"),
    topic: formData.get("topic"),
    privacyAccepted: formData.get("privacyAccepted") === "true"
  };
  const parsed = createBookingSchema.safeParse(payload);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return validationError(firstError || "Bitte prüfen Sie Ihre Eingaben und bestätigen Sie den Datenschutzhinweis.");
  }

  const supabase = createSupabaseAdmin();
  const { data: bookingType, error: typeError } = await supabase
    .from("booking_types")
    .select("*")
    .eq("slug", parsed.data.bookingTypeSlug)
    .eq("is_active", true)
    .single<BookingType>();

  if (typeError || !bookingType) {
    return navigate("/booking-error?reason=unknown");
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = addMinutes(startsAt, bookingType.duration_minutes);
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_type_id", bookingType.id)
    .eq("customer_email", parsed.data.customerEmail)
    .eq("starts_at", startsAt.toISOString())
    .eq("status", "confirmed")
    .maybeSingle();

  if (existingBooking) {
    return navigate(successPath("existing", "1"));
  }

  const isAvailable = await assertSlotAvailable(parsed.data.bookingTypeSlug, startsAt, endsAt);

  if (!isAvailable) {
    const { data: concurrentBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_type_id", bookingType.id)
      .eq("customer_email", parsed.data.customerEmail)
      .eq("starts_at", startsAt.toISOString())
      .eq("status", "confirmed")
      .maybeSingle();

    if (concurrentBooking) {
      return navigate(successPath("existing", "1"));
    }

    return navigate(`/booking-error?reason=unavailable&type=${encodeURIComponent(parsed.data.bookingTypeSlug)}`);
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      booking_type_id: bookingType.id,
      customer_name: parsed.data.customerName,
      customer_email: parsed.data.customerEmail,
      company: parsed.data.company,
      phone: parsed.data.phone || null,
      meeting_location: parsed.data.meetingLocation,
      topic: parsed.data.topic,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: "Europe/Berlin"
    })
    .select("*")
    .single();

  if (insertError || !booking) {
    return navigate(`/booking-error?reason=unknown&type=${encodeURIComponent(parsed.data.bookingTypeSlug)}`);
  }

  let bookingWithMeeting = { ...booking, bookingType };

  try {
    const meetingUrl = await createMeetingLink(bookingWithMeeting);

    if (meetingUrl) {
      const { data: updatedBooking } = await supabase
        .from("bookings")
        .update({ meeting_url: meetingUrl })
        .eq("id", booking.id)
        .select("*")
        .single();

      if (updatedBooking) {
        bookingWithMeeting = { ...updatedBooking, bookingType };
      }
    }
  } catch (error) {
    console.error("Meeting link creation failed", error);
  }

  try {
    const calendarEvent = await createEvent(bookingWithMeeting);
    await supabase
      .from("bookings")
      .update({ calendar_event_id: calendarEvent.eventId, calendar_event_url: calendarEvent.eventUrl })
      .eq("id", booking.id);
  } catch (error) {
    console.error("Apple calendar booking failed", error);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    return navigate(buildRetryParams("calendar", parsed.data.bookingTypeSlug, startsAt, getCalendarErrorCode(error)));
  }

  try {
    await sendBookingEmails(bookingWithMeeting);
  } catch (error) {
    console.error("Booking email delivery failed", error);
  }

  return navigate(successPath());
}

function buildSuccessPath(formData: FormData) {
  return (key?: string, value?: string) => {
    const params = new URLSearchParams();
    const profileSlug = String(formData.get("profileSlug") || "").trim();
    const embedView = formData.get("embedView") === "1";

    if (key && value) {
      params.set(key, value);
    }

    if (profileSlug) {
      params.set("profile", profileSlug);
    }

    if (embedView) {
      params.set("embed", "1");
    }

    return params.toString() ? `/success?${params.toString()}` : "/success";
  };
}

function getCalendarErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("kein apple kalender")) {
    return "calendar-not-found";
  }

  if (message.includes("nicht vollständig konfiguriert")) {
    return "calendar-config";
  }

  return "calendar-write";
}
