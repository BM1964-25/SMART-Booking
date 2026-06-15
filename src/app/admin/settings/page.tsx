import { revalidatePath } from "next/cache";
import { AdminNav } from "@/components/admin-nav";
import { AdminDeleteBlockedTimeButton } from "@/components/admin-delete-blocked-time-button";
import { AvailabilityGrid } from "@/components/availability-grid";
import { SaveSubmitButton } from "@/components/save-submit-button";
import { requireAdmin } from "@/lib/admin";
import { getBookingTypeProfileAssignments, replaceBookingTypeProfileAssignments } from "@/lib/booking-type-profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

const weekdays = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" }
];

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const [{ data: types }, { data: profiles }, { data: rules }, { data: blockedTimes }, typeProfileAssignments] = await Promise.all([
    supabase.from("booking_types").select("*").order("sort_order"),
    supabase.from("booking_profiles").select("*").order("name").returns<BookingProfile[]>(),
    supabase.from("availability_rules").select("*").order("weekday").order("start_time"),
    supabase.from("blocked_times").select("*").order("starts_at", { ascending: false }).limit(20),
    getBookingTypeProfileAssignments()
  ]);
  const profileIdsByType = new Map<string, string[]>();
  for (const assignment of typeProfileAssignments) {
    const ids = profileIdsByType.get(assignment.booking_type_id) || [];
    ids.push(assignment.profile_id);
    profileIdsByType.set(assignment.booking_type_id, ids);
  }
  const rulesByWeekday = weekdays.map((day) => ({
    ...day,
    rules: (rules || []).filter((rule) => rule.weekday === day.value)
  }));

  async function saveBookingType(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const id = String(formData.get("id") || "");
    const selectedProfileIds = formData.getAll("profile_ids").map((value) => String(value));
    const payload = {
      slug: String(formData.get("slug") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      duration_minutes: Number(formData.get("duration_minutes")),
      buffer_before_minutes: Number(formData.get("buffer_before_minutes") || 0),
      buffer_after_minutes: Number(formData.get("buffer_after_minutes") || 0),
      sort_order: Number(formData.get("sort_order") || 0),
      profile_id: selectedProfileIds[0] || null,
      is_active: formData.get("is_active") === "on"
    };
    let savedId = id;

    if (id) {
      await supabase.from("booking_types").update(payload).eq("id", id);
    } else {
      const { data } = await supabase.from("booking_types").insert(payload).select("id").single<{ id: string }>();
      savedId = data?.id || "";
    }

    if (savedId) {
      await replaceBookingTypeProfileAssignments(savedId, selectedProfileIds);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book");
    revalidatePath("/admin/profiles");
  }

  async function saveAvailabilityGrid(formData: FormData) {
    "use server";

    await requireAdmin();
    const rawRules = String(formData.get("rules") || "[]");
    let parsedRules: Array<{ weekday: number; startTime: string; endTime: string }> = [];

    try {
      const value = JSON.parse(rawRules);
      parsedRules = Array.isArray(value) ? value : [];
    } catch {
      parsedRules = [];
    }

    const supabase = createSupabaseAdmin();
    await supabase.from("availability_rules").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (parsedRules.length > 0) {
      await supabase.from("availability_rules").insert(
        parsedRules
          .filter((rule) => rule.weekday >= 1 && rule.weekday <= 7 && rule.startTime < rule.endTime)
          .map((rule) => ({
            weekday: rule.weekday,
            start_time: rule.startTime,
            end_time: rule.endTime,
            timezone: "Europe/Berlin",
            is_active: true
          }))
      );
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book");
  }

  async function saveBlockedTime(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const title = String(formData.get("title") || "").trim();
    const startDate = String(formData.get("start_date") || "");
    const startTime = String(formData.get("start_time") || "");
    const endDate = String(formData.get("end_date") || "");
    const endTime = String(formData.get("end_time") || "");

    if (!title || !startDate || !startTime || !endDate || !endTime) {
      return;
    }

    const startsAt = new Date(`${startDate}T${startTime}`);
    const endsAt = new Date(`${endDate}T${endTime}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      return;
    }

    await supabase.from("blocked_times").insert({
      title,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: null
    });

    revalidatePath("/admin/settings");
    revalidatePath("/book");
  }

  async function deleteBlockedTime(formData: FormData) {
    "use server";

    await requireAdmin();
    const blockedTimeId = String(formData.get("blockedTimeId") || "");

    if (!blockedTimeId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    await supabase.from("blocked_times").delete().eq("id", blockedTimeId);

    revalidatePath("/admin/settings");
    revalidatePath("/book");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Einstellungen</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Verwalten Sie Terminarten, Dauer, Pufferzeiten und regelbasierte Verfügbarkeit für die Buchungsseite.
      </p>
      <AdminNav />

      <div className="mt-8">
        <AvailabilityGrid action={saveAvailabilityGrid} rules={rules || []} />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Blockierte Zeiten</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sperren Sie einzelne Zeiträume, ganze Tage oder längere Abwesenheiten zusätzlich zur normalen Wochenverfügbarkeit. Das eignet sich zum Beispiel für Urlaub,
          Feiertage, Krankheit, interne Termine oder Zeiten, in denen Sie keine Kundentermine annehmen möchten.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Beispiel: Wenn Montag grundsätzlich 09:00 bis 17:00 verfügbar ist, aber 13:00 bis 15:00 blockiert wird, erscheinen in diesem Zeitraum keine freien Slots.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Für ganze Tage wählen Sie als Startzeit 00:00 und als Endzeit 23:59. Für einzelne Sperrzeiten tragen Sie einfach die genaue Uhrzeit ein.
        </p>
        <form action={saveBlockedTime} className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_1fr_0.75fr_1fr_0.75fr_auto]">
          <CompactField label="Titel" name="title" defaultValue="Belegt" required />
          <CompactField label="Startdatum" name="start_date" type="date" required />
          <CompactField label="Startzeit" name="start_time" type="time" defaultValue="09:00" required />
          <CompactField label="Enddatum" name="end_date" type="date" required />
          <CompactField label="Endzeit" name="end_time" type="time" defaultValue="17:00" required />
          <div className="flex items-end">
            <SaveSubmitButton
              idleLabel="Zeit blockieren"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="h-10 whitespace-nowrap rounded-md bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          </div>
        </form>
        <h3 className="mt-4 text-sm font-semibold text-slate-950">Gespeicherte blockierte Zeiten</h3>
        <div className="mt-2 divide-y divide-slate-200">
          {(blockedTimes || []).map((blocked) => (
            <div key={blocked.id} className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-950">{blocked.title}</p>
                <p className="text-slate-500">
                  {formatDateTime(blocked.starts_at)} bis {formatDateTime(blocked.ends_at)}
                </p>
              </div>
              <AdminDeleteBlockedTimeButton action={deleteBlockedTime} blockedTimeId={blocked.id} title={blocked.title} />
            </div>
          ))}
          {blockedTimes?.length === 0 ? <p className="py-3 text-sm text-slate-500">Noch keine blockierten Zeiten vorhanden.</p> : null}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Terminarten</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kompakte Verwaltung von Dauer, Pufferzeiten und Sichtbarkeit auf der Buchungsseite.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {(types || []).map((type) => (
            <BookingTypeForm
              key={type.id}
              action={saveBookingType}
              type={type}
              profiles={profiles || []}
              assignedProfileIds={profileIdsByType.get(type.id) || (type.profile_id ? [type.profile_id] : [])}
            />
          ))}
        </div>
        <details className="rounded-lg border border-dashed border-slate-300 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Neue Terminart anlegen</summary>
          <div className="mt-4">
            <BookingTypeForm action={saveBookingType} isNew profiles={profiles || []} assignedProfileIds={(profiles || []).map((profile) => profile.id)} />
          </div>
        </details>
      </div>

      <details className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-semibold text-slate-950">Erweiterte Regelansicht</summary>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Diese Ansicht zeigt nur, welche technischen Regeln aus dem Tableau gespeichert wurden.
        </p>
        <div className="mt-4 divide-y divide-slate-200">
          {rulesByWeekday.map((day) => (
            <div key={day.value} className="grid gap-3 py-3 text-sm sm:grid-cols-[140px_1fr] sm:items-center">
              <p className="font-medium text-slate-950">{day.label}</p>
              <div className="flex flex-wrap gap-2">
                {day.rules.length > 0 ? (
                  day.rules.map((rule) => (
                    <span
                      key={rule.id}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        rule.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {formatRuleTime(rule.start_time)} bis {formatRuleTime(rule.end_time)}
                      {rule.is_active ? "" : " · inaktiv"}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">Keine Verfügbarkeit</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function BookingTypeForm({
  action,
  type,
  profiles,
  assignedProfileIds,
  isNew = false
}: {
  action: (formData: FormData) => Promise<void>;
  isNew?: boolean;
  profiles: BookingProfile[];
  assignedProfileIds: string[];
  type?: {
    id: string;
    profile_id?: string | null;
    slug: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    sort_order: number;
    is_active: boolean;
  };
}) {
  return (
    <form action={action} className={isNew ? "rounded-md border border-slate-200 bg-slate-50 p-4" : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"}>
      <input type="hidden" name="id" value={type?.id || ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-medium text-slate-700">In diesen Profilen anzeigen</legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Eine Terminart kann in mehreren Profilen sichtbar sein. Ohne Auswahl erscheint sie auf keiner öffentlichen Buchungsseite.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {profiles.map((profile) => (
              <label key={profile.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  name="profile_ids"
                  value={profile.id}
                  type="checkbox"
                  defaultChecked={assignedProfileIds.includes(profile.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <span>{profile.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <Field label="Name" name="name" defaultValue={type?.name || ""} required />
        </div>
        <div className="sm:col-span-2">
          <Field label="Slug" name="slug" defaultValue={type?.slug || ""} required />
        </div>
        <Field label="Dauer (Min.)" name="duration_minutes" type="number" defaultValue={String(type?.duration_minutes || 30)} required />
        <Field label="Sortierung" name="sort_order" type="number" defaultValue={String(type?.sort_order || 0)} />
        <Field label="Puffer davor (Min.)" name="buffer_before_minutes" type="number" defaultValue={String(type?.buffer_before_minutes || 0)} />
        <Field label="Puffer danach (Min.)" name="buffer_after_minutes" type="number" defaultValue={String(type?.buffer_after_minutes || 0)} />
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-medium text-slate-700">Beschreibung</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={type?.description || ""}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={type?.is_active ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Aktiv
        </label>
        <SaveSubmitButton idleLabel={type ? "Speichern" : "Terminart anlegen"} savedLabel={type ? "Gespeichert" : "Angelegt"} />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function CompactField({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatRuleTime(value: string) {
  return String(value).slice(0, 5);
}
