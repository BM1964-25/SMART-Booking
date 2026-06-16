import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { SaveSubmitButton } from "@/components/save-submit-button";
import { requireAdmin } from "@/lib/admin";
import { listCalendars, matchesConfiguredCalendar } from "@/lib/calendar/caldav";
import { getEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { CalendarConnection } from "@/lib/types";

export const dynamic = "force-dynamic";
const calendarListTimeoutMs = 5000;

type CalendarOption = {
  id: string;
  url: string;
  displayName: string;
  isConfiguredFallback: boolean;
};

export default async function AdminIntegrationsPage({ searchParams }: { searchParams?: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const supabase = createSupabaseAdmin();
  const [{ data: connections }, { error: schemaCheckError }] = await Promise.all([
    supabase
      .from("calendar_connections")
      .select("*")
      .eq("provider", "apple")
      .returns<CalendarConnection[]>(),
    supabase
      .from("calendar_connections")
      .select("id,use_for_booking,use_for_availability")
      .eq("provider", "apple")
      .limit(1)
  ]);
  const schemaReady = !schemaCheckError;
  const savedConnections = schemaReady ? connections || [] : [];
  const calendarsResult = schemaReady ? await loadAppleCalendarOptions(savedConnections) : { calendars: [], error: "" };
  const selectedBookingCalendar = findBookingCalendar(savedConnections, calendarsResult.calendars);
  const selectedAvailabilityCalendars = findAvailabilityCalendars(savedConnections, calendarsResult.calendars, selectedBookingCalendar);

  async function saveAppleCalendarIntegration(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const bookingCalendarId = String(formData.get("booking_calendar_id") || "");
    const availabilityCalendarIds = formData.getAll("availability_calendar_ids").map((value) => String(value));
    const { error: schemaError } = await supabase
      .from("calendar_connections")
      .select("id,use_for_booking,use_for_availability")
      .eq("provider", "apple")
      .limit(1);

    if (schemaError && isMissingCalendarRoleColumnError(schemaError.message)) {
      redirect(`/admin/integrations?error=${encodeURIComponent("Bitte zuerst Supabase-Migration 031_calendar_connection_roles.sql ausführen. Bis dahin werden keine Kalendereinstellungen verändert.")}`);
    }

    if (!bookingCalendarId) {
      revalidatePath("/admin/integrations");
      redirect("/admin/integrations?error=Bitte%20Buchungskalender%20ausw%C3%A4hlen.");
    }

    const calendars = await loadAppleCalendarOptions([]);

    if (calendars.error) {
      redirect(`/admin/integrations?error=${encodeURIComponent(calendars.error)}`);
    }

    const selectedIds = new Set([bookingCalendarId, ...availabilityCalendarIds]);
    const rows = calendars.calendars.filter((calendar) => selectedIds.has(calendar.id)).map((calendar) => ({
      provider: "apple",
      calendar_id: calendar.id,
      display_name: calendar.displayName,
      is_active: true,
      use_for_booking: calendar.id === bookingCalendarId,
      use_for_availability: availabilityCalendarIds.includes(calendar.id)
    }));

    const { error: resetBookingError } = await supabase
      .from("calendar_connections")
      .update({ use_for_booking: false, use_for_availability: false })
      .eq("provider", "apple");

    if (resetBookingError) {
      revalidatePath("/admin/integrations");
      redirect(`/admin/integrations?error=${encodeURIComponent(resetBookingError.message)}`);
    }

    const { error } = await supabase.from("calendar_connections").upsert(rows, {
      onConflict: "provider,calendar_id"
    });

    if (error) {
      revalidatePath("/admin/integrations");
      redirect(`/admin/integrations?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect("/admin/integrations?saved=1");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Kalender & Meetings</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Verbinden Sie Kalender und Meeting-Dienste so, dass SMART Booking freie Zeiten korrekt prüft und neue Buchungen kontrolliert in den richtigen Kalender schreibt.
      </p>
      <AdminNav />

      {!schemaReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Supabase-Migration erforderlich</p>
          <p>
            Bitte führen Sie zuerst <span className="font-mono">031_calendar_connection_roles.sql</span> im Supabase SQL Editor aus. Vorher zeigt SMART Booking keine
            Kalenderauswahl und speichert keine neue Mehrkalender-Auswahl.
          </p>
        </div>
      ) : null}

      {resolvedSearchParams?.saved ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Integration wurde gespeichert.</p>
      ) : null}
      {resolvedSearchParams?.error ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{resolvedSearchParams.error}</p>
      ) : null}

      <form action={saveAppleCalendarIntegration} className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Apple CalDAV</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Wählen Sie genau einen Buchungskalender aus. Weitere Kalender können zusätzlich gelesen werden, damit private Termine, Urlaub oder andere Belegungen keine
              freien Zeitfenster erzeugen.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${calendarsResult.error ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {calendarsResult.error ? "Prüfung erforderlich" : `${calendarsResult.calendars.length} Kalender gefunden`}
          </span>
        </div>

        {calendarsResult.error ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Apple CalDAV konnte gerade nicht geladen werden.</p>
            <p>{calendarsResult.error}</p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <fieldset className="rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">Buchungskalender</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              In diesen Kalender schreibt SMART Booking neue Termine. Hier sollte nur der Kalender ausgewählt werden, der bewusst für Buchungen genutzt wird.
            </p>
            <div className="mt-4 space-y-2">
              {calendarsResult.calendars.length > 0 ? (
                calendarsResult.calendars.map((calendar) => (
                  <label key={calendar.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-brand-300">
                    <input
                      type="radio"
                      name="booking_calendar_id"
                      value={calendar.id}
                      defaultChecked={calendar.id === selectedBookingCalendar}
                      className="mt-1 h-4 w-4 accent-brand-500"
                    />
                    <CalendarLabel calendar={calendar} />
                  </label>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Kalender werden nach Ausführung der Supabase-Migration angezeigt.
                </p>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">Abgleich-Kalender</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Diese Kalender werden nur gelesen. Belegte Zeiten blockieren die Buchungsseite, vorhandene Einträge werden dabei nicht verändert.
            </p>
            <div className="mt-4 space-y-2">
              {calendarsResult.calendars.length > 0 ? (
                calendarsResult.calendars.map((calendar) => (
                  <label key={calendar.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-brand-300">
                    <input
                      type="checkbox"
                      name="availability_calendar_ids"
                      value={calendar.id}
                      defaultChecked={selectedAvailabilityCalendars.includes(calendar.id)}
                      className="mt-1 h-4 w-4 rounded accent-brand-500"
                    />
                    <CalendarLabel calendar={calendar} />
                  </label>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Abgleich-Kalender werden nach Ausführung der Supabase-Migration angezeigt.
                </p>
              )}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-950">Sicherheitslogik</p>
          <p>
            SMART Booking erstellt neue Termine nur im ausgewählten Buchungskalender. Alle zusätzlich ausgewählten Kalender dienen ausschließlich der
            Verfügbarkeitsprüfung.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          {schemaReady ? (
            <SaveSubmitButton
              idleLabel="Kalender speichern"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          ) : (
            <button type="button" disabled className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white">
              Migration zuerst ausführen
            </button>
          )}
        </div>
      </form>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Meeting-Dienste</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MeetingProviderCard title="Zoom" status="Aktiv" text="Zoom-Links können aktuell automatisch für Online-Termine erzeugt werden." tone="green" />
          <MeetingProviderCard title="Google Meet" status="Geplant" text="Benötigt später eine Google-Kalender-Verbindung mit OAuth und Meet-Link-Erzeugung." tone="amber" />
          <MeetingProviderCard title="Microsoft Teams" status="Geplant" text="Benötigt später Microsoft Graph, Outlook-Kalender und Teams-Link-Erzeugung." tone="amber" />
        </div>
      </section>
    </section>
  );
}

async function loadAppleCalendarOptions(savedConnections: CalendarConnection[]) {
  try {
    const env = getEnv();
    const calendars = (await withTimeout(listCalendars(), calendarListTimeoutMs)).filter(isEventCalendar);

    return {
      calendars: calendars.map((calendar) => {
        const url = normalizeCalendarValue(calendar.url);
        const displayName = normalizeCalendarValue(calendar.displayName) || url || "Apple Kalender";

        return {
          id: url || displayName,
          url,
          displayName,
          isConfiguredFallback: env.APPLE_CALENDAR_ID ? matchesConfiguredCalendar(calendar, env.APPLE_CALENDAR_ID) : savedConnections.length === 0
        };
      }),
      error: ""
    };
  } catch (error) {
    return {
      calendars: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Apple-Kalender."
    };
  }
}

function findBookingCalendar(connections: CalendarConnection[], calendars: CalendarOption[]) {
  const saved = connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id)?.calendar_id;
  const fallback = calendars.find((calendar) => calendar.isConfiguredFallback)?.id || calendars[0]?.id || "";

  return saved || fallback;
}

function findAvailabilityCalendars(connections: CalendarConnection[], calendars: CalendarOption[], bookingCalendarId: string) {
  const saved = connections
    .filter((connection) => connection.is_active && connection.use_for_availability && connection.calendar_id)
    .map((connection) => connection.calendar_id || "");

  if (saved.length > 0) {
    return saved;
  }

  return bookingCalendarId ? [bookingCalendarId] : calendars.slice(0, 1).map((calendar) => calendar.id);
}

function isMissingCalendarRoleColumnError(message: string) {
  return message.includes("use_for_booking") || message.includes("use_for_availability") || message.includes("schema cache");
}

function normalizeCalendarValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isEventCalendar(calendar: { components?: unknown; displayName?: unknown }) {
  if (!Array.isArray(calendar.components)) {
    return normalizeCalendarValue(calendar.displayName).toLowerCase() !== "erinnerungen";
  }

  return calendar.components.some((component) => String(component).toUpperCase() === "VEVENT");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Apple CalDAV antwortet gerade nicht rechtzeitig. Bitte später erneut öffnen.")), timeoutMs);
    })
  ]);
}

function CalendarLabel({ calendar }: { calendar: CalendarOption }) {
  return (
    <span className="min-w-0">
      <span className="block font-semibold text-slate-950">{calendar.displayName}</span>
      <span className="mt-1 block break-all text-xs leading-5 text-slate-500">{calendar.url}</span>
      {calendar.isConfiguredFallback ? <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Aktuelle Standardauswahl</span> : null}
    </span>
  );
}

function MeetingProviderCard({ title, status, text, tone }: { title: string; status: string; text: string; tone: "green" | "amber" }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
