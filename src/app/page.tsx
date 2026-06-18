import { ArrowRight, CalendarCheck, Clock3, MailCheck, ShieldCheck, Sparkles, Video } from "lucide-react";
import { PrimaryLink } from "@/components/button";

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              SMART Booking
            </span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              von BuiltSmart AI
            </span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            SMART Booking
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Professionelle Terminbuchung für Erstgespräche, KI-Demos und projektbezogene Beratung.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <PrimaryLink href="/book">Termin auswählen</PrimaryLink>
            <p className="text-sm font-medium text-slate-500">Direkt online reservieren, Bestätigung per E-Mail erhalten.</p>
          </div>
          <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3">
            {[
              { value: "Flexibel", label: "Dauer" },
              { value: "Mehrere", label: "Formate" },
              { value: "24/7", label: "buchbar" }
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="rounded-md border border-slate-100 bg-slate-50 p-5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Buchungsübersicht</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Verfügbare Gespräche</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
            </div>
            <div className="space-y-3">
              {[
                ["Erstgespräch", "Situation besprechen"],
                ["KI-Demo", "Einsatzmöglichkeiten sehen"],
                ["Projektanalyse", "Potenziale einordnen"]
              ].map(([item, description]) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-950">{item}</p>
                    <p className="text-sm text-slate-500">{description}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">30 Min.</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-brand-100 bg-white p-4">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <MailCheck className="h-5 w-5 text-brand-600" />
                Bestätigung und Kalendereintrag werden automatisch erstellt.
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-3">
          {[
            { icon: CalendarCheck, title: "Kalenderbasiert", text: "Freie Zeitfenster werden mit dem verbundenen Kalender abgeglichen." },
            { icon: ShieldCheck, title: "Sicher verarbeitet", text: "Buchungsdaten werden serverseitig validiert und geschützt gespeichert." },
            { icon: Video, title: "Passende Formate", text: "Gesprächsarten, Demos und Beratungen können flexibel vorbereitet werden." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <item.icon className="mb-4 h-5 w-5 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Ablauf</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">In wenigen Schritten zum verbindlichen Termin</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Die Buchungsseite führt Interessenten klar durch Auswahl, Zeitfenster und Bestätigung.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Format wählen", text: "Gesprächsart passend zum Anliegen auswählen." },
            { icon: Clock3, title: "Zeit festlegen", text: "Freie Slots werden aus dem Kalender ermittelt." },
            { icon: ArrowRight, title: "Buchung sichern", text: "Bestätigung, E-Mail und Kalender folgen automatisch." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <item.icon className="mb-4 h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
