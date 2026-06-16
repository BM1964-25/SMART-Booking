"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkField({ disabled = false, value }: { disabled?: boolean; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (disabled) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={value}
        className={`min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 font-mono text-xs ${
          disabled ? "bg-slate-50 text-slate-400" : "bg-white text-slate-700"
        }`}
      />
      <button
        type="button"
        onClick={copyLink}
        disabled={disabled}
        aria-label={copied ? "Link wurde kopiert" : "Link kopieren"}
        title={copied ? "Kopiert" : "Link kopieren"}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
