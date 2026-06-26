import { addDays, getDay, startOfWeek } from "date-fns";
import { BookingLegalFooter } from "@/components/booking-legal-footer";
import { DaySlotPicker } from "@/components/day-slot-picker";
import { EmbedShellStyle } from "@/components/embed-shell-style";
import { getAvailableSlots } from "@/lib/availability";
import { formatBookingWindowLabel, getEffectiveAppSettings } from "@/lib/app-settings";
import { getBookingTypeIdsForProfile } from "@/lib/booking-type-profiles";
import { hasSupabaseConfig } from "@/lib/config";
import { htmlDateValue } from "@/lib/date";
import { getBookingProfile } from "@/lib/profiles";
import { demoSlots, findSeedBookingType } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SlotPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>;
  searchParams?: Promise<{ embed?: string; profile?: string }>;
}) {
  const { type } = await params;
  const { embed, profile: profileSlug } = (await searchParams) || {};
  const profile = await getBookingProfile(profileSlug);

  if (!profile) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Dieses Profil ist nicht öffentlich verfügbar.</section>;
  }

  const isEmbedView = embed === "1" && profile.allow_embed_view === true;
  const isConfigured = hasSupabaseConfig();
  const appSettings = isConfigured ? await getEffectiveAppSettings() : null;
  let bookingType: BookingType | null | undefined = findSeedBookingType(type);
  const from = new Date();
  const previewDays = appSettings?.bookingWindowDays || 28;
  const bookingWindowLabel = formatBookingWindowLabel(previewDays);
  const pickerStart = buildPickerStartDate(from);
  const to = addDays(from, previewDays);
  let availabilityError: string | null = null;

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("booking_types").select("*").eq("slug", type).eq("is_active", true).single<BookingType>();
    const profileTypeIds = await getBookingTypeIdsForProfile(profile.id);
    const belongsToProfile = Boolean(data && (data.profile_id === profile.id || (!data.profile_id && profileTypeIds?.has(data.id))));
    bookingType = data && belongsToProfile ? data : null;
  }

  let slots: { startsAt: string; endsAt: string }[] = [];

  if (bookingType) {
    if (isConfigured) {
      try {
        slots = await getAvailableSlots(type, from, to);
      } catch (error) {
        availabilityError = error instanceof Error ? error.message : "Verfügbarkeiten konnten nicht geladen werden.";
      }
    } else {
      slots = demoSlots(bookingType.duration_minutes);
    }
  }

  const days = buildPickerDays(pickerStart, previewDays);
  const grouped = groupByDay(slots);

  if (!bookingType) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Diese Terminart wurde nicht gefunden.</section>;
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      {isEmbedView ? <EmbedShellStyle /> : null}
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{bookingType.duration_minutes} Minuten</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">{bookingType.name}</h1>
      <p className="mt-3 text-slate-600">Wählen Sie zuerst einen Tag und anschließend eine freie Uhrzeit. Termine sind maximal {bookingWindowLabel} im Voraus buchbar.</p>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Setup-Modus: Diese Zeitfenster sind Beispieldaten. Echte Slots werden erst nach Supabase- und Apple-CalDAV-Konfiguration berechnet.
        </div>
      ) : null}
      {availabilityError ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {formatAvailabilityError(availabilityError)}
        </div>
      ) : null}
      {slots.length > 0 ? (
        <DaySlotPicker bookingTypeSlug={type} embedView={isEmbedView} profileSlug={profileSlug} days={days} groupedSlots={grouped} bookingWindowLabel={bookingWindowLabel} />
      ) : (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-slate-600">Aktuell sind keine freien Zeitfenster verfügbar.</p>
      )}
      <BookingLegalFooter embedView={isEmbedView} profile={profile} />
    </section>
  );
}

function buildPickerDays(from: Date, count: number) {
  return Array.from({ length: count }, (_, index) => htmlDateValue(addDays(from, index)));
}

function buildPickerStartDate(from: Date) {
  const weekday = getDay(from);

  if (weekday === 6) {
    return addDays(from, 2);
  }

  if (weekday === 0) {
    return addDays(from, 1);
  }

  return startOfWeek(from, { weekStartsOn: 1 });
}

function groupByDay(slots: { startsAt: string; endsAt: string }[]) {
  return slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const key = htmlDateValue(new Date(slot.startsAt));
    acc[key] ||= [];
    acc[key].push(slot);
    return acc;
  }, {});
}

function formatAvailabilityError(error: string) {
  if (error.includes("Google Kalender muss neu verbunden werden")) {
    return "Der Google-Kalenderzugang muss neu verbunden werden. Bitte prüfen Sie im Adminbereich Kalender & Meetings die Google-Verbindung.";
  }

  if (error.includes("Kein Google Kalender")) {
    return "Für Google Kalender ist noch kein Buchungs- oder Abgleichkalender gespeichert. Bitte wählen Sie im Adminbereich Kalender & Meetings einen Google-Kalender aus.";
  }

  return "Der Kalenderabgleich konnte gerade nicht vollständig geprüft werden. Bitte versuchen Sie es später erneut oder wenden Sie sich direkt an den Anbieter.";
}
