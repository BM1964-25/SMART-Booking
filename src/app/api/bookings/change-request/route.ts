import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/config";
import { getEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { changeRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/booking-error?reason=config`, { status: 303 });
  }

  const formData = await request.formData();
  const parsed = changeRequestSchema.safeParse({
    token: formData.get("token"),
    proposedStartsAt: formData.get("proposedStartsAt") ? new Date(String(formData.get("proposedStartsAt"))).toISOString() : "",
    message: formData.get("message")
  });

  if (!parsed.success) {
    return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/booking-error?reason=invalid`, { status: 303 });
  }

  const supabase = createSupabaseAdmin();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("cancellation_token", parsed.data.token)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!booking) {
    return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/booking-error?reason=unknown`, { status: 303 });
  }

  const { error } = await supabase.from("booking_change_requests").insert({
    booking_id: booking.id,
    proposed_starts_at: parsed.data.proposedStartsAt || null,
    message: parsed.data.message
  });

  if (error) {
    return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/booking-error?reason=unknown`, { status: 303 });
  }

  return NextResponse.redirect(`${getEnv().NEXT_PUBLIC_SITE_URL}/success?change=1`, { status: 303 });
}
