"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { PrimaryButton } from "@/components/button";
import { MeetingLocationIcon } from "@/components/meeting-location-icon";
import { MeetingLocation, meetingLocationOptions } from "@/lib/meeting-location";

type BookingFormDraft = {
  company?: string;
  customerEmail?: string;
  customerName?: string;
  meetingLocation?: string;
  phone?: string;
  privacyAccepted?: boolean;
  topic?: string;
};

type BookingFormProps = {
  availableMeetingLocations?: MeetingLocation[];
  bookingTypeSlug: string;
  defaultMeetingLocation?: MeetingLocation | null;
  embedView?: boolean;
  profileSlug?: string;
  startsAt: string;
};

export function BookingForm({
  availableMeetingLocations = [...meetingLocationOptions.map((option) => option.value)],
  bookingTypeSlug,
  defaultMeetingLocation = "phone",
  embedView = false,
  profileSlug,
  startsAt
}: BookingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const isSubmitting = status === "submitting" || status === "success";
  const draftKey = useMemo(() => `smart-booking:draft:${profileSlug || "default"}:${bookingTypeSlug}:${startsAt}`, [bookingTypeSlug, profileSlug, startsAt]);
  const availableMeetingLocationSet = useMemo(() => new Set(availableMeetingLocations), [availableMeetingLocations]);
  const visibleMeetingOptions = useMemo(
    () => meetingLocationOptions.filter((option) => availableMeetingLocationSet.has(option.value)),
    [availableMeetingLocationSet]
  );
  const selectableDefaultMeetingLocation =
    defaultMeetingLocation && availableMeetingLocationSet.has(defaultMeetingLocation)
      ? defaultMeetingLocation
      : availableMeetingLocationSet.has("phone")
        ? "phone"
        : visibleMeetingOptions[0]?.value;

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    try {
      const savedDraft = window.sessionStorage.getItem(draftKey);

      if (!savedDraft) {
        return;
      }

      restoreDraft(form, JSON.parse(savedDraft) as BookingFormDraft);
      setMessage("Ihre Eingaben wurden wiederhergestellt. Bitte prüfen Sie die Angaben und senden Sie die Buchung erneut ab.");
    } catch {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  function persistDraft(form: HTMLFormElement) {
    try {
      const formData = new FormData(form);
      const draft: BookingFormDraft = {
        company: String(formData.get("company") || ""),
        customerEmail: String(formData.get("customerEmail") || ""),
        customerName: String(formData.get("customerName") || ""),
        meetingLocation: String(formData.get("meetingLocation") || ""),
        phone: String(formData.get("phone") || ""),
        privacyAccepted: formData.get("privacyAccepted") === "true",
        topic: String(formData.get("topic") || "")
      };

      window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Storage is optional. The booking flow must still work without it.
    }
  }

  function validateForm(form: HTMLFormElement) {
    if (form.checkValidity()) {
      return true;
    }

    setStatus("idle");
    setMessage("Bitte ergänzen Sie das markierte Pflichtfeld. Ihre bisherigen Eingaben bleiben erhalten.");

    const firstInvalidField = form.querySelector<HTMLElement>("input:invalid, select:invalid, textarea:invalid");
    firstInvalidField?.scrollIntoView({ block: "center", behavior: "smooth" });
    firstInvalidField?.focus();

    window.requestAnimationFrame(() => {
      form.reportValidity();
    });

    return false;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    persistDraft(form);

    if (!validateForm(form)) {
      return;
    }

    setStatus("submitting");
    setMessage("Termin wird geprüft und gespeichert.");

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        body: formData,
        headers: {
          "x-smart-booking-ajax": "1"
        }
      });
      const result = (await response.json()) as { redirectTo?: string; error?: string };

      if (result.redirectTo) {
        const isSuccessRedirect = result.redirectTo.startsWith("/success") || result.redirectTo.includes("/success?");

        setStatus(isSuccessRedirect ? "success" : "submitting");
        setMessage(isSuccessRedirect ? "Termin gespeichert. Sie werden weitergeleitet." : "Die Buchung konnte nicht abgeschlossen werden. Sie werden zur Hinweisseite weitergeleitet.");

        if (isSuccessRedirect) {
          window.sessionStorage.removeItem(draftKey);
        }

        window.location.assign(result.redirectTo);
        return;
      }

      setMessage(result.error || "Die Buchung konnte nicht abgeschlossen werden.");
      setStatus("idle");
    } catch {
      setMessage("Die Buchung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
      setStatus("idle");
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      onChange={(event) => persistDraft(event.currentTarget)}
      onInput={(event) => persistDraft(event.currentTarget)}
      onSubmit={submit}
      className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-5"
    >
      <input type="hidden" name="bookingTypeSlug" value={bookingTypeSlug} />
      <input type="hidden" name="embedView" value={embedView ? "1" : "0"} />
      <input type="hidden" name="profileSlug" value={profileSlug || ""} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <p className="text-xs leading-5 text-slate-500">Mit * markierte Felder sind Pflichtfelder.</p>
      <Field label="Name" name="customerName" minLength={2} required />
      <Field label="E-Mail" name="customerEmail" type="email" required />
      <Field label="Unternehmen" name="company" minLength={2} required />
      <Field label="Telefonnummer" name="phone" type="tel" minLength={5} required />
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">
          Terminort <RequiredMark />
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMeetingOptions.map((option) => {
            const isServiceIcon = option.value === "zoom" || option.value === "teams" || option.value === "google_meet";
            const iconShellClassName = isServiceIcon
              ? "inline-flex h-10 w-10 shrink-0 items-center justify-center"
              : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 transition group-has-[:checked]:bg-brand-500 group-has-[:checked]:text-white";
            const iconClassName =
              option.value === "google_meet" || option.value === "teams"
                ? "h-10 w-10"
                : option.value === "zoom"
                  ? "h-9 w-9"
                  : "h-7 w-7";

            return (
              <label
                key={option.value}
                className={[
                  "group relative flex min-h-24 gap-3 rounded-md border p-4 text-left transition",
                  "cursor-pointer border-slate-300 bg-white hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="meetingLocation"
                  value={option.value}
                  required
                  defaultChecked={option.value === selectableDefaultMeetingLocation}
                  className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="block min-w-0">
                  <span className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-950">
                      <span
                        className={iconShellClassName}
                      >
                        <MeetingLocationIcon value={option.value} className={iconClassName} />
                      </span>
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-slate-500">{option.description}</span>
                  <span className="mt-3 hidden w-fit rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white group-has-[:checked]:block">
                    Aktiv
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Anliegen</span>
        <textarea
          name="topic"
          rows={5}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 invalid:border-red-300"
        />
        <span className="mt-1 block text-xs text-slate-500">Optional, wenn die gewählte Terminart Ihr Anliegen bereits eindeutig beschreibt.</span>
      </label>
      <label className="flex gap-3 text-sm leading-6 text-slate-700">
        <input
          type="checkbox"
          name="privacyAccepted"
          value="true"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 invalid:outline invalid:outline-2 invalid:outline-red-300"
        />
        <span>
          Ich habe die Datenschutzhinweise gelesen und stimme zu, dass meine Angaben zur Bearbeitung der Terminanfrage verarbeitet werden. <RequiredMark />
        </span>
      </label>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton
            disabled={isSubmitting}
            onClick={(event) => {
              const form = formRef.current;

              if (form && !validateForm(form)) {
                event.preventDefault();
              }
            }}
          >
            {status === "success" ? "Termin gespeichert" : status === "submitting" ? "Termin wird gebucht" : "Termin verbindlich buchen"}
          </PrimaryButton>
          {status === "success" ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              Termin gespeichert
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Bitte nur einmal absenden. Nach dem Speichern wird der Termin automatisch im Kalender eingetragen.
        </p>
        {message ? (
          <p aria-live="polite" className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function restoreDraft(form: HTMLFormElement, draft: BookingFormDraft) {
  setFieldValue(form, "customerName", draft.customerName);
  setFieldValue(form, "customerEmail", draft.customerEmail);
  setFieldValue(form, "company", draft.company);
  setFieldValue(form, "phone", draft.phone);
  setFieldValue(form, "topic", draft.topic);

  if (draft.meetingLocation) {
    const radio = form.querySelector<HTMLInputElement>(`input[name="meetingLocation"][value="${CSS.escape(draft.meetingLocation)}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  const privacy = form.elements.namedItem("privacyAccepted");
  if (privacy instanceof HTMLInputElement) {
    privacy.checked = draft.privacyAccepted === true;
  }
}

function setFieldValue(form: HTMLFormElement, name: string, value?: string) {
  if (value === undefined) {
    return;
  }

  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.value = value;
  }
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  minLength
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <>
            {" "}
            <RequiredMark />
          </>
        ) : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 invalid:border-red-300"
      />
    </label>
  );
}

function RequiredMark() {
  return (
    <span aria-label="Pflichtfeld" className="text-red-500">
      *
    </span>
  );
}
