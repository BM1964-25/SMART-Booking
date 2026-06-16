"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type AdminDeleteBookingButtonProps = {
  action: (formData: FormData) => Promise<void>;
  bookingId: string;
  customerName: string;
};

export function AdminDeleteBookingButton({ action, bookingId, customerName }: AdminDeleteBookingButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Soll der Termin mit ${customerName} wirklich gelöscht werden? Das entfernt den Buchungseintrag dauerhaft aus der Übersicht.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Buchung löschen"
      aria-label={pending ? "Buchung wird gelöscht" : "Buchung löschen"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
