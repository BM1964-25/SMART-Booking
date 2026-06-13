import { addDays } from "date-fns";
import Link from "next/link";
import { getAvailableSlots } from "@/lib/availability";
import { hasSupabaseConfig } from "@/lib/config";
import { formatGermanDate, formatGermanTime } from "@/lib/date";
import { demoSlots, findSeedBookingType } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SlotPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const isConfigured = hasSupabaseConfig();
  let bookingType: BookingType | null | undefined = findSeedBookingType(type);
  const from = new Date();
  const to = addDays(from, 21);

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("booking_types").select("*").eq("slug", type).single<BookingType>();
    bookingType = data;
  }

  const slots = bookingType ? (isConfigured ? await getAvailableSlots(type, from, to) : demoSlots(bookingType.duration_minutes)) : [];
  const grouped = groupByDay(slots);

  if (!bookingType) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Diese Terminart wurde nicht gefunden.</section>;
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{bookingType.duration_minutes} Minuten</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">{bookingType.name}</h1>
      <p className="mt-3 text-slate-600">Wählen Sie ein freies Zeitfenster. Alle Zeiten gelten für Europe/Berlin.</p>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Setup-Modus: Diese Zeitfenster sind Beispieldaten. Echte Slots werden erst nach Supabase- und Apple-CalDAV-Konfiguration berechnet.
        </div>
      ) : null}
      <div className="mt-8 space-y-6">
        {Object.entries(grouped).map(([day, daySlots]) => (
          <div key={day} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">{formatGermanDate(new Date(daySlots[0].startsAt))}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {daySlots.map((slot) => (
                <Link
                  key={slot.startsAt}
                  href={`/book/${type}/confirm?start=${encodeURIComponent(slot.startsAt)}`}
                  className="rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-800 transition hover:border-brand-500 hover:text-brand-700"
                >
                  {formatGermanTime(new Date(slot.startsAt))}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {slots.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-600">Aktuell sind keine freien Zeitfenster verfügbar.</p> : null}
      </div>
    </section>
  );
}

function groupByDay(slots: { startsAt: string; endsAt: string }[]) {
  return slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const key = slot.startsAt.slice(0, 10);
    acc[key] ||= [];
    acc[key].push(slot);
    return acc;
  }, {});
}
