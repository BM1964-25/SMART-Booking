"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

type AdminDeleteBookingTypeButtonProps = {
  action: (formData: FormData) => Promise<void>;
  bookingCount: number;
  bookingTypeName: string;
};

export function AdminDeleteBookingTypeButton({ action, bookingCount, bookingTypeName }: AdminDeleteBookingTypeButtonProps) {
  const canDelete = bookingCount === 0;

  return (
    <SubmitButton action={action} bookingTypeName={bookingTypeName} canDelete={canDelete} bookingCount={bookingCount} />
  );
}

function SubmitButton({
  action,
  bookingTypeName,
  canDelete,
  bookingCount
}: {
  action: (formData: FormData) => Promise<void>;
  bookingTypeName: string;
  canDelete: boolean;
  bookingCount: number;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={action}
      disabled={pending || !canDelete}
      title={canDelete ? "Terminart löschen" : `Kann nicht gelöscht werden, weil ${bookingCount} Buchung(en) vorhanden sind.`}
      aria-label={pending ? "Terminart wird gelöscht" : "Terminart löschen"}
      onClick={(event) => {
        if (!canDelete) {
          event.preventDefault();
          return;
        }

        const confirmed = window.confirm(
          `Soll die Terminart „${bookingTypeName}“ wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
