import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { isMissingAppSettingsError } from "@/lib/app-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const supabase = createSupabaseAdmin();
  const [
    { data: profiles, error: profilesError },
    { data: bookingTypes, error: bookingTypesError },
    { data: bookingTypeProfiles, error: bookingTypeProfilesError },
    { data: availabilityRules, error: availabilityRulesError },
    { data: blockedTimes, error: blockedTimesError },
    { data: profileTemplates, error: profileTemplatesError },
    { data: calendarConnections, error: calendarConnectionsError },
    { data: appSettings, error: appSettingsError }
  ] = await Promise.all([
    supabase.from("booking_profiles").select("*").order("created_at"),
    supabase.from("booking_types").select("*").order("sort_order").order("created_at"),
    supabase.from("booking_type_profiles").select("*"),
    supabase.from("availability_rules").select("*").order("weekday").order("start_time"),
    supabase.from("blocked_times").select("*").order("starts_at"),
    supabase.from("booking_profile_templates").select("*").order("created_at"),
    supabase.from("calendar_connections").select("*").order("display_name"),
    supabase.from("app_settings").select("*").eq("id", true).maybeSingle()
  ]);
  const relevantAppSettingsError = appSettingsError && !isMissingAppSettingsError(appSettingsError.message) ? appSettingsError : null;
  const error =
    profilesError ||
    bookingTypesError ||
    bookingTypeProfilesError ||
    availabilityRulesError ||
    blockedTimesError ||
    profileTemplatesError ||
    calendarConnectionsError ||
    relevantAppSettingsError;

  if (error) {
    return NextResponse.json({ error: "Export konnte nicht erstellt werden.", details: error.message }, { status: 500 });
  }

  const exportedAt = new Date().toISOString();
  const backup = {
    version: 1,
    app: "smart-booking",
    exportedAt,
    data: {
      profiles: profiles || [],
      bookingTypes: bookingTypes || [],
      bookingTypeProfiles: bookingTypeProfiles || [],
      availabilityRules: availabilityRules || [],
      blockedTimes: blockedTimes || [],
      profileTemplates: profileTemplates || [],
      calendarConnections: calendarConnections || [],
      appSettings: appSettings || null
    }
  };
  const filename = `smart-booking-backup-${exportedAt.slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "content-disposition": `attachment; filename="${filename}"`,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
