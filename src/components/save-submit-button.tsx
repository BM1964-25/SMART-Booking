"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

type SaveSubmitButtonProps = {
  className?: string;
  idleLabel: string;
  pendingLabel?: string;
  savedLabel?: string;
};

export function SaveSubmitButton({
  className = "rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300",
  idleLabel,
  pendingLabel = "Wird gespeichert",
  savedLabel = "Gespeichert"
}: SaveSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [wasPending, setWasPending] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (pending) {
      setWasPending(true);
      setShowSaved(false);
      return;
    }

    if (!wasPending) {
      return;
    }

    setWasPending(false);
    setShowSaved(true);
    const timeout = window.setTimeout(() => setShowSaved(false), 2500);

    return () => window.clearTimeout(timeout);
  }, [pending, wasPending]);

  return (
    <button type="submit" disabled={pending} className={`inline-flex items-center justify-center gap-2 ${className}`} aria-live="polite">
      {showSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
      {pending ? pendingLabel : showSaved ? savedLabel : idleLabel}
    </button>
  );
}
