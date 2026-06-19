"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Search, X } from "lucide-react";

type HelpSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  matrix?: {
    columns: string[];
    rows: Array<{
      label: string;
      values: string[];
    }>;
  };
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
      "Der Adminbereich ist geschützt. Melden Sie sich mit dem angelegten Admin-Benutzer an.",
      "Für produktive Buchungen müssen Kalender, E-Mail-Versand und gewünschte Meeting-Dienste eingerichtet sein.",
      "Zugangsdaten und Schlüssel werden geschützt verarbeitet und nicht auf der öffentlichen Buchungsseite angezeigt."
    ]
  },
  {
    id: "quickstart",
    title: "Schnellstart",
    body: ["Für SMART Booking reichen wenige Schritte, um produktiv zu starten."],
    bullets: [
      "Admin-Zugang einrichten.",
      "Kalenderanbieter auswählen und Buchungskalender festlegen.",
      "E-Mail-Versand konfigurieren.",
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
      "Der Adminbereich enthält Dashboard, Buchungsübersicht, Einstellungen, Profile und Datensicherung. Der aktive Menüpunkt wird hervorgehoben, damit jederzeit klar ist, in welchem Bereich Sie arbeiten."
    ]
  },
  {
    id: "profiles",
    title: "Profile & Vorlagen",
    body: [
      "Profile steuern die öffentliche Buchungsseite: Texte, Profilansicht, Kontaktlinks, Rechtliches, Farben, Standard-Link und Premium-Link.",
      "Im Bereich Profilvorlagen können Sie eine bestehende Konfiguration als eigene Vorlage speichern oder eine vorhandene Vorlage auf das aktuelle Profil anwenden. Änderungen werden erst nach „Profil speichern“ auf der Live-Seite sichtbar."
    ],
    bullets: [
      "Eigene Vorlage speichern: Im Profilbereich auf „Als eigene Vorlage speichern“ klicken. Die aktuelle Konfiguration wird als wiederverwendbare Vorlage abgelegt.",
      "Vorlage laden: Eine Vorlagen-Karte anklicken. Die Werte der Vorlage werden sofort in das Formular übernommen.",
      "Profilname und Slug bleiben beim Anwenden einer Vorlage unverändert, damit der öffentliche Link nicht versehentlich geändert wird.",
      "Subheadline 1 erscheint fett direkt unter der Headline. Subheadline 2 steht darunter als normaler erklärender Text.",
      "Der Name unter dem Profilfoto und der optionale Slogan/Info-Text werden im Abschnitt „Profilbild“ gepflegt und sind unabhängig vom Kontaktname-Feld.",
      "Die Ablaufanzeige 01/02/03 kann im Profil unter „Profilansicht“ ein- oder ausgeschaltet werden.",
      "Der Button „Live-Vorschau öffnen“ zeigt den zuletzt gespeicherten Stand. Ist der Premium-Link freigeschaltet, öffnet die Vorschau automatisch die reduzierte Ansicht ohne SMART-Booking-Header und Footer.",
      "Standard- und Premium-Link können im Profil über das Copy-Icon kopiert werden. Nach erfolgreichem Kopieren erscheint kurz ein grünes Häkchen.",
      "Nach dem Anwenden einer Vorlage die Felder kontrollieren und bei Bedarf anpassen.",
      "Erst mit „Profil speichern“ wird die geladene Vorlage dauerhaft übernommen und auf der öffentlichen Buchungsseite sichtbar."
    ]
  },
  {
    id: "booking-types",
    title: "Terminarten",
    body: [
      "Terminarten werden in den Einstellungen direkt im jeweiligen Profil gepflegt. Jedes Profil kann bis zu vier eigene Terminarten mit eigener Reihenfolge anzeigen.",
      "Beim Anlegen einer neuen Terminart sind Dauer, Puffer davor und Puffer danach bereits sinnvoll vorbelegt."
    ],
    bullets: [
      "Standardwerte für neue Terminarten: Dauer 30 Minuten, Puffer davor 10 Minuten, Puffer danach 15 Minuten.",
      "Beschreibung, Pufferzeiten und Profil-Zuordnung werden nach dem Speichern geprüft. Wenn ein Wert nicht übernommen werden kann, erscheint eine Fehlermeldung.",
      "E-Mail-Erinnerungen werden pro Terminart aktiviert. Es können bis zu zwei Erinnerungen pro Buchung gesendet werden, zum Beispiel 1 Tag vorher und 2 Stunden vorher.",
      "Für jede Erinnerung wird ein eigener Zeitpunkt gewählt: 15 Minuten, 30 Minuten, 1 Stunde, 2 Stunden, 12 Stunden, 1 Tag, 2 Tage oder 3 Tage vor dem Termin.",
      "Jede Erinnerung kann einen eigenen Hinweistext bekommen, damit die frühere Nachricht anders klingt als die kurzfristige Erinnerung.",
      "Änderungen an Zeitpunkt, Hinweistext oder Aktiv-Häkchen werden erst übernommen, wenn die jeweilige Terminart gespeichert wird.",
      "Damit Erinnerungen automatisch versendet werden, muss der Erinnerungs-Endpunkt regelmäßig durch einen externen Zeitplaner aufgerufen werden. Auf Vercel Hobby ist das der empfohlene Weg.",
      "Der sichtbare Name einer Terminart darf in mehreren Profilen gleich sein, zum Beispiel „Kostenloses Erstgespräch“.",
      "Der technische Slug wird automatisch eindeutig gemacht. Bei Namensgleichheit hängt die App den Profil-Slug oder eine Nummer an.",
      "Nach dem Speichern bleibt der gewählte Profil-Tab im Terminartenbereich erhalten."
    ]
  },
  {
    id: "features",
    title: "Wichtige Funktionen",
    body: ["SMART Booking konzentriert sich auf eine klare Terminlogik und professionelle Verwaltung."],
    bullets: [
      "Öffentliche Buchungsseiten mit bis zu vier Profilen.",
      "Bis zu vier Terminarten pro Profil mit Dauer, Pufferzeiten, Beschreibung und eigener Sortierung.",
      "Standard-Link mit Header/Footer und Premium-Link mit reduzierter Ansicht ohne SMART-Booking-Header und Footer.",
      "Zeitfenster und Verfügbarkeit auf Basis von Regeln, Blockzeiten, vorhandenen Buchungen und dem aktiven Kalenderanbieter.",
      "Meeting-Links über feste Links oder, sofern verbunden, über Anbieter-APIs.",
      "Bestätigungs- und Benachrichtigungs-E-Mails über SMTP.",
      "Stornierung mit nachvollziehbarer Historie und optionaler Kundenbenachrichtigung."
    ]
  },
  {
    id: "integrations",
    title: "Kalender & Meetings",
    body: [
      "Der Menüpunkt Kalender & Meetings steuert, welche Kalender SMART Booking nutzt und welche Meeting-Dienste für Online-Termine vorgesehen sind.",
      "Pro Installation gibt es genau einen aktiven Kalenderanbieter. Apple CalDAV ist produktiv nutzbar; Google Kalender kann per OAuth verbunden werden; Microsoft Outlook/365 ist als Erweiterung vorbereitet.",
      "Innerhalb dieses aktiven Anbieters wird genau ein Buchungskalender ausgewählt. Zusätzliche Abgleich-Kalender müssen aus demselben Anbieter stammen, zum Beispiel mehrere Apple-Kalender bei Apple CalDAV."
    ],
    bullets: [
      "Buchungskalender: Ein Kalender für neue Buchungen. Dort erstellt SMART Booking den verbindlichen Kalendereintrag.",
      "Abgleich-Kalender: Weitere Kalender desselben Anbieters für die reine Verfügbarkeitsprüfung. Sie werden gelesen, aber nicht verändert.",
      "Ein Kalender kann gleichzeitig Buchungskalender und Abgleich-Kalender sein, wenn die dort eingetragenen Buchungen ebenfalls freie Zeiten blockieren sollen.",
      "Private, geschäftliche oder Urlaubskalender können als Abgleich-Kalender aktiviert werden, sofern sie im aktiven Kalenderanbieter verfügbar sind. SMART Booking trägt dort keine Termine ein.",
      "Der Standard-Terminort wird pro Terminart in den Einstellungen festgelegt und im Buchungsformular vorgewählt.",
      "Feste Meeting-Links funktionieren unabhängig vom Kalenderanbieter. Ein dauerhafter Zoom-, Google-Meet- oder Teams-Link wird bei jeder passenden Buchung in E-Mail und Kalendereintrag übernommen.",
      "Feste Links eignen sich für persönliche Dauerräume, Teamräume oder bewusst wiederverwendete Beratungsräume. Der Link bleibt für zukünftige Gespräche gleich, bis er im Adminbereich geändert wird.",
      "Automatische Links per API erzeugen pro Buchung einen eigenen Link. Dafür muss der jeweilige Dienst technisch verbunden und für SMART Booking nutzbar sein.",
      "Google Meet kann über einen festen Link genutzt werden. Automatische Google-Meet-Links werden über die Google-Verbindung erzeugt.",
      "Zoom kann per API eigene Links erzeugen, wenn die Zoom Server-to-Server-OAuth-Daten korrekt sind. Wenn Zoom den Zugang mit „invalid_client“ ablehnt, sind Client ID, Client Secret, Account ID oder die Zoom-App-Freigabe zu prüfen.",
      "Microsoft Teams ist im aktuellen Stand über feste Links nutzbar. Die automatische Teams-Erzeugung über Microsoft Graph bleibt als späterer Ausbau vorbereitet.",
      "Die Prüfbuttons kontrollieren feste Links formal und testen verfügbare API-Verbindungen. Eine erfolgreiche Prüfung ersetzt keine echte Testbuchung, reduziert aber typische Konfigurationsfehler."
    ],
    matrix: {
      columns: ["Kalenderanbieter", "Zoom fester Link", "Zoom API", "Google Meet fester Link", "Google Meet API", "Teams fester Link", "Teams API"],
      rows: [
        {
          label: "Apple / iCloud CalDAV",
          values: ["Ja", "Ja", "Ja", "Nein", "Ja", "Nein"]
        },
        {
          label: "Google Kalender",
          values: ["Ja", "Ja", "Ja", "Ja", "Ja", "Nein"]
        },
        {
          label: "Microsoft 365 / Outlook",
          values: ["Ja", "Ja", "Ja", "Nein", "Ja", "Ja"]
        }
      ]
    }
  },
  {
    id: "email",
    title: "E-Mail-Versand",
    body: [
      "Der E-Mail-Versand sorgt dafür, dass Kunden und Betreiber nach einer Buchung automatisch informiert werden. SMART Booking nutzt dafür SMTP-Daten, zum Beispiel von Brevo, und versendet E-Mails nur dann, wenn die Zugangsdaten vollständig und korrekt gespeichert sind.",
      "Über den E-Mail-Versand werden Buchungsbestätigungen, interne Benachrichtigungen, Storno-Nachrichten und aktivierte Erinnerungen verschickt. Neue Einstellungen wirken sich auf neue Buchungen und zukünftige Erinnerungen aus; bereits versendete E-Mails werden nicht nachträglich geändert.",
      "Für einen zuverlässigen Versand sollte die Absenderdomain beim Mailanbieter authentifiziert sein. SPF, DKIM und DMARC helfen dabei, dass E-Mails nicht im Spam landen und beim Empfänger professionell wirken."
    ],
    bullets: [
      "SMTP-Host: Der Servername des Mailanbieters, über den SMART Booking E-Mails versendet. Bei Brevo steht dieser Wert im SMTP-Bereich des Kontos, meist als smtp-relay.brevo.com.",
      "SMTP-Port: Der technische Zugangspunkt für den SMTP-Server. Der Mailanbieter nennt den passenden Port in den SMTP-Einstellungen; häufig ist es 587 für TLS.",
      "SMTP-Benutzer: Der Benutzername für den SMTP-Zugang. Bei Brevo ist das in der Regel die Login-E-Mail oder der im SMTP-Bereich angezeigte Benutzername.",
      "SMTP-Passwort: Das SMTP-Passwort oder der SMTP-Key des Mailanbieters. Es ist nicht zwingend identisch mit dem normalen Login-Passwort und wird im Konto des Mailanbieters erzeugt oder angezeigt.",
      "Absender: Die E-Mail-Adresse, die Kunden als Absender sehen. Sie sollte beim Mailanbieter freigegeben und über die eigene Domain authentifiziert sein.",
      "Admin-/Empfänger-E-Mail: Die interne Zieladresse für Betreiber-Benachrichtigungen. An diese Adresse sendet SMART Booking Hinweise zu neuen Buchungen und wichtigen Vorgängen.",
      "Der Testversand prüft, ob SMART Booking über die gespeicherten SMTP-Daten eine E-Mail zustellen kann. Ein erfolgreicher Test ersetzt trotzdem keine echte Testbuchung.",
      "Nach jeder Änderung am E-Mail-Versand sollte eine Testbuchung durchgeführt werden. Dabei sollten Kundenmail, Adminmail, Kalendereintrag und Meeting-Details gemeinsam geprüft werden.",
      "Wenn keine E-Mail ankommt, zuerst SMTP-Daten, Absenderadresse und Provider-Logs prüfen. Danach Spam-Ordner, Domain-Authentifizierung und mögliche Tippfehler in der Empfängeradresse kontrollieren.",
      "Erinnerungen werden nur versendet, wenn sie in der jeweiligen Terminart aktiviert sind und der Erinnerungs-Endpunkt regelmäßig durch den externen Zeitplaner aufgerufen wird."
    ]
  },
  {
    id: "workflow",
    title: "Typischer Workflow",
    body: ["Ein üblicher Ablauf besteht aus Einrichtung, Prüfung und laufender Verwaltung."],
    bullets: [
      "Profil und Terminarten vorbereiten.",
      "Kalender & Meetings prüfen: Buchungskalender festlegen und gewünschte Abgleich-Kalender aktivieren.",
      "Bei Bedarf eine Profilvorlage anwenden und danach das Profil speichern.",
      "Verfügbarkeiten und blockierte Zeiten pflegen.",
      "Live-Buchungsseite testen.",
      "Buchungen in der Übersicht kontrollieren.",
      "Stornierungen sauber über den Adminbereich auslösen."
    ]
  },
  {
    id: "backup",
    title: "Datensicherung",
    body: [
      "Der Menüpunkt Datensicherung dient zum Exportieren und Importieren der SMART-Booking-Konfiguration.",
      "Die Sicherung enthält Profile, Terminarten, Profil-Zuordnungen, Verfügbarkeitsregeln, Blockzeiten und Profil-Vorlagen. Buchungen werden bewusst nicht importiert oder überschrieben."
    ],
    bullets: [
      "Export erstellen: Lädt eine JSON-Datei herunter, die als Sicherung der aktuellen Konfiguration abgelegt werden kann.",
      "Import prüfen: Eine SMART-Booking-JSON-Datei auswählen und zuerst die Vorschau kontrollieren.",
      "Import ausführen: Übernimmt die geprüfte Konfiguration. Profile und Terminarten werden anhand ihrer Slugs aktualisiert oder ergänzt.",
      "Nach einem Import die Adminseiten neu laden und öffentliche Buchungsseite kontrollieren."
    ]
  },
  {
    id: "data",
    title: "Eingaben & Daten",
    body: [
      "Kunden geben Name, E-Mail, Unternehmen, Telefonnummer, Anliegen, Terminort und Datenschutz-Zustimmung ein.",
      "Admin-Daten, Kalenderzugänge und Schlüssel werden geschützt verarbeitet und nicht auf der öffentlichen Buchungsseite offengelegt."
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
      "E-Mail landet im Spam: Absenderdomain in Brevo authentifizieren, SPF/DKIM/DMARC prüfen und möglichst nur die freigegebene Absenderadresse verwenden.",
      "Zoom-Link fehlt: Zoom Server-to-Server OAuth, Scopes und Environment Variables prüfen.",
      "Terminart wird nicht gespeichert: Fehlermeldung im Bereich Terminarten lesen. Häufige Ursachen sind Slug-Konflikte, unvollständige Angaben oder mehr als vier Terminarten im gleichen Profil.",
      "Subheadline 1 erscheint nicht: Im Profil prüfen, ob neben Subheadline 1 „Anzeigen“ aktiviert ist und danach „Profil speichern“ klicken."
    ]
  },
  {
    id: "version",
    title: "Version & Hinweise",
    body: [
      "Diese Hilfe beschreibt die aktuelle SMART-Booking-Version mit Kalenderintegrationen, E-Mail-Versand, Profilen und Meeting-Diensten.",
      "Änderungen im Adminbereich werden auf der öffentlichen Buchungsseite sichtbar, nachdem das jeweilige Profil oder die jeweilige Einstellung gespeichert wurde."
    ]
  }
];

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function openHelp(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const sectionId = typeof detail?.sectionId === "string" ? detail.sectionId : null;

      setQuery("");
      setTargetSectionId(sectionId);
      setIsOpen(true);
    }

    window.addEventListener("smart-booking:open-help", openHelp);

    return () => {
      window.removeEventListener("smart-booking:open-help", openHelp);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen || !targetSectionId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`help-${targetSectionId}`)?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, targetSectionId, visibleSections]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTargetSectionId(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
      >
        <HelpCircle className="h-4 w-4" />
        Hilfe
      </button>

      {isOpen && isMounted
        ? createPortal(
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
                          {section.matrix ? (
                            <div className="overflow-x-auto rounded-md border border-slate-200">
                              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600">
                                  <tr>
                                    {section.matrix.columns.map((column) => (
                                      <th key={column} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                                        {column}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {section.matrix.rows.map((row) => (
                                    <tr key={row.label}>
                                      <th scope="row" className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                                        {row.label}
                                      </th>
                                      {row.values.map((value, index) => (
                                        <td key={`${row.label}-${section.matrix?.columns[index + 1]}`} className="whitespace-nowrap px-3 py-2 text-slate-700">
                                          {value}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </aside>
        </div>,
          document.body
        )
        : null}
    </>
  );
}
