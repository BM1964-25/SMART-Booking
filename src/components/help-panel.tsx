"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Search, X } from "lucide-react";

type HelpSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

const helpSections: HelpSection[] = [
  {
    id: "overview",
    title: "Überblick",
    body: [
      "SMART Booking ist eine Terminbuchungs-App für öffentliche Buchungsseiten und interne Verwaltung.",
      "Kunden wählen Terminart, Tag, Uhrzeit und Kontaktdaten. Die App prüft freie Zeitfenster serverseitig, speichert Buchungen und erstellt Kalendereinträge."
    ]
  },
  {
    id: "access",
    title: "Einrichtung & Zugang",
    body: [
      "Der Adminbereich wird über Supabase Auth geschützt. Melden Sie sich mit dem angelegten Admin-Benutzer an.",
      "Für produktive Buchungen müssen Supabase, Apple CalDAV, SMTP-Mailversand und optional Zoom eingerichtet sein.",
      "Zugangsdaten und Schlüssel gehören in die Vercel Environment Variables oder in geschützte serverseitige Konfigurationen. Sie werden nicht im Frontend angezeigt."
    ]
  },
  {
    id: "quickstart",
    title: "Schnellstart",
    body: ["Für SMART Booking reichen wenige Schritte, um produktiv zu starten."],
    bullets: [
      "Supabase-Umgebung und Admin-Zugang einrichten.",
      "Apple Kalender über CalDAV verbinden und Kalender-ID prüfen.",
      "Brevo SMTP oder einen anderen Mailversand konfigurieren.",
      "Terminarten und Verfügbarkeiten kontrollieren.",
      "Öffentliche Buchungsseite öffnen und eine Testbuchung durchführen.",
      "Kalendereintrag und E-Mail-Benachrichtigung kontrollieren."
    ]
  },
  {
    id: "interface",
    title: "Bedienoberfläche",
    body: [
      "Die öffentliche Seite führt Kunden durch Terminart, Tag/Uhrzeit und Kontaktdaten.",
      "Der Adminbereich enthält Dashboard, Buchungsübersicht, Einstellungen und Profile. Änderungen an Profilen werden erst nach dem Speichern auf der Live-Seite sichtbar."
    ]
  },
  {
    id: "features",
    title: "Wichtige Funktionen",
    body: ["SMART Booking konzentriert sich auf eine klare Terminlogik und professionelle Verwaltung."],
    bullets: [
      "Öffentliche Buchungsseiten mit bis zu vier Profilen.",
      "Terminarten mit Dauer, Pufferzeiten und Beschreibung.",
      "30-Minuten-Zeitfenster und Verfügbarkeit auf Basis von Regeln, Blockzeiten, Supabase-Buchungen und Apple Kalender.",
      "Zoom-Link-Erstellung, wenn Zoom eingerichtet und als Terminort gewählt ist.",
      "Bestätigungs- und Benachrichtigungs-E-Mails über SMTP.",
      "Stornierung mit nachvollziehbarer Historie und optionaler Kundenbenachrichtigung."
    ]
  },
  {
    id: "workflow",
    title: "Typischer Workflow",
    body: ["Ein üblicher Ablauf besteht aus Einrichtung, Prüfung und laufender Verwaltung."],
    bullets: [
      "Profil und Terminarten vorbereiten.",
      "Verfügbarkeiten und blockierte Zeiten pflegen.",
      "Live-Buchungsseite testen.",
      "Buchungen in der Übersicht kontrollieren.",
      "Stornierungen sauber über den Adminbereich auslösen."
    ]
  },
  {
    id: "data",
    title: "Eingaben & Daten",
    body: [
      "Kunden geben Name, E-Mail, Unternehmen, Telefonnummer, Anliegen, Terminort und Datenschutz-Zustimmung ein.",
      "Admin-Daten, Kalenderzugänge und Schlüssel werden serverseitig verarbeitet. Kalenderdaten und Service-Role-Schlüssel werden nicht im Frontend offengelegt."
    ]
  },
  {
    id: "results",
    title: "Ergebnisse verstehen",
    body: [
      "Eine erfolgreiche Buchung erzeugt einen gespeicherten Buchungseintrag, einen Kalendereintrag und E-Mail-Benachrichtigungen.",
      "Wenn Kalender oder Mailversand nicht korrekt eingerichtet sind, zeigt die App eine Fehlermeldung oder der Versand wird im jeweiligen Provider-Log sichtbar."
    ]
  },
  {
    id: "errors",
    title: "Fehler & Lösungen",
    body: ["Häufige Ursachen lassen sich meist über Einstellungen und Provider-Logs eingrenzen."],
    bullets: [
      "Kein freier Termin sichtbar: Verfügbarkeiten, blockierte Zeiten, Pufferzeiten und Apple Kalender prüfen.",
      "Kalendereintrag schlägt fehl: Apple CalDAV-URL, Benutzername, app-spezifisches Passwort und Kalender-ID prüfen.",
      "Keine E-Mail: SMTP-Werte, Absenderdomain, SPF/DKIM/DMARC und Brevo-Logs prüfen.",
      "Zoom-Link fehlt: Zoom Server-to-Server OAuth, Scopes und Environment Variables prüfen."
    ]
  },
  {
    id: "version",
    title: "Version & Hinweise",
    body: [
      "Diese Hilfe beschreibt die aktuelle SMART-Booking-Version mit Supabase, Apple CalDAV, Brevo SMTP, Profilen und Zoom-Integration.",
      "Änderungen im Adminbereich werden auf der öffentlichen Buchungsseite sichtbar, nachdem das jeweilige Profil oder die jeweilige Einstellung gespeichert wurde."
    ]
  }
];

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return helpSections;
    }

    return helpSections.filter((section) => {
      const content = [section.title, ...section.body, ...(section.bullets || [])].join(" ").toLowerCase();
      return content.includes(normalizedQuery);
    });
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
      >
        <HelpCircle className="h-4 w-4" />
        Hilfe
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Hilfe schließen" className="absolute inset-0 z-0 cursor-default bg-slate-950/35" onClick={() => setIsOpen(false)} />
          <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl sm:w-[92vw] lg:w-[860px]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">SMART Booking Hilfe</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Bedienungsanleitung</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:text-slate-950">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-200 px-5 py-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Hilfe durchsuchen"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </label>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[240px_1fr]">
              <nav className="border-b border-slate-200 p-4 md:overflow-y-auto md:border-b-0 md:border-r" aria-label="Hilfekapitel">
                <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
                  {visibleSections.map((section) => (
                    <a
                      key={section.id}
                      href={`#help-${section.id}`}
                      className="whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 md:block md:w-full md:whitespace-normal"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </nav>

              <article className="min-h-0 overflow-y-auto px-5 py-5">
                {visibleSections.length === 0 ? (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Keine passenden Hilfethemen gefunden.</p>
                ) : (
                  <div className="space-y-8">
                    {visibleSections.map((section) => (
                      <section key={section.id} id={`help-${section.id}`} className="scroll-mt-6">
                        <h3 className="text-2xl font-semibold text-slate-950">{section.title}</h3>
                        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
                          {section.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                          {section.bullets ? (
                            <ul className="space-y-2">
                              {section.bullets.map((bullet) => (
                                <li key={bullet} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
