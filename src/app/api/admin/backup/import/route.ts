import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type BackupRow = Record<string, unknown>;

type BackupPayload = {
  version?: unknown;
  app?: unknown;
  exportedAt?: unknown;
  data?: {
    profiles?: BackupRow[];
    bookingTypes?: BackupRow[];
    bookingTypeProfiles?: BackupRow[];
    availabilityRules?: BackupRow[];
    blockedTimes?: BackupRow[];
    profileTemplates?: BackupRow[];
    calendarConnections?: BackupRow[];
    appSettings?: BackupRow | null;
  };
};

const profileColumns = [
  "slug",
  "name",
  "preheadline",
  "preheadline_url",
  "headline",
  "subheadline",
  "highlight_subheadline",
  "contact_name",
  "contact_email",
  "contact_phone",
  "linkedin_url",
  "xing_url",
  "x_url",
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "spotify_url",
  "website_url",
  "secondary_website_url",
  "contact_icon_order",
  "portrait_url",
  "portrait_display_name",
  "portrait_info",
  "primary_color",
  "profile_card_bg_color",
  "booking_card_bg_color",
  "profile_layout",
  "portrait_position_x",
  "portrait_position_y",
  "portrait_zoom",
  "show_portrait",
  "show_portrait_display_name",
  "show_portrait_info",
  "show_preheadline",
  "show_subheadline",
  "show_highlight_subheadline",
  "show_workflow_steps",
  "show_contact_links",
  "show_contact_name",
  "show_contact_email",
  "show_contact_phone",
  "show_linkedin",
  "show_xing",
  "show_x",
  "show_instagram",
  "show_facebook",
  "show_youtube",
  "show_spotify",
  "show_website",
  "show_legal_privacy",
  "show_legal_imprint",
  "legal_privacy_url",
  "legal_imprint_url",
  "is_active"
];

const bookingTypeColumns = [
  "slug",
  "name",
  "description",
  "default_meeting_location",
  "duration_minutes",
  "buffer_before_minutes",
  "buffer_after_minutes",
  "is_active",
  "sort_order"
];

const availabilityColumns = ["id", "weekday", "start_time", "end_time", "timezone", "is_active"];
const blockedTimeColumns = ["id", "title", "starts_at", "ends_at", "reason"];
const templateColumns = ["id", "name", "template_data", "created_by"];
const calendarConnectionColumns = [
  "provider",
  "calendar_id",
  "display_name",
  "is_active",
  "use_for_booking",
  "use_for_availability",
  "last_checked_at"
];
const appSettingsColumns = [
  "active_calendar_provider",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_password",
  "mail_from",
  "booking_owner_email",
  "zoom_meeting_url",
  "zoom_meeting_mode",
  "zoom_account_id",
  "zoom_client_id",
  "zoom_client_secret",
  "teams_meeting_url",
  "teams_meeting_mode",
  "google_meet_url",
  "google_meeting_mode",
  "google_client_id",
  "google_client_secret",
  "onsite_meeting_url"
];

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as { backup?: BackupPayload; dryRun?: boolean } | null;
  const backup = body?.backup;
  const validation = validateBackup(backup);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const validBackup = backup as BackupPayload & { data: NonNullable<BackupPayload["data"]> };
  const data = validBackup.data || {};
  const summary = buildSummary(data);

  if (body?.dryRun) {
    return NextResponse.json({
      summary,
      warning:
        "Import ersetzt Verfügbarkeit, Blockzeiten, Profil-Vorlagen und Terminarten-Zuordnungen. Profile und Terminarten werden anhand ihres Slugs aktualisiert oder ergänzt. Buchungen werden nicht importiert."
    });
  }

  const supabase = createSupabaseAdmin();
  const profiles = sanitizeRows(data.profiles || [], profileColumns).filter((row) => typeof row.slug === "string" && typeof row.name === "string");
  const bookingTypes = sanitizeRows(data.bookingTypes || [], bookingTypeColumns).filter((row) => typeof row.slug === "string" && typeof row.name === "string");
  const availabilityRules = sanitizeRows(data.availabilityRules || [], availabilityColumns);
  const blockedTimes = sanitizeRows(data.blockedTimes || [], blockedTimeColumns);
  const profileTemplates = sanitizeRows(data.profileTemplates || [], templateColumns).map((row) => ({
    ...row,
    created_by: auth.user?.id || null
  }));
  const calendarConnections = sanitizeRows(data.calendarConnections || [], calendarConnectionColumns).filter(
    (row) => typeof row.provider === "string" && typeof row.calendar_id === "string"
  );
  const appSettings = data.appSettings ? sanitizeRows([data.appSettings], appSettingsColumns)[0] : null;
  const importedProfileIdsBySlug = new Map((data.profiles || []).map((row) => [String(row.id || ""), String(row.slug || "")]));
  const importedBookingTypeIdsBySlug = new Map((data.bookingTypes || []).map((row) => [String(row.id || ""), String(row.slug || "")]));

  if (profiles.length > 0) {
    const { error } = await supabase.from("booking_profiles").upsert(profiles, { onConflict: "slug" });

    if (error) {
      return NextResponse.json({ error: "Profile konnten nicht importiert werden.", details: error.message }, { status: 500 });
    }
  }

  const { data: currentProfiles, error: currentProfilesError } = await supabase.from("booking_profiles").select("id, slug");

  if (currentProfilesError) {
    return NextResponse.json({ error: "Profile konnten nach dem Import nicht gelesen werden.", details: currentProfilesError.message }, { status: 500 });
  }

  const profileIdByOldId = new Map<string, string>();
  const profileIdBySlug = new Map((currentProfiles || []).map((profile) => [profile.slug, profile.id]));

  for (const [oldId, slug] of importedProfileIdsBySlug) {
    const currentId = profileIdBySlug.get(slug);

    if (oldId && currentId) {
      profileIdByOldId.set(oldId, currentId);
    }
  }

  const bookingTypesWithProfileIds = bookingTypes.map((type) => {
    const importedType = (data.bookingTypes || []).find((row) => row.slug === type.slug);
    const oldProfileId = String(importedType?.profile_id || "");
    const profileId = oldProfileId ? profileIdByOldId.get(oldProfileId) || null : null;

    return {
      ...type,
      profile_id: profileId
    };
  });

  if (bookingTypesWithProfileIds.length > 0) {
    const { error } = await supabase.from("booking_types").upsert(bookingTypesWithProfileIds, { onConflict: "slug" });

    if (error) {
      return NextResponse.json({ error: "Terminarten konnten nicht importiert werden.", details: error.message }, { status: 500 });
    }
  }

  if (appSettings) {
    const { error } = await supabase.from("app_settings").upsert({ id: true, ...appSettings, updated_at: new Date().toISOString() }, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: "App-Einstellungen konnten nicht importiert werden.", details: error.message }, { status: 500 });
    }
  }

  const { data: currentBookingTypes, error: currentBookingTypesError } = await supabase.from("booking_types").select("id, slug");

  if (currentBookingTypesError) {
    return NextResponse.json({ error: "Terminarten konnten nach dem Import nicht gelesen werden.", details: currentBookingTypesError.message }, { status: 500 });
  }

  const bookingTypeIdByOldId = new Map<string, string>();
  const bookingTypeIdBySlug = new Map((currentBookingTypes || []).map((type) => [type.slug, type.id]));

  for (const [oldId, slug] of importedBookingTypeIdsBySlug) {
    const currentId = bookingTypeIdBySlug.get(slug);

    if (oldId && currentId) {
      bookingTypeIdByOldId.set(oldId, currentId);
    }
  }

  await supabase.from("booking_type_profiles").delete().neq("booking_type_id", "00000000-0000-0000-0000-000000000000");

  const assignments = (data.bookingTypeProfiles || [])
    .map((row) => ({
      booking_type_id: bookingTypeIdByOldId.get(String(row.booking_type_id || "")),
      profile_id: profileIdByOldId.get(String(row.profile_id || ""))
    }))
    .filter((row): row is { booking_type_id: string; profile_id: string } => Boolean(row.booking_type_id && row.profile_id));

  if (assignments.length > 0) {
    const { error } = await supabase.from("booking_type_profiles").insert(assignments);

    if (error) {
      return NextResponse.json({ error: "Terminarten-Zuordnungen konnten nicht importiert werden.", details: error.message }, { status: 500 });
    }
  }

  const replaceResult = await replaceTableData(supabase, "availability_rules", availabilityRules);

  if (replaceResult) {
    return replaceResult;
  }

  const blockedTimesResult = await replaceTableData(supabase, "blocked_times", blockedTimes);

  if (blockedTimesResult) {
    return blockedTimesResult;
  }

  const templatesResult = await replaceTableData(supabase, "booking_profile_templates", profileTemplates);

  if (templatesResult) {
    return templatesResult;
  }

  const calendarConnectionsResult = await replaceTableData(supabase, "calendar_connections", calendarConnections);

  if (calendarConnectionsResult) {
    return calendarConnectionsResult;
  }

  return NextResponse.json({ summary, imported: true });
}

function validateBackup(backup: BackupPayload | null | undefined) {
  if (!backup || backup.app !== "smart-booking" || backup.version !== 1 || !backup.data) {
    return { ok: false, error: "Die Datei ist keine gültige SMART Booking Sicherung." };
  }

  const arrays = ["profiles", "bookingTypes", "bookingTypeProfiles", "availabilityRules", "blockedTimes", "profileTemplates", "calendarConnections"] as const;

  for (const key of arrays) {
    if (backup.data[key] && !Array.isArray(backup.data[key])) {
      return { ok: false, error: `Der Bereich ${key} ist ungültig.` };
    }
  }

  return { ok: true };
}

function buildSummary(data: NonNullable<BackupPayload["data"]>) {
  return {
    profiles: data.profiles?.length || 0,
    bookingTypes: data.bookingTypes?.length || 0,
    bookingTypeProfiles: data.bookingTypeProfiles?.length || 0,
    availabilityRules: data.availabilityRules?.length || 0,
    blockedTimes: data.blockedTimes?.length || 0,
    profileTemplates: data.profileTemplates?.length || 0,
    calendarConnections: data.calendarConnections?.length || 0
  };
}

function sanitizeRows(rows: BackupRow[], columns: string[]) {
  return rows.map((row) => {
    const clean: BackupRow = {};

    for (const column of columns) {
      if (column in row) {
        clean[column] = row[column];
      }
    }

    return clean;
  });
}

async function replaceTableData(supabase: ReturnType<typeof createSupabaseAdmin>, table: string, rows: BackupRow[]) {
  const { error: deleteError } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    return NextResponse.json({ error: `${table} konnte nicht geleert werden.`, details: deleteError.message }, { status: 500 });
  }

  if (rows.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase.from(table).insert(rows);

  if (insertError) {
    return NextResponse.json({ error: `${table} konnte nicht importiert werden.`, details: insertError.message }, { status: 500 });
  }

  return null;
}
