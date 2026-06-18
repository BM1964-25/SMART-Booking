import { getEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type AppSettings = {
  active_calendar_provider: "apple" | "google" | "microsoft" | null;
  booking_owner_email: string | null;
  google_meeting_mode: "fixed_link" | "api" | null;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_meet_url: string | null;
  mail_from: string | null;
  microsoft_client_id: string | null;
  microsoft_client_secret: string | null;
  onsite_meeting_url: string | null;
  smtp_host: string | null;
  smtp_password: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  teams_meeting_mode: "fixed_link" | "api" | null;
  teams_meeting_url: string | null;
  zoom_account_id: string | null;
  zoom_client_id: string | null;
  zoom_client_secret: string | null;
  zoom_meeting_mode: "fixed_link" | "api" | null;
  zoom_meeting_url: string | null;
};

export type EffectiveAppSettings = {
  activeCalendarProvider: "apple" | "google" | "microsoft";
  bookingOwnerEmail?: string;
  googleMeetingMode: "fixed_link" | "api";
  googleClientId?: string;
  googleClientSecret?: string;
  googleMeetUrl?: string;
  mailFrom?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  onsiteMeetingUrl?: string;
  smtpHost?: string;
  smtpPassword?: string;
  smtpPort?: number;
  smtpUser?: string;
  teamsMeetingMode: "fixed_link" | "api";
  teamsMeetingUrl?: string;
  zoomAccountId?: string;
  zoomClientId?: string;
  zoomClientSecret?: string;
  zoomMeetingMode: "fixed_link" | "api";
  zoomMeetingUrl?: string;
};

export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle<AppSettings>();

  if (error) {
    if (isMissingAppSettingsError(error.message)) {
      return null;
    }

    throw error;
  }

  return data || null;
}

export async function getEffectiveAppSettings(): Promise<EffectiveAppSettings> {
  const env = getEnv();
  const settings = await getAppSettings();

  return {
    activeCalendarProvider: normalizeCalendarProvider(settings?.active_calendar_provider),
    bookingOwnerEmail: firstValue(settings?.booking_owner_email, env.BOOKING_OWNER_EMAIL),
    googleMeetingMode: normalizeMeetingMode(settings?.google_meeting_mode),
    googleClientId: firstValue(settings?.google_client_id, env.GOOGLE_CLIENT_ID),
    googleClientSecret: firstValue(settings?.google_client_secret, env.GOOGLE_CLIENT_SECRET),
    googleMeetUrl: firstValue(settings?.google_meet_url, env.GOOGLE_MEET_URL),
    mailFrom: firstValue(settings?.mail_from, env.MAIL_FROM),
    microsoftClientId: firstValue(settings?.microsoft_client_id, env.MICROSOFT_CLIENT_ID),
    microsoftClientSecret: firstValue(settings?.microsoft_client_secret, env.MICROSOFT_CLIENT_SECRET),
    onsiteMeetingUrl: firstValue(settings?.onsite_meeting_url, env.ONSITE_MEETING_URL),
    smtpHost: firstValue(settings?.smtp_host, env.SMTP_HOST, "smtp-relay.brevo.com"),
    smtpPassword: firstValue(settings?.smtp_password, env.SMTP_PASSWORD),
    smtpPort: settings?.smtp_port || env.SMTP_PORT || 587,
    smtpUser: firstValue(settings?.smtp_user, env.SMTP_USER),
    teamsMeetingMode: normalizeMeetingMode(settings?.teams_meeting_mode),
    teamsMeetingUrl: firstValue(settings?.teams_meeting_url, env.TEAMS_MEETING_URL),
    zoomAccountId: firstValue(settings?.zoom_account_id, env.ZOOM_ACCOUNT_ID),
    zoomClientId: firstValue(settings?.zoom_client_id, env.ZOOM_CLIENT_ID),
    zoomClientSecret: firstValue(settings?.zoom_client_secret, env.ZOOM_CLIENT_SECRET),
    zoomMeetingMode: normalizeMeetingMode(settings?.zoom_meeting_mode),
    zoomMeetingUrl: firstValue(settings?.zoom_meeting_url, env.ZOOM_MEETING_URL)
  };
}

export async function saveAppSettings(input: Partial<AppSettings>) {
  const supabase = createSupabaseAdmin();
  return supabase.from("app_settings").upsert(
    {
      id: true,
      ...input,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
}

export function isMissingAppSettingsError(message: string) {
  return message.includes("app_settings") || message.includes("schema cache");
}

function firstValue(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

function normalizeCalendarProvider(value: string | null | undefined): "apple" | "google" | "microsoft" {
  return value === "google" || value === "microsoft" ? value : "apple";
}

function normalizeMeetingMode(value: string | null | undefined): "fixed_link" | "api" {
  return value === "api" ? "api" : "fixed_link";
}
