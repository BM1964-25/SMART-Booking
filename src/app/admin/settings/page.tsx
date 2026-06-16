import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminDeleteBlockedTimeButton } from "@/components/admin-delete-blocked-time-button";
import { AvailabilityGrid } from "@/components/availability-grid";
import { BookingTypeProfileTabs } from "@/components/booking-type-profile-tabs";
import { SaveSubmitButton } from "@/components/save-submit-button";
import { requireAdmin } from "@/lib/admin";
import { getBookingTypeProfileAssignments, replaceBookingTypeProfileAssignments } from "@/lib/booking-type-profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile, BookingType } from "@/lib/types";

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

export default async function AdminSettingsPage({ searchParams }: { searchParams?: Promise<{ bookingProfile?: string; bookingTypeError?: string; bookingTypeSaved?: string }> }) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const activeBookingProfileId = resolvedSearchParams?.bookingProfile;
  const bookingTypeError = resolvedSearchParams?.bookingTypeError || "";
  const bookingTypeSaved = resolvedSearchParams?.bookingTypeSaved || "";
  const supabase = createSupabaseAdmin();
  const [{ data: types }, { data: profiles }, { data: rules }, { data: blockedTimes }, { data: bookingsForTypes }, typeProfileAssignments] = await Promise.all([
    supabase.from("booking_types").select("*").order("sort_order").returns<BookingType[]>(),
    supabase.from("booking_profiles").select("*").order("name").returns<BookingProfile[]>(),
    supabase.from("availability_rules").select("*").order("weekday").order("start_time"),
    supabase.from("blocked_times").select("*").order("starts_at", { ascending: false }).limit(20),
    supabase.from("bookings").select("booking_type_id").returns<Array<{ booking_type_id: string }>>(),
    getBookingTypeProfileAssignments()
  ]);
  const profileIdsByType = new Map<string, string[]>();
  for (const assignment of typeProfileAssignments) {
    const ids = profileIdsByType.get(assignment.booking_type_id) || [];
    ids.push(assignment.profile_id);
    profileIdsByType.set(assignment.booking_type_id, ids);
  }
  const resolveBookingTypeProfileId = (type: BookingType) => type.profile_id || profileIdsByType.get(type.id)?.[0] || "";
  const typesByProfile = (profiles || []).map((profile) => ({
    profile,
    types: (types || []).filter((type) => resolveBookingTypeProfileId(type) === profile.id)
  }));
  const unassignedTypes = (types || []).filter((type) => !resolveBookingTypeProfileId(type));
  const bookingCountsByType = new Map<string, number>();
  for (const booking of bookingsForTypes || []) {
    bookingCountsByType.set(booking.booking_type_id, (bookingCountsByType.get(booking.booking_type_id) || 0) + 1);
  }
  const bookingCountsByTypeRecord = Object.fromEntries(bookingCountsByType);
  const rulesByWeekday = weekdays.map((day) => ({
    ...day,
    rules: (rules || []).filter((rule) => rule.weekday === day.value)
  }));

  async function saveBookingType(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const id = String(formData.get("id") || "");
    const profileId = String(formData.get("profile_id") || "");
    const name = String(formData.get("name") || "").trim();

    if (!profileId || !name) {
      redirect(bookingTypeRedirect(profileId, { error: "Bitte Profil und Name der Terminart ausfüllen." }));
    }

    const { data: profileTypes } = await supabase
      .from("booking_types")
      .select("id")
      .eq("profile_id", profileId)
      .returns<Array<{ id: string }>>();
    const otherProfileTypes = (profileTypes || []).filter((type) => type.id !== id);
    const isAlreadyInProfile = (profileTypes || []).some((type) => type.id === id);

    if (!isAlreadyInProfile && otherProfileTypes.length >= 4) {
      redirect(bookingTypeRedirect(profileId, { error: "Pro Profil sind maximal vier Terminarten vorgesehen." }));
    }
    const requestedSlug = slugify(String(formData.get("slug") || name));
    const uniqueSlug = await createUniqueBookingTypeSlug(supabase, requestedSlug || name, id, profileId);

    const payload = {
      slug: uniqueSlug,
      name,
      description: nullableText(formData.get("description")),
      duration_minutes: Number(formData.get("duration_minutes") || 30),
      buffer_before_minutes: Number(formData.get("buffer_before_minutes") || 10),
      buffer_after_minutes: Number(formData.get("buffer_after_minutes") || 15),
      sort_order: clampSortOrder(formData.get("sort_order")),
      profile_id: profileId,
      is_active: formData.get("is_active") === "on"
    };
    let savedId = id;
    let saved:
      | {
          id: string;
          description: string | null;
          buffer_before_minutes: number | null;
          buffer_after_minutes: number | null;
          profile_id: string | null;
        }
      | null
      | undefined;

    if (id) {
      const { data, error } = await supabase
        .from("booking_types")
        .update(payload)
        .eq("id", id)
        .select("id, description, buffer_before_minutes, buffer_after_minutes, profile_id")
        .single<typeof saved>();

      if (error) {
        redirect(bookingTypeRedirect(profileId, { error: error.message || "Terminart konnte nicht gespeichert werden." }));
      }

      saved = data;
    } else {
      const { data, error } = await supabase
        .from("booking_types")
        .insert(payload)
        .select("id, description, buffer_before_minutes, buffer_after_minutes, profile_id")
        .single<typeof saved>();

      if (error) {
        redirect(bookingTypeRedirect(profileId, { error: error.message || "Terminart konnte nicht angelegt werden." }));
      }

      savedId = data?.id || "";
      saved = data;
    }

    if (!savedId || !bookingTypeSaveMatches(saved, payload)) {
      redirect(bookingTypeRedirect(profileId, { error: "Terminart wurde nicht vollständig gespeichert. Bitte erneut versuchen." }));
    }

    await replaceBookingTypeProfileAssignments(savedId, [profileId]);

    revalidatePath("/admin/settings");
    revalidatePath("/book");
    revalidatePath("/admin/profiles");
    redirect(bookingTypeRedirect(profileId, { saved: savedId }));
  }

  async function deleteBookingType(formData: FormData) {
    "use server";

    await requireAdmin();
    const bookingTypeId = String(formData.get("id") || "");

    if (!bookingTypeId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_type_id", bookingTypeId);

    if ((count || 0) > 0) {
      return;
    }

    await supabase.from("booking_type_profiles").delete().eq("booking_type_id", bookingTypeId);
    await supabase.from("booking_types").delete().eq("id", bookingTypeId);

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

      <div id="terminarten" className="mt-8 scroll-mt-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Terminarten</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verwalten Sie die Terminarten direkt im jeweiligen Profil. Pro Profil sind bis zu vier Terminarten vorgesehen, inklusive eigener Sortierung.
          </p>
        </div>
        {bookingTypeError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{bookingTypeError}</p>
        ) : null}
        {bookingTypeSaved ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Terminart wurde gespeichert.</p>
        ) : null}
        <BookingTypeProfileTabs
          action={saveBookingType}
          activeProfileId={activeBookingProfileId}
          bookingCountsByType={bookingCountsByTypeRecord}
          deleteAction={deleteBookingType}
          groups={typesByProfile}
        />
        {unassignedTypes.length > 0 ? (
          <details className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-amber-950">Nicht zugeordnete Terminarten prüfen</summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              <p>Diese Terminarten haben noch kein Profil und erscheinen deshalb nicht auf einer öffentlichen Profilseite.</p>
              <ul className="list-disc space-y-1 pl-5">
                {unassignedTypes.map((type) => (
                  <li key={type.id}>{type.name}</li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}
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

function bookingTypeRedirect(profileId: string, result?: { error?: string; saved?: string }) {
  const params = new URLSearchParams();

  if (profileId) {
    params.set("bookingProfile", profileId);
  }

  if (result?.error) {
    params.set("bookingTypeError", result.error);
  }

  if (result?.saved) {
    params.set("bookingTypeSaved", result.saved);
  }

  return `/admin/settings?${params.toString()}#terminarten`;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function bookingTypeSaveMatches(
  data:
    | {
        description: string | null;
        buffer_before_minutes: number | null;
        buffer_after_minutes: number | null;
        profile_id: string | null;
      }
    | null
    | undefined,
  payload: {
    description: string | null;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
    profile_id: string;
  }
) {
  return (
    String(data?.description || "").trim() === String(payload.description || "").trim() &&
    Number(data?.buffer_before_minutes || 0) === payload.buffer_before_minutes &&
    Number(data?.buffer_after_minutes || 0) === payload.buffer_after_minutes &&
    data?.profile_id === payload.profile_id
  );
}

async function createUniqueBookingTypeSlug(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  requestedSlug: string,
  currentId: string,
  profileId: string
) {
  const baseSlug = slugify(requestedSlug) || "terminart";
  const { data: profile } = await supabase.from("booking_profiles").select("slug").eq("id", profileId).maybeSingle<{ slug: string | null }>();
  const profileSuffix = slugify(profile?.slug || profileId.slice(0, 8));
  const candidates = [baseSlug, `${baseSlug}-${profileSuffix}`];

  for (let index = 2; index <= 20; index += 1) {
    candidates.push(`${baseSlug}-${profileSuffix}-${index}`);
  }

  const { data: existingTypes } = await supabase.from("booking_types").select("id, slug").in("slug", candidates).returns<Array<{ id: string; slug: string }>>();
  const existingBySlug = new Map((existingTypes || []).map((type) => [type.slug, type.id]));

  for (const candidate of candidates) {
    const existingId = existingBySlug.get(candidate);

    if (!existingId || existingId === currentId) {
      return candidate;
    }
  }

  return `${baseSlug}-${profileSuffix}-${Date.now()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function clampSortOrder(value: FormDataEntryValue | null) {
  const number = Number(value || 1);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(4, Math.max(1, Math.trunc(number)));
}
