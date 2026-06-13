import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    redirect("/admin/login");
  }

  return user;
}
