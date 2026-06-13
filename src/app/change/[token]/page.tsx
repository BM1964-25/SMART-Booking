import { PrimaryButton } from "@/components/button";

export default async function ChangeRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Änderung vorschlagen</h1>
        <p className="mt-4 text-slate-600">
          Sie können hier einen alternativen Termin oder einen Änderungswunsch senden. BuiltSmart AI prüft den Vorschlag und meldet sich bei Ihnen.
        </p>
        <form action="/api/bookings/change-request" method="post" className="mt-6 space-y-5">
          <input type="hidden" name="token" value={token} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Gewünschter neuer Termin optional</span>
            <input
              name="proposedStartsAt"
              type="datetime-local"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nachricht</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Bitte nennen Sie Ihren Änderungsvorschlag."
            />
          </label>
          <PrimaryButton>Änderungsvorschlag senden</PrimaryButton>
        </form>
      </div>
    </section>
  );
}
