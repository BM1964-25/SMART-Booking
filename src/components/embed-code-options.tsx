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
      title: "Standard-Link",
      description: "Für einfache Kunden: öffnet die Buchungsseite mit SMART-Booking-Header und Footer.",
      value: publicUrl
    },
    {
      key: "button",
      title: "Standard-Button",
      description: "Für Buttons oder Menüs, wenn die Buchung als eigene Seite öffnen soll.",
      value: `<a href="${publicUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#527DF6;color:#fff;padding:12px 18px;font-weight:700;text-decoration:none;">Termin buchen</a>`
    },
    {
      key: "iframe",
      title: "Premium-iframe",
      description: allowEmbedView
        ? "Für Premium-Kunden: bindet die Buchung ohne SMART-Booking-Header und Footer in die Website ein."
        : "Premium-Funktion: wird erst nach Freischaltung ohne Header und Footer aktiv.",
      value: allowEmbedView
        ? `<iframe src="${embedUrl}" width="100%" height="900" style="border:0;width:100%;min-height:900px;" loading="lazy"></iframe>`
        : "Premium-Einbettung im Profil freischalten, um den iframe-Code zu verwenden.",
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
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Einbindung auf Website kopieren</summary>
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
              rows={variant.key === "iframe" ? 4 : 3}
              className="mt-3 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700"
            />
          </div>
        ))}
      </div>
    </details>
  );
}
