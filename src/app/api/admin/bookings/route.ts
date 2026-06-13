import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("bookings").select("*, booking_types(name)").order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Buchungen konnten nicht geladen werden." }, { status: 500 });
  }

  return NextResponse.json({ bookings: data });
}
