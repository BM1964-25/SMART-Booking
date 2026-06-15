"use client";

import { useMemo, useState } from "react";

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
      preheadline: "Terminplanung",
      headline: "Termin buchen",
      subheadline: "Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch oder eine persönliche Beratung.",
      primary_color: "#527DF6",
      profile_card_bg_color: "#F8FAFC",
      booking_card_bg_color: "#FFFFFF",
      show_preheadline: true,
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
      show_youtube: false,
      show_spotify: false,
      show_legal_privacy: true,
      show_legal_imprint: true
    }
  },
  {
    id: "standard-compact",
    name: "Kompakt Premium",
    description: "Reduzierte Darstellung mit ruhiger Farbwirkung und weniger Kontaktkanälen.",
    kind: "standard",
    data: {
      preheadline: "Online buchbar",
      headline: "Persönlichen Termin vereinbaren",
      subheadline: "Buchen Sie direkt einen freien Termin. Die Bestätigung erhalten Sie automatisch per E-Mail.",
      primary_color: "#0F766E",
      profile_card_bg_color: "#F0FDFA",
      booking_card_bg_color: "#FFFFFF",
      show_preheadline: true,
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
      show_youtube: false,
      show_spotify: false,
      show_legal_privacy: true,
      show_legal_imprint: true
    }
  }
];

export function ProfileTemplateControls({
  savedTemplates,
  currentData,
  saveAction,
  deleteAction
}: {
  savedTemplates: { id: string; name: string; template_data: ProfileTemplateData }[];
  currentData?: ProfileTemplateData | null;
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const allTemplates = [
    ...standardTemplates,
    ...savedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: "Eigene gespeicherte Vorlage aus einem bestehenden Profil.",
      kind: "saved" as const,
      data: template.template_data
    }))
  ];
  const templates = allTemplates.slice(0, 4);
  const hiddenTemplateCount = Math.max(0, allTemplates.length - templates.length);
  const initialActiveTemplateKey = useMemo(
    () => templates.find((template) => currentData && templateMatches(currentData, template.data))?.id || null,
    [currentData, templates]
  );
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>(initialActiveTemplateKey);

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
          <div
            key={`${template.kind}-${template.id}`}
            className={`flex min-h-36 flex-col rounded-md border bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-sm ${
              activeTemplateKey === template.id ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={(event) => {
                applyTemplate(event.currentTarget, template.data);
                setActiveTemplateKey(template.id);
              }}
              className="flex flex-1 flex-col text-left focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-slate-950">{template.name}</span>
                <span className="flex flex-wrap justify-end gap-1">
                  {activeTemplateKey === template.id ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CheckIcon />
                      Aktiv
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {template.kind === "standard" ? "Standard" : "Gespeichert"}
                  </span>
                </span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{template.description}</span>
            </button>
            {template.kind === "saved" ? (
              <button
                formAction={deleteAction}
                formNoValidate
                name="template_id"
                value={template.id}
                type="submit"
                className="mt-3 inline-flex w-fit rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Löschen
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {hiddenTemplateCount > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          {hiddenTemplateCount} weitere Vorlage{hiddenTemplateCount === 1 ? "" : "n"} ist ausgeblendet. Es werden maximal vier Vorlagen angezeigt.
        </p>
      ) : null}
    </fieldset>
  );
}

function templateMatches(currentData: ProfileTemplateData, templateData: ProfileTemplateData) {
  return Object.entries(templateData).every(([key, value]) => normalizeTemplateValue(currentData[key]) === normalizeTemplateValue(value));
}

function normalizeTemplateValue(value: ProfileTemplateData[string]) {
  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3">
      <path fill="currentColor" d="M6.4 11.3 2.9 7.8l1.2-1.2 2.3 2.3 5.5-5.5 1.2 1.2-6.7 6.7Z" />
    </svg>
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
