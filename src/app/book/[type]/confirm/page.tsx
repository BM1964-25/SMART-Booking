import { addMinutes } from "date-fns";
import Link from "next/link";
import { BookingForm } from "@/components/booking-form";
import { hasSupabaseConfig } from "@/lib/config";
import { buildSlotLabel } from "@/lib/date";
import { findSeedBookingType } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({
  params,
  searchParams
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { type } = await params;
  const { start } = await searchParams;
  const isConfigured = hasSupabaseConfig();
  let bookingType: BookingType | null | undefined = findSeedBookingType(type);

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("booking_types").select("*").eq("slug", type).single<BookingType>();
    bookingType = data;
  }

  if (!bookingType || !start) {
    return <section className="mx-auto max-w-3xl px-5 py-12">Der gewählte Termin konnte nicht geladen werden.</section>;
  }

  const startsAt = new Date(start);
  const endsAt = addMinutes(startsAt, bookingType.duration_minutes);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Termin bestätigen</h1>
      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Ausgewählter Termin</p>
          <p className="mt-1 font-semibold text-slate-950">{bookingType.name}</p>
          <p className="mt-1 text-slate-700">{buildSlotLabel(startsAt, endsAt)}</p>
        </div>
        <Link
          href={`/book/${type}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Zurück zur Terminauswahl
        </Link>
      </div>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Setup-Modus: Das Formular ist sichtbar, aber echte Buchungen werden erst nach Supabase-, Resend- und Apple-CalDAV-Konfiguration gespeichert und versendet.
        </div>
      ) : null}
      {isConfigured ? (
        <BookingForm bookingTypeSlug={type} startsAt={startsAt.toISOString()} />
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
    </section>
  );
}
