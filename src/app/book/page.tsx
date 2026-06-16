import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  Globe2,
  Mail,
  Phone,
} from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, SpotifyIcon, XIcon, XingIcon, YouTubeIcon } from "@/components/brand-icons";
import { BookingTypeCardLink } from "@/components/booking-type-card-link";
import { EmbedShellStyle } from "@/components/embed-shell-style";
import { getBookingTypeIdsForProfile } from "@/lib/booking-type-profiles";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { ContactIconKey, normalizeContactIconOrder } from "@/lib/contact-icon-order";
import { defaultBookingProfile, getBookingProfile } from "@/lib/profiles";
import { seedBookingTypes } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile, BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Termin buchen"
};

const workflowSteps = ["Gespräch auswählen", "Wunschtermin festlegen", "Buchung abschließen"];
const defaultPrivacyUrl = "https://www.built-smart-hub.com/datenschutz";
const defaultImprintUrl = "https://www.built-smart-hub.com/impressum";

function getContactLinks(profile: BookingProfile) {
  if (profile.show_contact_links === false) {
    return [];
  }

  const links: Partial<Record<ContactIconKey, { href: string; label: string; icon: ComponentType<{ className?: string }> }>> = {
    email: profile.show_contact_email !== false && profile.contact_email ? { href: `mailto:${profile.contact_email}`, label: "E-Mail", icon: Mail } : undefined,
    phone: profile.show_contact_phone !== false && profile.contact_phone ? { href: `tel:${profile.contact_phone.replace(/\s+/g, "")}`, label: "Mobil anrufen", icon: Phone } : undefined,
    website: profile.show_website !== false && profile.website_url ? { href: profile.website_url, label: "Website", icon: Globe2 } : undefined,
    linkedin: profile.show_linkedin !== false && profile.linkedin_url ? { href: profile.linkedin_url, label: "LinkedIn", icon: LinkedInIcon } : undefined,
    xing: profile.show_xing !== false && profile.xing_url ? { href: profile.xing_url, label: "Xing", icon: XingIcon } : undefined,
    x: profile.show_x !== false && profile.x_url ? { href: profile.x_url, label: "X / Twitter", icon: XIcon } : undefined,
    instagram: profile.show_instagram !== false && profile.instagram_url ? { href: profile.instagram_url, label: "Instagram", icon: InstagramIcon } : undefined,
    facebook: profile.show_facebook !== false && profile.facebook_url ? { href: profile.facebook_url, label: "Facebook", icon: FacebookIcon } : undefined,
    youtube: profile.show_youtube !== false && profile.youtube_url ? { href: profile.youtube_url, label: "YouTube", icon: YouTubeIcon } : undefined,
    spotify: profile.show_spotify !== false && profile.spotify_url ? { href: profile.spotify_url, label: "Spotify", icon: SpotifyIcon } : undefined
  };

  return normalizeContactIconOrder(profile.contact_icon_order).map((key) => links[key]).filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
}

export default async function BookPage({ searchParams }: { searchParams?: Promise<{ embed?: string; profile?: string; preview?: string; returnProfile?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const requestedProfile = resolvedSearchParams?.profile;
  const requestedEmbedView = resolvedSearchParams?.embed === "1";
  const isAdminPreview = resolvedSearchParams?.preview === "admin";
  const returnProfile = resolvedSearchParams?.returnProfile || "";
  const profile = await getBookingProfile(requestedProfile, { includeInactive: isAdminPreview });

  if (!profile) {
    notFound();
  }

  const isEmbedView = requestedEmbedView && profile.allow_embed_view === true;
  const primaryColor = normalizeColor(profile.primary_color);
  const profileCardBgColor = normalizeColor(profile.profile_card_bg_color, "#F8FAFC");
  const bookingCardBgColor = normalizeColor(profile.booking_card_bg_color, "#FFFFFF");
  const portraitPositionX = clampNumber(profile.portrait_position_x, 0, 100, 50);
  const portraitPositionY = clampNumber(profile.portrait_position_y, 0, 100, 35);
  const portraitZoom = clampNumber(profile.portrait_zoom, 1, 1.8, 1);
  const showPortrait = profile.show_portrait !== false;
  const showPreheadline = profile.show_preheadline !== false;
  const showSubheadline = profile.show_subheadline !== false;
  const showHighlightSubheadline = profile.show_highlight_subheadline === true;
  const showWorkflowSteps = profile.show_workflow_steps !== false;
  const showPortraitDisplayName = profile.show_portrait_display_name !== false;
  const showPortraitInfo = profile.show_portrait_info === true;
  const portraitDisplayName = profile.portrait_display_name || profile.contact_name;
  const preheadline = profile.preheadline || "SMART Booking";
  const isCenteredLayout = profile.profile_layout === "centered";
  const legalLinks = [
    profile.show_legal_privacy !== false ? { href: profile.legal_privacy_url || defaultPrivacyUrl, label: "Datenschutz" } : null,
    profile.show_legal_imprint !== false ? { href: profile.legal_imprint_url || defaultImprintUrl, label: "Impressum" } : null
  ].filter(Boolean) as Array<{ href: string; label: string }>;
  const bookingQueryParams = new URLSearchParams();

  if (profile.slug !== defaultBookingProfile.slug) {
    bookingQueryParams.set("profile", profile.slug);
  }

  if (isEmbedView) {
    bookingQueryParams.set("embed", "1");
  }

  const profileQuery = bookingQueryParams.toString() ? `?${bookingQueryParams.toString()}` : "";
  const contactLinks = getContactLinks(profile);
  const hasContactCard =
    (showPortraitDisplayName && portraitDisplayName) ||
    (showPortraitInfo && profile.portrait_info) ||
    (showPortrait && profile.portrait_url) ||
    contactLinks.length > 0;
  let types: BookingType[] = seedBookingTypes;
  const isConfigured = hasSupabaseConfig();

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from("booking_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .returns<BookingType[]>();
    const profileTypeIds = await getBookingTypeIdsForProfile(profile.id);
    const allTypes = data || [];

    types = allTypes.filter((type) => type.profile_id === profile.id || (!type.profile_id && profileTypeIds?.has(type.id)));
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      {isEmbedView ? <EmbedShellStyle /> : null}
      {isAdminPreview ? (
        <div className="mb-4 flex justify-end">
          <Link
            href={returnProfile ? `/admin/profiles?profile=${encodeURIComponent(returnProfile)}` : "/admin/profiles"}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Adminbereich
          </Link>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-t-4 px-5 py-7 md:px-8 md:py-9" style={{ borderTopColor: primaryColor }}>
          <div className={isCenteredLayout ? "flex flex-col items-center gap-7 text-center" : "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"}>
            <div className={isCenteredLayout ? "mx-auto max-w-4xl" : "max-w-3xl"}>
              <div className={isCenteredLayout ? "flex flex-wrap items-center justify-center gap-3" : "flex flex-wrap items-center gap-3"}>
                {showPreheadline && preheadline ? (
                  <p className="text-sm font-semibold uppercase" style={{ color: primaryColor }}>
                    {preheadline}
                  </p>
                ) : null}
              </div>
              <h1 className={isCenteredLayout ? "mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl" : "mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl"}>
                {profile.headline}
              </h1>
              {showHighlightSubheadline && profile.highlight_subheadline ? (
                <p className={isCenteredLayout ? "mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-900" : "mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-900"}>
                  {profile.highlight_subheadline}
                </p>
              ) : null}
              {showSubheadline ? (
                <p className={isCenteredLayout ? "mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-600" : "mt-3 max-w-2xl text-base leading-7 text-slate-600"}>
                  {profile.subheadline}
                </p>
              ) : null}
            </div>
            {hasContactCard ? (
              <div
                className={isCenteredLayout ? "w-full max-w-2xl rounded-lg p-5 text-center ring-1 ring-slate-200" : "rounded-lg p-5 text-center ring-1 ring-slate-200 lg:w-80"}
                style={{ backgroundColor: profileCardBgColor }}
              >
                {showPortrait && profile.portrait_url ? (
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200">
                    <img
                      src={profile.portrait_url}
                      alt={portraitDisplayName || profile.contact_name || profile.name}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${portraitPositionX}% ${portraitPositionY}%`,
                        transform: `scale(${portraitZoom})`
                      }}
                    />
                  </div>
                ) : null}
                {showPortraitDisplayName && portraitDisplayName ? <p className="mt-4 text-base font-semibold text-slate-950">{portraitDisplayName}</p> : null}
                {showPortraitInfo && profile.portrait_info ? <p className="mt-1 text-sm leading-6 text-slate-500">{profile.portrait_info}</p> : null}
                {contactLinks.length > 0 ? (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {contactLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        aria-label={item.label}
                        title={item.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {showWorkflowSteps ? (
            <div className="mt-8 border-t border-slate-100 pt-7">
              <div className="relative grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                <div className="absolute left-[16.666%] right-[16.666%] top-[1.75rem] z-0 hidden h-0.5 rounded-full bg-slate-300 md:block" />
                  {workflowSteps.map((step, index) => (
                  <div key={step} className="relative z-10 flex flex-col items-center text-center">
                    <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-base font-bold shadow-sm" style={{ color: primaryColor }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-3 text-sm font-semibold text-slate-950">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Die Oberfläche läuft gerade im Setup-Modus mit Startdaten. Für echte Verfügbarkeiten und Buchungen fehlen noch:{" "}
          <span className="font-semibold">{missingSupabaseKeys().join(", ")}</span>.
        </div>
      ) : null}
      <div className="mt-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Terminart auswählen</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Wählen Sie die gewünschte Gesprächsart aus und reservieren Sie Ihr persönliches Zeitfenster.
            <br />
            Die Terminbestätigung erhalten Sie unmittelbar nach der Buchung.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {types.map((type) => (
          <BookingTypeCardLink
            key={type.id}
            href={`/book/${type.slug}${profileQuery}`}
            name={type.name}
            description={type.description}
            durationMinutes={type.duration_minutes}
            primaryColor={primaryColor}
            cardBackgroundColor={bookingCardBgColor}
          />
        ))}
      </div>
      {legalLinks.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
          {legalLinks.map((link, index) => (
            <span key={link.href} className="inline-flex items-center gap-3">
              {index > 0 ? <span className="text-slate-300">|</span> : null}
              <Link href={link.href} target="_blank" rel="noreferrer" className="hover:text-brand-600">
                {link.label}
              </Link>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function normalizeColor(value: string | null | undefined, fallback = "#527DF6") {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function clampNumber(value: number | string | null | undefined, min: number, max: number, fallback: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}
