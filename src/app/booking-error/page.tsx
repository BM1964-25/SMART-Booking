import Link from "next/link";

const messages: Record<string, string> = {
  invalid:
    "Bitte prüfen Sie Ihre Eingaben. Name und Unternehmen benötigen mindestens 2 Zeichen. E-Mail-Adresse, Telefonnummer, Terminort und Datenschutz-Zustimmung sind ebenfalls erforderlich.",
  unavailable: "Dieses Zeitfenster ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.",
  calendar: "Der Termin konnte nicht in den Apple Kalender eingetragen werden. Bitte versuchen Sie es erneut oder kontaktieren Sie BuiltSmart AI.",
  config: "Die Buchungsfunktion ist noch nicht vollständig konfiguriert.",
  unknown: "Die Buchung konnte nicht abgeschlossen werden."
};

const details: Record<string, string> = {
  "calendar-not-found": "Der ausgewählte Apple Kalender wurde nicht gefunden. Bitte prüfen Sie APPLE_CALENDAR_ID in Vercel.",
  "calendar-config": "Die Apple-Kalenderverbindung ist noch nicht vollständig konfiguriert.",
  "calendar-write": "Die Verbindung zu Apple funktioniert grundsätzlich, aber der Kalendereintrag konnte nicht geschrieben werden."
};

export default async function BookingErrorPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string; type?: string; start?: string; detail?: string }>;
}) {
  const params = await searchParams;
  const message = messages[params.reason || "unknown"] || messages.unknown;
  const canRetryForm = Boolean(params.type && params.start && params.reason === "calendar");
  const href = canRetryForm
    ? `/book/${params.type}/confirm?start=${encodeURIComponent(params.start || "")}`
    : params.type
      ? `/book/${params.type}`
      : "/book";
  const buttonLabel = canRetryForm ? "Zurück zum Formular" : "Zurück zur Terminauswahl";
  const detail = params.detail ? details[params.detail] : null;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Buchung nicht abgeschlossen</h1>
        <p className="mt-4 leading-7 text-slate-600">{message}</p>
        {detail ? <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{detail}</p> : null}
        <Link href={href} className="mt-8 inline-flex rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
