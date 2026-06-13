import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingTypeMutationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const parsed = bookingTypeMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Terminart.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const payload = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description || null,
    duration_minutes: parsed.data.durationMinutes,
    buffer_before_minutes: parsed.data.bufferBeforeMinutes,
    buffer_after_minutes: parsed.data.bufferAfterMinutes,
    is_active: parsed.data.isActive
  };

  const query = parsed.data.id
    ? supabase.from("booking_types").update(payload).eq("id", parsed.data.id).select("*").single()
    : supabase.from("booking_types").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Terminart konnte nicht gespeichert werden." }, { status: 500 });
  }

  return NextResponse.json({ bookingType: data });
}
