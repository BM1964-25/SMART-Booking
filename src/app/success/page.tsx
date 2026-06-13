import { PrimaryLink } from "@/components/button";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ cancelled?: string; change?: string; existing?: string }> }) {
  const params = await searchParams;
  const title = params.cancelled
    ? "Termin storniert"
    : params.change
      ? "Änderungsvorschlag gesendet"
      : params.existing
        ? "Buchung bereits bestätigt"
        : "Buchung bestätigt";
  const text = params.cancelled
    ? "Der Termin wurde storniert."
    : params.change
      ? "Vielen Dank. Ihr Änderungsvorschlag wurde gespeichert und wird geprüft."
      : params.existing
        ? "Diese Buchung wurde bereits gespeichert. Der Termin ist in Ihrem Buchungssystem bestätigt."
        : "Vielen Dank. Der Termin wurde gespeichert und im Kalender eingetragen.";

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-4 leading-7 text-slate-600">{text}</p>
        <div className="mt-8">
          <PrimaryLink href="/">Zur Startseite</PrimaryLink>
        </div>
      </div>
    </section>
  );
}
