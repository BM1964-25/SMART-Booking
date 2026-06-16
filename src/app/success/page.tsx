import { PrimaryLink } from "@/components/button";
import { EmbedShellStyle } from "@/components/embed-shell-style";
import { defaultBookingProfile, getBookingProfile } from "@/lib/profiles";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ cancelled?: string; change?: string; embed?: string; existing?: string; profile?: string }> }) {
  const params = await searchParams;
  const profile = await getBookingProfile(params.profile);
  const isEmbedView = params.embed === "1" && profile.allow_embed_view === true;
  const bookingPath = profile.slug === defaultBookingProfile.slug ? "/book" : `/book/profile/${profile.slug}`;
  const bookingHref = isEmbedView ? `${bookingPath}?embed=1` : bookingPath;
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
        : "Vielen Dank. Der Termin wurde gespeichert, im Kalender eingetragen und per E-Mail bestätigt.";

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      {isEmbedView ? <EmbedShellStyle /> : null}
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-4 leading-7 text-slate-600">{text}</p>
        <div className="mt-8">
          <PrimaryLink href={bookingHref}>Zur Buchungsseite</PrimaryLink>
        </div>
      </div>
    </section>
  );
}
