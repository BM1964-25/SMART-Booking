import { CalendarCheck, ShieldCheck, Video } from "lucide-react";
import { PrimaryLink } from "@/components/button";

export default function HomePage() {
  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-600">BuiltSmart AI</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            Termin mit BuiltSmart AI buchen
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Wählen Sie einen passenden Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.
          </p>
          <div className="mt-8">
            <PrimaryLink href="/book">Termin auswählen</PrimaryLink>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-subtle">
          <div className="rounded-md bg-white p-5">
            <div className="mb-6 h-2 w-28 rounded bg-brand-500" />
            <div className="space-y-3">
              {["Erstgespräch", "KI-Demo", "Projektanalyse"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-950">{item}</p>
                    <p className="text-sm text-slate-500">30 Minuten</p>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-brand-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-3">
          {[
            { icon: CalendarCheck, title: "Kalenderbasiert", text: "Freie Zeitfenster werden mit dem Apple Kalender abgeglichen." },
            { icon: ShieldCheck, title: "Sicher verarbeitet", text: "Formulare werden serverseitig validiert und Admin-Daten geschützt." },
            { icon: Video, title: "Passende Formate", text: "Erstgespräch, Demo, Analyse und Beratung sind vorbereitet." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <item.icon className="mb-4 h-5 w-5 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
