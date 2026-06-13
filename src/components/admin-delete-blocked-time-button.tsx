"use client";

import { useFormStatus } from "react-dom";

type AdminDeleteBlockedTimeButtonProps = {
  action: (formData: FormData) => Promise<void>;
  blockedTimeId: string;
  title: string;
};

export function AdminDeleteBlockedTimeButton({ action, blockedTimeId, title }: AdminDeleteBlockedTimeButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(`Soll die blockierte Zeit „${title}“ wirklich gelöscht werden?`);

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="blockedTimeId" value={blockedTimeId} />
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
