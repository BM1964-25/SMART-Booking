import Link from "next/link";

const messages: Record<string, string> = {
  invalid:
    "Bitte prüfen Sie Ihre Eingaben. Name, E-Mail, Unternehmen, Anliegen und Datenschutz-Zustimmung sind erforderlich. Falls Sie denselben Termin gerade bereits erfolgreich gebucht haben, ist der Eintrag trotzdem gespeichert.",
  unavailable: "Dieses Zeitfenster ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.",
  calendar: "Der Termin konnte nicht in den Apple Kalender eingetragen werden. Bitte versuchen Sie es erneut oder kontaktieren Sie BuiltSmart AI.",
  config: "Die Buchungsfunktion ist noch nicht vollständig konfiguriert.",
  unknown: "Die Buchung konnte nicht abgeschlossen werden."
};

export default async function BookingErrorPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string; type?: string }>;
}) {
  const params = await searchParams;
  const message = messages[params.reason || "unknown"] || messages.unknown;
  const href = params.type ? `/book/${params.type}` : "/book";

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Buchung nicht abgeschlossen</h1>
        <p className="mt-4 leading-7 text-slate-600">{message}</p>
        <Link href={href} className="mt-8 inline-flex rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
          Zurück zur Terminauswahl
        </Link>
      </div>
    </section>
  );
}
