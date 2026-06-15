"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { contactIconLabels, ContactIconKey, normalizeContactIconOrder } from "@/lib/contact-icon-order";

export function ContactIconOrderEditor({ order }: { order: ContactIconKey[] }) {
  const [items, setItems] = useState(() => normalizeContactIconOrder(order));

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    setItems((current) => {
      const next = [...current];
      const item = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = item;
      return next;
    });
  }

  return (
    <fieldset className="rounded-md border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">Reihenfolge der Kontakticons</legend>
      <input type="hidden" name="contact_icon_order" value={JSON.stringify(items)} />
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Kontaktname bleibt separat. Sortiert werden nur Icons, die einen Wert haben und bei „Anzeigen“ aktiviert sind.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, index) => (
          <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="inline-flex min-w-0 items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {index + 1}
              </span>
              <span className="truncate text-sm font-medium text-slate-800">{contactIconLabels[item]}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`${contactIconLabels[item]} nach oben`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`${contactIconLabels[item]} nach unten`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
