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

const workflowSteps = ["Terminart", "Zeitfenster", "Kontaktdaten", "Bestätigung"];

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
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-t-4 border-brand-600 px-5 py-7 md:px-8 md:py-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase text-brand-600">SMART Booking</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online buchbar
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
                Termin mit BuiltSmart AI buchen
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 lg:w-80">
              <p className="text-sm font-semibold text-slate-950">Sicherer Ablauf</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Die Verfügbarkeit wird live geprüft. Nach der Buchung erhalten alle Beteiligten eine Bestätigung.</p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-7">
            <div className="relative grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
              <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-brand-300 via-sky-300 to-emerald-300 md:block" />
              {workflowSteps.map((step, index) => (
                <div key={step} className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-bold text-brand-700 shadow-sm">
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
              href={`/book/${type.slug}`}
              className="group rounded-lg border border-slate-200 border-t-brand-500 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                      <TypeIcon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {type.duration_minutes} Minuten
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{type.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{type.description}</p>
                  <p className="mt-4 text-sm font-medium text-slate-500">Freie Zeiten werden im nächsten Schritt angezeigt.</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-500">Nächster Schritt: Uhrzeit wählen</span>
                  <span className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-700">
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
