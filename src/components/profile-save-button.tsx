"use client";

import { Check } from "lucide-react";
import { useProfileSaveStatus } from "@/components/profile-save-form";

export function ProfileSaveButton({
  isNewProfile = false
}: {
  isNewProfile?: boolean;
}) {
  const { isPending, state } = useProfileSaveStatus();
  const isSaved = state.status === "success";

  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-400"
      type="submit"
      disabled={isPending}
      aria-live="polite"
    >
      {isSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
      {isPending ? "Speichert ..." : isSaved ? "Gespeichert" : isNewProfile ? "Profil anlegen" : "Profil speichern"}
    </button>
  );
}
