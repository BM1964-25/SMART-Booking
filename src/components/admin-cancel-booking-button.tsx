"use client";

import { useFormStatus } from "react-dom";

type AdminCancelBookingButtonProps = {
  action: (formData: FormData) => Promise<void>;
  bookingId: string;
  customerName: string;
};

export function AdminCancelBookingButton({ action, bookingId, customerName }: AdminCancelBookingButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Soll der Termin mit ${customerName} wirklich gelöscht werden? Der Kalendereintrag wird entfernt und der Kunde wird per E-Mail informiert, sobald E-Mail-Versand konfiguriert ist.`
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
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Wird gelöscht" : "Löschen"}
    </button>
  );
}
