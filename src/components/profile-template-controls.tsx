"use client";

type ProfileTemplateData = Record<string, string | number | boolean | null>;

type ProfileTemplateOption = {
  id: string;
  name: string;
  description: string;
  data: ProfileTemplateData;
  kind: "standard" | "saved";
};

const standardTemplates: ProfileTemplateOption[] = [
  {
    id: "standard-consulting",
    name: "Beratung Professional",
    description: "Klarer Standard für Beratung, Erstgespräche und Dienstleistungsprofile.",
    kind: "standard",
    data: {
      headline: "Termin buchen",
      subheadline: "Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch oder eine persönliche Beratung.",
      primary_color: "#527DF6",
      profile_card_bg_color: "#F8FAFC",
      booking_card_bg_color: "#FFFFFF",
      show_subheadline: true,
      show_contact_name: true,
      show_contact_email: true,
      show_contact_phone: true,
      show_website: true,
      show_linkedin: true,
      show_xing: false,
      show_x: false,
      show_instagram: false,
      show_facebook: false,
      show_youtube: false
    }
  },
  {
    id: "standard-compact",
    name: "Kompakt Premium",
    description: "Reduzierte Darstellung mit ruhiger Farbwirkung und weniger Kontaktkanälen.",
    kind: "standard",
    data: {
      headline: "Persönlichen Termin vereinbaren",
      subheadline: "Buchen Sie direkt einen freien Termin. Die Bestätigung erhalten Sie automatisch per E-Mail.",
      primary_color: "#0F766E",
      profile_card_bg_color: "#F0FDFA",
      booking_card_bg_color: "#FFFFFF",
      show_subheadline: true,
      show_contact_name: true,
      show_contact_email: true,
      show_contact_phone: false,
      show_website: true,
      show_linkedin: true,
      show_xing: false,
      show_x: false,
      show_instagram: false,
      show_facebook: false,
      show_youtube: false
    }
  }
];

export function ProfileTemplateControls({
  savedTemplates,
  saveAction
}: {
  savedTemplates: { id: string; name: string; template_data: ProfileTemplateData }[];
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const templates = [
    ...standardTemplates,
    ...savedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: "Eigene gespeicherte Vorlage aus einem bestehenden Profil.",
      kind: "saved" as const,
      data: template.template_data
    }))
  ];

  return (
    <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">Profilvorlagen</legend>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Nutzen Sie eine Standardvorlage oder speichern Sie das aktuelle Profil als eigene Vorlage. Profilname und Slug bleiben beim Übernehmen unverändert.
        </p>
        <button
          formAction={saveAction}
          formNoValidate
          type="submit"
          className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
        >
          Als Standardvorlage speichern
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <button
            key={`${template.kind}-${template.id}`}
            type="button"
            onClick={(event) => applyTemplate(event.currentTarget, template.data)}
            className="rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-slate-950">{template.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{template.kind === "standard" ? "Standard" : "Gespeichert"}</span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{template.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function applyTemplate(button: HTMLButtonElement, data: ProfileTemplateData) {
  const form = button.closest("form");

  if (!form) {
    return;
  }

  Object.entries(data).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);

    if (!field) {
      return;
    }

    if (field instanceof RadioNodeList) {
      const firstField = field[0];

      if (firstField instanceof HTMLInputElement && firstField.type === "checkbox") {
        firstField.checked = Boolean(value);
      }

      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(value);
      field.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value == null ? "" : String(value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}
