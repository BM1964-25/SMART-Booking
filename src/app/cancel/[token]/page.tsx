import { PrimaryButton } from "@/components/button";

export default async function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-950">Termin stornieren</h1>
        <p className="mt-4 text-slate-600">Wenn Sie den Termin stornieren, wird die Buchung deaktiviert und der Kalendereintrag entfernt.</p>
        <form action="/api/bookings/cancel" method="post" className="mt-8">
          <input type="hidden" name="token" value={token} />
          <PrimaryButton>Termin stornieren</PrimaryButton>
        </form>
      </div>
    </section>
  );
}
