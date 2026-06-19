import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  FileCheck2,
  LayoutDashboard,
  MailCheck,
  MapPin,
  Phone,
  Sparkles,
  UserRoundCog,
  Video
} from "lucide-react";
import Link from "next/link";

import { PrimaryLink } from "@/components/button";

const proofPoints = [
  { value: "4", label: "Webseiten oder Profile" },
  { value: "frei", label: "Terminarten und Dauer" },
  { value: "flexibel", label: "Ort und Meetingart" }
];

const bookingTypes = [
  ["Individuelle Terminangebote", "Terminname, Beschreibung, Dauer und Darstellung können flexibel an Ihre Anforderungen angepasst werden."],
  ["Flexible Angebotsstruktur", "Jedes Buchungsprofil kann mehrere Terminarten mit eigenen Informationen und Abläufen bereitstellen."],
  ["Freie Wahl der Gesprächsform", "Telefontermin, Online-Meeting, Vor-Ort-Termin oder individuelle Abstimmung können je Terminart definiert werden."]
];

const features = [
  // Source-level deployment marker: embedded smartbooking landing page refreshed.
  {
    icon: CalendarCheck,
    title: "Automatische Verfügbarkeitsprüfung",
    text: "SMART Booking gleicht freie Zeitfenster mit Ihren angebundenen Kalendern ab und verhindert Terminüberschneidungen bereits während der Buchung."
  },
  {
    icon: UserRoundCog,
    title: "Mehrere Buchungsprofile verwalten",
    text: "Betreiben Sie unterschiedliche Buchungsseiten für bis zu vier Webseiten, Standorte oder Ansprechpartner innerhalb einer zentralen Plattform."
  },
  {
    icon: Video,
    title: "Terminangebote individuell gestalten",
    text: "Dauer, Beschreibung, Pufferzeiten, Reihenfolge, Sichtbarkeit und Gesprächsform können flexibel konfiguriert werden."
  },
  {
    icon: MailCheck,
    title: "Automatisierte Kommunikation",
    text: "Interessenten erhalten unmittelbar nach der Buchung eine professionelle Bestätigung inklusive Kalendereintrag, Meeting-Link und Verwaltungsoptionen."
  },
  {
    icon: LayoutDashboard,
    title: "Zentrale Steuerung",
    text: "Verwalten Sie Buchungen, Kalenderanbindungen, Meeting-Dienste, Buchungsprofile und Systemeinstellungen komfortabel an einem Ort."
  },
  {
    icon: DatabaseBackup,
    title: "Konfigurationen sichern und übertragen",
    text: "Einstellungen und Buchungsprofile können exportiert und bei Bedarf auf anderen Installationen wiederverwendet werden."
  }
];

const integrationRows = [
  ["Apple / iCloud", "Produktiv nutzbar", "Neue Buchungen werden automatisch in den definierten Kalender übernommen und bei der Verfügbarkeitsprüfung berücksichtigt."],
  ["Google Kalender", "Produktiv nutzbar", "Kalenderabgleich, Terminverwaltung und Google Meet können über die Google-Schnittstellen automatisiert genutzt werden."],
  ["Microsoft 365 / Outlook", "Ausbau vorbereitet", "Die Integration von Outlook, Microsoft 365 und Teams kann flexibel eingebunden und erweitert werden."]
];

const meetingModes = [
  { icon: Phone, title: "Telefon", text: "Kunden werden angerufen." },
  { icon: Video, title: "Zoom", text: "Fester Link oder API-Link je Buchung." },
  { icon: Video, title: "Google Meet", text: "Fester Link oder API bei aktivem Google-Kalender." },
  { icon: Video, title: "Microsoft Teams", text: "Fester Teams-Link, Microsoft-Ausbau vorbereitet." },
  { icon: MapPin, title: "Ortstermin", text: "Adresse oder Treffpunkt kann vorbereitet werden." },
  { icon: Sparkles, title: "Individuell", text: "Details werden nach der Buchung abgestimmt." }
];

const processSteps = [
  { icon: Sparkles, title: "Terminart auswählen", text: "Interessenten wählen eine frei konfigurierte Terminart auf der passenden Webseite." },
  { icon: Clock3, title: "Zeitfenster sichern", text: "Nur verfügbare Termine werden angeboten. Pufferzeiten werden berücksichtigt." },
  { icon: FileCheck2, title: "Buchung bestätigen", text: "E-Mail, Kalenderdatei, Meeting-Link und Verwaltungslinks werden erzeugt." }
];

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:py-14">
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
              Die zentrale Terminplattform für Beratung, Vertrieb und Kundengespräche.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Verbinden Sie öffentliche Buchungsseiten, Kalenderabgleich, Meeting-Links und automatisierte Terminbestätigungen in einer einzigen Lösung.
              Verwalten Sie bis zu vier Webseiten, Standorte oder Ansprechpartner zentral und bieten Sie Ihren Interessenten eine professionelle Buchungserfahrung.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PrimaryLink href="/book">Buchungsseite ansehen</PrimaryLink>
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                Adminbereich öffnen
              </Link>
            </div>
            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              {proofPoints.map((item) => (
                <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                  <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mx-auto mt-1 max-w-28 text-xs font-medium uppercase leading-5 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-subtle">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-600">Live-Buchungsseite</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Konfigurierbare Terminangebote</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">online</span>
              </div>
              <div className="mt-5 space-y-3">
                {bookingTypes.map(([title, description]) => (
                  <div key={title} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-sm text-slate-600">{description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">Dauer frei</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Automatischer Verfügbarkeitsabgleich", "freie Zeiten statt Doppelbuchung"],
                  ["Professionelle Terminbestätigung", "E-Mail, Kalendereintrag und Meeting-Link"]
                ].map(([title, text]) => (
                  <div key={title} className="rounded-md border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-600">Verkaufsrelevanter Betrieb</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Mehr als ein Terminbuchungstool. Eine zentrale Plattform für professionelle Terminprozesse.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              SMART Booking verbindet Buchungsseiten, Kalenderabgleich, Meeting-Dienste und automatisierte Kommunikation in einer integrierten Lösung.
              Unterschiedliche Webseiten, Standorte oder Ansprechpartner können mit eigenen Profilen, Terminangeboten und individuellen Einstellungen betrieben werden.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Öffentliche Links", "Premium-Einbettung", "Rechtliche Links", "Import und Export"].map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">Kalender und Meeting-Dienste</h3>
            <div className="mt-4 space-y-3">
              {integrationRows.map(([provider, status, text]) => (
                <div key={provider} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-950">{provider}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <strong>Für Ihre Kunden besonders komfortabel:</strong> Jede Terminbestätigung enthält einen Kalendereintrag. Termine können dadurch
              mit wenigen Klicks in Apple Kalender, Google Kalender, Outlook und viele weitere Anwendungen übernommen werden.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-600">Terminort und Meetingart</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Jeder Termin im passenden Format.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Definieren Sie für jede Terminart die gewünschte Form der Durchführung. Dadurch bleiben Online-Termine, Telefongespräche, Vor-Ort-Termine und individuelle Abstimmungen klar voneinander getrennt.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {meetingModes.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {processSteps.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <item.icon className="mb-4 h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-950 px-5 py-6 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-200">Nächster Schritt</p>
            <h2 className="mt-1 text-2xl font-semibold">Live testen. Sicher veröffentlichen.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Prüfen Sie Buchungsseiten, Kalenderabgleich, Meeting-Links und E-Mail-Kommunikation unter realen Bedingungen, bevor neue Buchungsprofile veröffentlicht werden.
            </p>
          </div>
          <Link
            href="/book"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 md:mt-0"
          >
            Zur Buchungsseite <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
