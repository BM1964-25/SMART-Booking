"use client";

import { FormEvent, useRef, useState } from "react";
import { Check } from "lucide-react";
import { PrimaryButton } from "@/components/button";
import { meetingLocationOptions } from "@/lib/meeting-location";

const disabledMeetingLocations = new Set(["teams", "google_meet"]);

type BookingFormProps = {
  bookingTypeSlug: string;
  embedView?: boolean;
  profileSlug?: string;
  startsAt: string;
};

export function BookingForm({ bookingTypeSlug, embedView = false, profileSlug, startsAt }: BookingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const isSubmitting = status === "submitting" || status === "success";

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
        setStatus("success");
        setMessage("Termin gespeichert. Sie werden weitergeleitet.");
        window.setTimeout(() => {
          window.location.assign(result.redirectTo as string);
        }, 900);
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
    <form ref={formRef} noValidate onSubmit={submit} className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      <input type="hidden" name="bookingTypeSlug" value={bookingTypeSlug} />
      <input type="hidden" name="embedView" value={embedView ? "1" : "0"} />
      <input type="hidden" name="profileSlug" value={profileSlug || ""} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <Field label="Name" name="customerName" minLength={2} required />
      <Field label="E-Mail" name="customerEmail" type="email" required />
      <Field label="Unternehmen" name="company" minLength={2} required />
      <Field label="Telefonnummer" name="phone" type="tel" minLength={5} required />
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Terminort</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {meetingLocationOptions.map((option) => {
            const isDisabled = disabledMeetingLocations.has(option.value);

            return (
              <label
                key={option.value}
                aria-disabled={isDisabled}
                className={`group relative flex min-h-24 gap-3 rounded-md border p-4 text-left transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 ${
                  isDisabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : "cursor-pointer border-slate-300 bg-white hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name="meetingLocation"
                  value={option.value}
                  required
                  disabled={isDisabled}
                  defaultChecked={option.value === "phone"}
                  className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:text-slate-300"
                />
                <span className="block min-w-0">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-950">{option.label}</span>
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-slate-500">
                    {isDisabled ? "Diese Option wird später freigeschaltet." : option.description}
                  </span>
                  {isDisabled ? (
                    <span className="mt-3 inline-flex w-fit rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Später verfügbar
                    </span>
                  ) : (
                    <span className="mt-3 hidden w-fit rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white group-has-[:checked]:block">
                      Aktiv
                    </span>
                  )}
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
          required
          minLength={10}
          rows={5}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 invalid:border-red-300"
        />
        <span className="mt-1 block text-xs text-slate-500">Bitte mindestens 10 Zeichen eingeben.</span>
      </label>
      <label className="flex gap-3 text-sm leading-6 text-slate-700">
        <input
          type="checkbox"
          name="privacyAccepted"
          value="true"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 invalid:outline invalid:outline-2 invalid:outline-red-300"
        />
        <span>Ich habe die Datenschutzhinweise gelesen und stimme zu, dass meine Angaben zur Bearbeitung der Terminanfrage verarbeitet werden.</span>
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
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
