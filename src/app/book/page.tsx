import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MailCheck,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Video,
  Youtube
} from "lucide-react";
import { XIcon, XingIcon } from "@/components/brand-icons";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { defaultBookingProfile, getBookingProfile } from "@/lib/profiles";
import { seedBookingTypes } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile, BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Termin buchen"
};

const highlights = [
  { icon: CalendarCheck, text: "Live-Kalenderabgleich" },
  { icon: Video, text: "Zoom-Link bei Online-Terminen" },
  { icon: MailCheck, text: "Bestätigung per E-Mail" }
];

const workflowSteps = ["Terminart wählen", "Tag und Uhrzeit auswählen", "Daten bestätigen"];

function getTypeIcon(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("demo") || lowerName.includes("ki")) {
    return Sparkles;
  }

  if (lowerName.includes("analyse")) {
    return SearchCheck;
  }

  if (lowerName.includes("bau") || lowerName.includes("immobilien")) {
    return Building2;
  }

  return CalendarCheck;
}

function getContactLinks(profile: BookingProfile) {
  return [
    profile.show_linkedin !== false && profile.linkedin_url ? { href: profile.linkedin_url, label: "LinkedIn", icon: Linkedin } : null,
    profile.show_xing !== false && profile.xing_url ? { href: profile.xing_url, label: "Xing", icon: XingIcon } : null,
    profile.show_x !== false && profile.x_url ? { href: profile.x_url, label: "X / Twitter", icon: XIcon } : null,
    profile.show_instagram !== false && profile.instagram_url ? { href: profile.instagram_url, label: "Instagram", icon: Instagram } : null,
    profile.show_facebook !== false && profile.facebook_url ? { href: profile.facebook_url, label: "Facebook", icon: Facebook } : null,
    profile.show_youtube !== false && profile.youtube_url ? { href: profile.youtube_url, label: "YouTube", icon: Youtube } : null,
    profile.show_contact_email !== false && profile.contact_email ? { href: `mailto:${profile.contact_email}`, label: "E-Mail", icon: Mail } : null,
    profile.show_website !== false && profile.website_url ? { href: profile.website_url, label: "Website", icon: Globe2 } : null,
    profile.show_contact_phone !== false && profile.contact_phone ? { href: `tel:${profile.contact_phone.replace(/\s+/g, "")}`, label: "Mobil anrufen", icon: Phone } : null
  ].filter(Boolean) as Array<{ href: string; label: string; icon: ComponentType<{ className?: string }> }>;
}

export default async function BookPage({ searchParams }: { searchParams?: Promise<{ profile?: string }> }) {
  const requestedProfile = (await searchParams)?.profile;
  const profile = await getBookingProfile(requestedProfile);
  const primaryColor = normalizeColor(profile.primary_color);
  const profileCardBgColor = normalizeColor(profile.profile_card_bg_color, "#F8FAFC");
  const bookingCardBgColor = normalizeColor(profile.booking_card_bg_color, "#FFFFFF");
  const portraitPositionX = clampNumber(profile.portrait_position_x, 0, 100, 50);
  const portraitPositionY = clampNumber(profile.portrait_position_y, 0, 100, 35);
  const portraitZoom = clampNumber(profile.portrait_zoom, 1, 1.8, 1);
  const showPortrait = profile.show_portrait !== false;
  const showSubheadline = profile.show_subheadline !== false;
  const showContactName = profile.show_contact_name !== false;
  const profileQuery = profile.slug === defaultBookingProfile.slug ? "" : `?profile=${encodeURIComponent(profile.slug)}`;
  const contactLinks = getContactLinks(profile);
  let types: BookingType[] = seedBookingTypes;
  const isConfigured = hasSupabaseConfig();

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("booking_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (profile.id !== defaultBookingProfile.id) {
      query = query.eq("profile_id", profile.id);
    } else {
      query = query.or(`profile_id.eq.${profile.id},profile_id.is.null`);
    }

    const { data } = await query.returns<BookingType[]>();
    types = data || [];
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-t-4 px-5 py-7 md:px-8 md:py-9" style={{ borderTopColor: primaryColor }}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase" style={{ color: primaryColor }}>
                  SMART Booking
                </p>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online buchbar
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
                {profile.headline}
              </h1>
              {showSubheadline ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{profile.subheadline}</p> : null}
            </div>
            {(showContactName && profile.contact_name) || (showPortrait && profile.portrait_url) || contactLinks.length > 0 ? (
              <div className="rounded-lg p-5 text-center ring-1 ring-slate-200 lg:w-80" style={{ backgroundColor: profileCardBgColor }}>
                {showPortrait && profile.portrait_url ? (
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200">
                    <img
                      src={profile.portrait_url}
                      alt={profile.contact_name || profile.name}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${portraitPositionX}% ${portraitPositionY}%`,
                        transform: `scale(${portraitZoom})`
                      }}
                    />
                  </div>
                ) : null}
                {showContactName && profile.contact_name ? <p className="mt-4 text-base font-semibold text-slate-950">{profile.contact_name}</p> : null}
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
        </div>
      </div>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Die Oberfläche läuft gerade im Setup-Modus mit Startdaten. Für echte Verfügbarkeiten und Buchungen fehlen noch:{" "}
          <span className="font-semibold">{missingSupabaseKeys().join(", ")}</span>.
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        {highlights.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <item.icon className="h-4 w-4 text-brand-600" />
            <span>{item.text}</span>
          </div>
        ))}
        <div className="hidden items-center gap-2 text-sm font-medium text-slate-500 lg:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Serverbasierte Prüfung
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Terminart auswählen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Wählen Sie das Format, das am besten zu Ihrem Anliegen passt.</p>
        </div>
        <p className="text-sm font-medium text-slate-500">Alle Formate: 30 Minuten</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {types.map((type) => {
          const TypeIcon = getTypeIcon(type.name);

          return (
            <Link
              key={type.id}
              href={`/book/${type.slug}${profileQuery}`}
              className="group rounded-lg border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderTopColor: primaryColor, backgroundColor: bookingCardBgColor }}
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50" style={{ color: primaryColor }}>
                      <TypeIcon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {type.duration_minutes} Minuten
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{type.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{type.description}</p>
                </div>
                <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition" style={{ backgroundColor: primaryColor }}>
                    Termin wählen
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
        Nach der Buchung erhalten Sie automatisch eine Bestätigung per E-Mail. Der Termin wird im Kalender eingetragen und ist danach verbindlich reserviert.
      </p>
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
