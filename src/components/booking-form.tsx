"use client";

import { FormEvent, useState } from "react";
import { Check } from "lucide-react";
import { PrimaryButton } from "@/components/button";

type BookingFormProps = {
  bookingTypeSlug: string;
  startsAt: string;
};

export function BookingForm({ bookingTypeSlug, startsAt }: BookingFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const isSubmitting = status === "submitting" || status === "success";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("Termin wird geprüft und gespeichert.");

    const form = event.currentTarget;
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
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      <input type="hidden" name="bookingTypeSlug" value={bookingTypeSlug} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <Field label="Name" name="customerName" required />
      <Field label="E-Mail" name="customerEmail" type="email" required />
      <Field label="Unternehmen" name="company" required />
      <Field label="Telefonnummer optional" name="phone" />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Terminort</span>
        <select
          name="meetingLocation"
          required
          defaultValue="phone"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="phone">Telefon</option>
          <option value="zoom">Zoom</option>
          <option value="google_meet">Google Meet</option>
          <option value="onsite">Vor Ort</option>
          <option value="individual">Individuell abstimmen</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Anliegen</span>
        <textarea
          name="topic"
          required
          rows={5}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <label className="flex gap-3 text-sm leading-6 text-slate-700">
        <input type="checkbox" name="privacyAccepted" value="true" required className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600" />
        <span>Ich habe die Datenschutzhinweise gelesen und stimme zu, dass meine Angaben zur Bearbeitung der Terminanfrage verarbeitet werden.</span>
      </label>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton disabled={isSubmitting}>
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
        {message ? <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}
