"use client";

import { useState } from "react";

type EmbedCodeOptionsProps = {
  allowEmbedView: boolean;
  embedUrl: string;
  publicUrl: string;
};

const buttonClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700";

export function EmbedCodeOptions({ allowEmbedView, embedUrl, publicUrl }: EmbedCodeOptionsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const variants = [
    {
      key: "link",
      title: "Buchungslink",
      description: "Öffnet die Buchungsseite als eigene Seite mit SMART-Booking-Header und Footer.",
      value: publicUrl
    },
    {
      key: "button",
      title: "Button-Code",
      description: "HTML-Code für einen Terminbutton auf einer externen Website.",
      value: `<a href="${publicUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#527DF6;color:#fff;padding:12px 18px;font-weight:700;text-decoration:none;">Termin buchen</a>`
    },
    {
      key: "premium-link",
      title: "Premium-Link",
      description: allowEmbedView
        ? "Öffnet die Buchungsseite ohne SMART-Booking-Header und Footer."
        : "Premium-Funktion: wird erst nach Freischaltung ohne Header und Footer aktiv.",
      value: allowEmbedView ? embedUrl : "Premium-Einbettung im Profil freischalten, um den Premium-Link zu verwenden.",
      disabled: !allowEmbedView
    }
  ];

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Link- und Button-Code für Website kopieren</summary>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {variants.map((variant) => (
          <div key={variant.key} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{variant.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{variant.description}</p>
              </div>
              <button type="button" className={buttonClass} disabled={variant.disabled} onClick={() => copyText(variant.key, variant.value)}>
                {copiedKey === variant.key ? "Kopiert" : "Kopieren"}
              </button>
            </div>
            <textarea
              readOnly
              value={variant.value}
              rows={3}
              className="mt-3 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700"
            />
          </div>
        ))}
      </div>
    </details>
  );
}
