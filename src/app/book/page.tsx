import Link from "next/link";
import { ArrowRight, CalendarCheck, MailCheck, ShieldCheck, Video } from "lucide-react";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { seedBookingTypes } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Termin buchen"
};

const highlights = [
  { icon: CalendarCheck, title: "Kalenderabgleich", text: "Freie Zeitfenster werden automatisch geprüft." },
  { icon: Video, title: "Zoom vorbereitet", text: "Bei Zoom-Terminen wird ein individueller Link erstellt." },
  { icon: MailCheck, title: "Bestätigung per E-Mail", text: "Kunde und Betreiber erhalten die Buchungsdaten." }
];

const steps = ["Terminart wählen", "Tag und Uhrzeit auswählen", "Daten bestätigen"];

export default async function BookPage() {
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
    types = data || [];
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-brand-600">SMART Booking</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
            Termin mit BuiltSmart AI buchen
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-950">Sicherer Buchungsablauf</p>
              <p className="text-sm leading-6 text-slate-500">Kalender, Formular und Bestätigung greifen serverseitig ineinander.</p>
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
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <item.icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Terminart auswählen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Alle Formate sind auf 30 Minuten ausgelegt.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            {steps.map((step, index) => (
              <span key={step} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {index + 1}. {step}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {types.map((type) => (
          <Link
            key={type.id}
            href={`/book/${type.slug}`}
            className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-3 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {type.duration_minutes} Minuten
                </p>
                <h3 className="text-lg font-semibold text-slate-950">{type.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
              </div>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-brand-600 transition group-hover:border-brand-500 group-hover:bg-brand-50">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
