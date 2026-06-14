import Link from "next/link";
import { ArrowRight, Building2, CalendarCheck, MailCheck, SearchCheck, ShieldCheck, Sparkles, Video } from "lucide-react";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { seedBookingTypes } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Termin buchen"
};

const highlights = [
  { icon: CalendarCheck, text: "Live-Kalenderabgleich" },
  { icon: Video, text: "Zoom-Link bei Online-Terminen" },
  { icon: MailCheck, text: "Bestätigung per E-Mail" }
];

const steps = ["Terminart wählen", "Tag und Uhrzeit auswählen", "Daten bestätigen"];

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
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase text-brand-600">SMART Booking</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          Termin mit BuiltSmart AI buchen
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.
        </p>
      </div>
      <div className="mt-7 flex flex-col gap-3 border-y border-slate-200 py-4 text-sm font-medium text-slate-600 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {index + 1}
              </span>
              {step}
            </span>
          ))}
        </div>
        <div className="inline-flex items-center gap-2 text-slate-500">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          Serverbasierte Prüfung und Bestätigung
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
              href={`/book/${type.slug}`}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                      <TypeIcon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {type.duration_minutes} Minuten
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{type.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{type.description}</p>
                  <p className="mt-4 text-sm font-medium text-slate-500">Freie Zeiten werden im nächsten Schritt angezeigt.</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-brand-700">Termin wählen</span>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-brand-600 transition group-hover:border-brand-500 group-hover:bg-brand-50">
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
