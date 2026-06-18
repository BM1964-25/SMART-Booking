import { NextRequest, NextResponse } from "next/server";
import { deleteBookingCalendarEvent } from "@/lib/calendar/delete-booking-event";
import { hasSupabaseConfig } from "@/lib/config";
import { getEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { cancelBookingSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase ist noch nicht konfiguriert. Stornierungen sind erst nach Setup aktiv." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const parsed = cancelBookingSchema.safeParse({ token: formData.get("token") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Stornolink." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("cancellation_token", parsed.data.token)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Die Buchung wurde nicht gefunden oder bereits storniert." }, { status: 404 });
  }

  if (booking.calendar_event_id) {
    try {
      await deleteBookingCalendarEvent({
        eventId: booking.calendar_event_id,
        eventUrl: booking.calendar_event_url
      });
    } catch {
      // The booking should still be cancelled even if the external calendar already removed the event.
    }
  }

  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

  return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/success?cancelled=1`, { status: 303 });
}
