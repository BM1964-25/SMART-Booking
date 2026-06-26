import { addMinutes } from "date-fns";
import Link from "next/link";
import { BookingLegalFooter } from "@/components/booking-legal-footer";
import { BookingForm } from "@/components/booking-form";
import { EmbedShellStyle } from "@/components/embed-shell-style";
import { ProfilePreheadlineLink } from "@/components/profile-preheadline-link";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { getBookingTypeIdsForProfile } from "@/lib/booking-type-profiles";
import { hasSupabaseConfig } from "@/lib/config";
import { buildSlotLabel } from "@/lib/date";
import type { MeetingLocation } from "@/lib/meeting-location";
import { getBookingProfile } from "@/lib/profiles";
import { findSeedBookingType } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ embed?: string; start?: string; profile?: string }>;
}) {
  const { type } = await params;
  const { embed, start, profile: profileSlug } = await searchParams;
  const profile = await getBookingProfile(profileSlug);

  if (!profile) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Dieses Profil ist nicht öffentlich verfügbar.</section>;
  }

  const isEmbedView = embed === "1" && profile.allow_embed_view === true;
  const primaryColor = normalizeColor(profile.primary_color);
  const isConfigured = hasSupabaseConfig();
  let bookingType: BookingType | null | undefined = findSeedBookingType(type);

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("booking_types").select("*").eq("slug", type).eq("is_active", true).single<BookingType>();
    const profileTypeIds = await getBookingTypeIdsForProfile(profile.id);
    const belongsToProfile = Boolean(data && (data.profile_id === profile.id || (!data.profile_id && profileTypeIds?.has(data.id))));
    bookingType = data && belongsToProfile ? data : null;
  }

  if (!bookingType || !start) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Der gewählte Termin konnte nicht geladen werden.</section>;
  }

  const startsAt = new Date(start);
  const endsAt = addMinutes(startsAt, bookingType.duration_minutes);
  const availableMeetingLocations: MeetingLocation[] = isConfigured ? await getAvailableMeetingLocations() : ["phone", "onsite", "individual"];

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      {isEmbedView ? <EmbedShellStyle /> : null}
      <ProfilePreheadlineLink profile={profile} color={primaryColor} />
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">Termin bestätigen</h1>
      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Ausgewählter Termin</p>
          <p className="mt-1 font-semibold text-slate-950">{bookingType.name}</p>
          <p className="mt-1 text-slate-700">{buildSlotLabel(startsAt, endsAt)}</p>
        </div>
        <Link
          href={`/book/${type}${buildBackLinkQuery(profileSlug, isEmbedView)}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Zurück zur Terminauswahl
        </Link>
      </div>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Setup-Modus: Das Formular ist sichtbar, aber echte Buchungen werden erst nach Supabase-, Brevo-SMTP- und Apple-CalDAV-Konfiguration gespeichert und versendet.
        </div>
      ) : null}
      {isConfigured ? (
        <BookingForm
          bookingTypeSlug={type}
          defaultMeetingLocation={bookingType.default_meeting_location || "phone"}
          embedView={isEmbedView}
          availableMeetingLocations={availableMeetingLocations}
          profileSlug={profileSlug}
          startsAt={startsAt.toISOString()}
        />
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
          >
            Buchung nach Konfiguration aktiv
          </button>
        </div>
      )}
      <BookingLegalFooter embedView={isEmbedView} profile={profile} />
    </section>
  );
}

function buildBackLinkQuery(profileSlug: string | undefined, embedView: boolean) {
  const params = new URLSearchParams();

  if (profileSlug) {
    params.set("profile", profileSlug);
  }

  if (embedView) {
    params.set("embed", "1");
  }

  return params.toString() ? `?${params.toString()}` : "";
}

async function getAvailableMeetingLocations(): Promise<MeetingLocation[]> {
  const settings = await getEffectiveAppSettings();
  const locations = new Set<MeetingLocation>(["phone", "onsite", "individual"]);

  if (settings.zoomMeetingUrl || (settings.zoomMeetingMode === "api" && settings.zoomAccountId && settings.zoomClientId && settings.zoomClientSecret)) {
    locations.add("zoom");
  }

  if (settings.googleMeetingMode === "fixed_link" && settings.googleMeetUrl) {
    locations.add("google_meet");
  }

  if (
    settings.googleMeetingMode === "api" &&
    settings.activeCalendarProvider === "google" &&
    settings.googleClientId &&
    settings.googleClientSecret &&
    (await hasActiveOauthConnection("google"))
  ) {
    locations.add("google_meet");
  }

  if (settings.teamsMeetingMode === "fixed_link" && settings.teamsMeetingUrl) {
    locations.add("teams");
  }

  if (
    settings.teamsMeetingMode === "api" &&
    settings.activeCalendarProvider === "microsoft" &&
    settings.microsoftClientId &&
    settings.microsoftClientSecret &&
    (await hasActiveOauthConnection("microsoft"))
  ) {
    locations.add("teams");
  }

  return Array.from(locations);
}

async function hasActiveOauthConnection(provider: "google" | "microsoft") {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("calendar_oauth_connections")
    .select("id")
    .eq("provider", provider)
    .eq("is_active", true)
    .maybeSingle();

  return Boolean(data);
}

function normalizeColor(value: string | null | undefined, fallback = "#527DF6") {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}
