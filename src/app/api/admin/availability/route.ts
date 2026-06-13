import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { availabilityMutationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const parsed = availabilityMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Verfügbarkeit.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const payload = {
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    timezone: "Europe/Berlin",
    is_active: parsed.data.isActive
  };

  const query = parsed.data.id
    ? supabase.from("availability_rules").update(payload).eq("id", parsed.data.id).select("*").single()
    : supabase.from("availability_rules").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Verfügbarkeit konnte nicht gespeichert werden." }, { status: 500 });
  }

  return NextResponse.json({ availability: data });
}
