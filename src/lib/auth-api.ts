import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminApi() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 }) };
  }

  const { data } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();

  if (!data) {
    return { user: null, response: NextResponse.json({ error: "Keine Admin-Berechtigung." }, { status: 403 }) };
  }

  return { user, response: null };
}
