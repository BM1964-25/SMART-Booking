"use client";

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

type DeleteProfileButtonProps = {
  action: (formData: FormData) => Promise<void>;
  profileName: string;
};

export function DeleteProfileButton({ action, profileName }: DeleteProfileButtonProps) {
  return (
    <SubmitButton
      action={action}
      onClick={(event) => {
        const confirmed = window.confirm(
          `Soll das Profil „${profileName}“ wirklich gelöscht werden? Die zugehörigen Terminarten werden deaktiviert. Bestehende Buchungen bleiben in der Historie erhalten.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    />
  );
}

function SubmitButton({
  action,
  onClick
}: {
  action: (formData: FormData) => Promise<void>;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      formAction={action}
      formNoValidate
      type="submit"
      onClick={onClick}
      disabled={pending}
      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Wird gelöscht" : "Profil löschen"}
    </button>
  );
}
