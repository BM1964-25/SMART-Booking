import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Globe2 } from "lucide-react";
import Link from "next/link";

import { PrimaryLink } from "@/components/button";

const landingPageUrl = "https://www.builtsmart-ai.app/smartbooking/index.html";

const highlights = [
  {
    icon: Globe2,
    title: "Buchungsseiten für bis zu 4 Webseiten",
    text: "Eigene Profile, Texte, Farben und Terminangebote für unterschiedliche Webseiten oder Landingpages."
  },
  {
    icon: CalendarCheck,
    title: "Kalenderabgleich gegen Doppelbuchungen",
    text: "Nur freie Zeitfenster werden angeboten. Pufferzeiten und Verfügbarkeiten bleiben zentral steuerbar."
  },
  {
    icon: BellRing,
    title: "Bestätigungen und Erinnerungen automatisch",
    text: "Kunden erhalten Kalendereintrag, Meeting-Details und persönliche Erinnerungen ohne manuelle Nacharbeit."
  }
];

const essentials = [
  "Öffentliche Buchungslinks für Kunden und Interessenten",
  "Telefon, Zoom, Google Meet, Microsoft Teams, Ortstermin oder individuelle Abstimmung",
  "Zentrale Verwaltung von Buchungen, Profilen, Terminarten und Einstellungen"
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase text-brand-700">
                SMART Booking
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Produkt von BuiltSmart AI
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              Die kompakte Terminplattform für professionelle Kundengespräche.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              SMART Booking verbindet Buchungsseiten, Kalenderabgleich, Meeting-Details, Bestätigungen und Erinnerungen in einem klaren System.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryLink href="/book">Buchungsseite öffnen</PrimaryLink>
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                Adminbereich öffnen
              </Link>
              <a
                href={landingPageUrl}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mehr zur App <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-subtle">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase text-brand-600">Livebetrieb</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Terminprozess in einem System</h2>
              <div className="mt-5 space-y-3">
                {essentials.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-600">Highlights</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Das Wesentliche auf einen Blick.</h2>
          </div>
          <a href={landingPageUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ausführliche Landingpage ansehen <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-600">Nächster Schritt</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Buchungsprozess testen oder Details ansehen.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href="/book">Zur Buchungsseite</PrimaryLink>
            <a
              href={landingPageUrl}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
            >
              Landingpage öffnen <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
