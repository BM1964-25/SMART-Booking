import { addDays, getDay, startOfWeek } from "date-fns";
import { DaySlotPicker } from "@/components/day-slot-picker";
import { getAvailableSlots } from "@/lib/availability";
import { hasSupabaseConfig } from "@/lib/config";
import { htmlDateValue } from "@/lib/date";
import { demoSlots, findSeedBookingType } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SlotPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const isConfigured = hasSupabaseConfig();
  let bookingType: BookingType | null | undefined = findSeedBookingType(type);
  const from = new Date();
  const previewDays = 28;
  const pickerStart = buildPickerStartDate(from);
  const to = addDays(from, previewDays);

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("booking_types").select("*").eq("slug", type).single<BookingType>();
    bookingType = data;
  }

  const slots = bookingType ? (isConfigured ? await getAvailableSlots(type, from, to) : demoSlots(bookingType.duration_minutes)) : [];
  const days = buildPickerDays(pickerStart, previewDays);
  const grouped = groupByDay(slots);

  if (!bookingType) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Diese Terminart wurde nicht gefunden.</section>;
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{bookingType.duration_minutes} Minuten</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">{bookingType.name}</h1>
      <p className="mt-3 text-slate-600">Wählen Sie zuerst einen Tag und anschließend eine freie Uhrzeit. Termine sind maximal 4 Wochen im Voraus buchbar.</p>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Setup-Modus: Diese Zeitfenster sind Beispieldaten. Echte Slots werden erst nach Supabase- und Apple-CalDAV-Konfiguration berechnet.
        </div>
      ) : null}
      {slots.length > 0 ? (
        <DaySlotPicker bookingTypeSlug={type} days={days} groupedSlots={grouped} />
      ) : (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-slate-600">Aktuell sind keine freien Zeitfenster verfügbar.</p>
      )}
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
