import { AdminDeleteBookingTypeButton } from "@/components/admin-delete-booking-type-button";
import { BookingTypeIdentityFields } from "@/components/booking-type-identity-fields";
import { SaveSubmitButton } from "@/components/save-submit-button";
import { meetingLocationOptions } from "@/lib/meeting-location";
import { BookingProfile, BookingType } from "@/lib/types";

type ProfileBookingTypeGroup = {
  profile: BookingProfile;
  types: BookingType[];
};

type BookingTypeProfileTabsProps = {
  action: (formData: FormData) => Promise<void>;
  activeProfileId?: string;
  bookingCountsByType: Record<string, number>;
  deleteAction: (formData: FormData) => Promise<void>;
  groups: ProfileBookingTypeGroup[];
};

export function BookingTypeProfileTabs({ action, activeProfileId, bookingCountsByType, deleteAction, groups }: BookingTypeProfileTabsProps) {
  const activeGroup = groups.find((group) => group.profile.id === activeProfileId) || groups[0];

  if (!activeGroup) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Noch kein Profil vorhanden. Legen Sie zuerst ein Profil an.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-200 pb-4">
        <div>
          <p className="text-base font-semibold text-slate-950">Terminarten nach Profil</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Wählen Sie ein Profil aus. Die Tabs verwenden die Originalnamen der gespeicherten Profile.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200" role="tablist" aria-label="Profile für Terminarten">
          {groups.map((group) => {
            const isActive = group.profile.id === activeGroup.profile.id;
            const profileColor = isValidHexColor(group.profile.primary_color) ? group.profile.primary_color : "#527DF6";

            return (
              <a
                key={group.profile.id}
                href={`/admin/settings?bookingProfile=${encodeURIComponent(group.profile.id)}#terminarten`}
                role="tab"
                aria-selected={isActive}
                className={`relative -mb-px inline-flex items-center gap-2 rounded-t-md border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-brand-500 border-b-white bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-200"
                    : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
                style={isActive ? { borderTopColor: profileColor } : undefined}
              >
                <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: profileColor }} aria-hidden="true" />
                <span>{group.profile.name}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${group.profile.is_active ? "bg-emerald-500" : "bg-slate-300"}`} aria-label={group.profile.is_active ? "Aktiv" : "Inaktiv"} />
                <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                  {group.types.length}/4
                </span>
                {isActive ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: profileColor }} /> : null}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-5" role="tabpanel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{activeGroup.profile.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {activeGroup.types.length} von 4 Terminarten für diese öffentliche Buchungsseite.
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
              activeGroup.profile.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {activeGroup.profile.is_active ? "Profil aktiv" : "Profil inaktiv"}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {activeGroup.types.length > 4 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              Dieses Profil enthält mehr als vier Terminarten. Bitte reduzieren Sie die Auswahl auf die wichtigsten Angebote.
            </p>
          ) : null}
          {activeGroup.types.length > 0 ? (
            activeGroup.types.map((type, index) => (
              <BookingTypeForm
                key={type.id}
                action={action}
                bookingCount={bookingCountsByType[type.id] || 0}
                deleteAction={deleteAction}
                displaySortOrder={index + 1}
                profile={activeGroup.profile}
                type={type}
              />
            ))
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Für dieses Profil ist noch keine Terminart angelegt.
            </p>
          )}
          {activeGroup.types.length < 4 ? (
            <details className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                Neue Terminart für {activeGroup.profile.name} anlegen
              </summary>
              <div className="mt-4">
                <BookingTypeForm action={action} displaySortOrder={activeGroup.types.length + 1} profile={activeGroup.profile} isNew />
              </div>
            </details>
          ) : (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Die maximale Anzahl von vier Terminarten für dieses Profil ist erreicht.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function isValidHexColor(value?: string | null): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function BookingTypeForm({
  action,
  deleteAction,
  bookingCount = 0,
  displaySortOrder,
  type,
  profile,
  isNew = false
}: {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  bookingCount?: number;
  displaySortOrder: number;
  isNew?: boolean;
  profile: BookingProfile;
  type?: BookingType;
}) {
  const duration = type?.duration_minutes ?? 30;

  return (
    <form action={action} className={isNew ? "rounded-md border border-slate-200 bg-white p-4" : "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
      <input type="hidden" name="id" value={type?.id || ""} />
      <input type="hidden" name="profile_id" value={profile.id} />
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{type?.name || "Neue Terminart"}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                type?.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {type?.is_active ? "Aktiv" : "Inaktiv"}
            </span>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{duration} Minuten</span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">Sortierung {displaySortOrder}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Gehört zu Profil: {profile.name}</p>
        </div>
        <div className="flex items-center gap-3 lg:justify-end">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="is_active" type="checkbox" defaultChecked={type?.is_active ?? false} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Aktiv
          </label>
          <SaveSubmitButton idleLabel={type ? "Speichern" : "Terminart anlegen"} savedLabel={type ? "Gespeichert" : "Angelegt"} />
          {type && deleteAction ? (
            <AdminDeleteBookingTypeButton action={deleteAction} bookingCount={bookingCount} bookingTypeName={type.name} />
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        <fieldset className="h-full rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">Grunddaten</legend>
          <div className="grid gap-3">
            <BookingTypeIdentityFields defaultName={type?.name || ""} defaultSlug={type?.slug || ""} />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Beschreibung</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={type?.description || ""}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="h-full rounded-md border border-slate-200 bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">Zeitlogik</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Standard-Terminort</span>
              <select
                name="default_meeting_location"
                defaultValue={type?.default_meeting_location || "phone"}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {meetingLocationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs leading-5 text-slate-500">Wird im Buchungsformular vorgewählt und kann dort bei Bedarf geändert werden.</span>
            </label>
            <Field label="Dauer (Min.)" name="duration_minutes" type="number" defaultValue={String(type?.duration_minutes ?? 30)} required />
            <Field label="Sortierung" name="sort_order" type="number" defaultValue={String(displaySortOrder)} min={1} max={4} />
            <Field label="Puffer davor (Min.)" name="buffer_before_minutes" type="number" defaultValue={String(type?.buffer_before_minutes ?? 10)} />
            <Field label="Puffer danach (Min.)" name="buffer_after_minutes" type="number" defaultValue={String(type?.buffer_after_minutes ?? 15)} />
          </div>
        </fieldset>
      </div>
      <fieldset className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <legend className="px-1 text-sm font-semibold text-slate-800">Erinnerung</legend>
        <p className="text-xs leading-5 text-slate-500">
          Optionaler Hinweis per E-Mail vor dem Termin. Pro Buchung kann jede aktivierte Erinnerung einmal gesendet werden.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:items-start">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex min-h-10 items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">Erinnerung 1</span>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  name="reminder_enabled"
                  type="checkbox"
                  defaultChecked={type?.reminder_enabled ?? false}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                Aktiv
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">Zeitpunkt</span>
              <select
                name="reminder_minutes_before"
                defaultValue={String(type?.reminder_minutes_before ?? 30)}
                className="mt-2 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {reminderTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">Hinweistext</span>
              <input
                name="reminder_note"
                defaultValue={type?.reminder_note || defaultReminderNote}
                placeholder="Optionaler Hinweis für die erste Erinnerung."
                className="mt-2 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex min-h-10 items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">Erinnerung 2</span>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  name="reminder_2_enabled"
                  type="checkbox"
                  defaultChecked={type?.reminder_2_enabled ?? false}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                Aktiv
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">Zeitpunkt</span>
              <select
                name="reminder_2_minutes_before"
                defaultValue={String(type?.reminder_2_minutes_before ?? 1440)}
                className="mt-2 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {reminderTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">Hinweistext</span>
              <input
                name="reminder_2_note"
                defaultValue={type?.reminder_2_note || defaultSecondReminderNote}
                placeholder="Optionaler Hinweis für die zweite Erinnerung."
                className="mt-2 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Empfehlung: erste Erinnerung 30 Minuten vorher, zweite Erinnerung 1 Tag vorher.
        </p>
      </fieldset>
    </form>
  );
}

const reminderTimeOptions = [
  { value: "15", label: "15 Minuten vorher" },
  { value: "30", label: "30 Minuten vorher" },
  { value: "60", label: "1 Stunde vorher" },
  { value: "120", label: "2 Stunden vorher" },
  { value: "720", label: "12 Stunden vorher" },
  { value: "1440", label: "1 Tag vorher" },
  { value: "2880", label: "2 Tage vorher" },
  { value: "4320", label: "3 Tage vorher" }
];

const defaultReminderNote = "Dies ist eine kurze Erinnerung: Ihr Termin beginnt in 30 Minuten.";
const defaultSecondReminderNote = "Dies ist eine freundliche Erinnerung an Ihren Termin morgen.";

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false,
  min,
  max
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        required={required}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}
