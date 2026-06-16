"use client";

import { useState } from "react";
import { ArrowRight, Building2, CalendarCheck, Check, SearchCheck, Sparkles } from "lucide-react";

function getTypeIcon(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("demo") || lowerName.includes("ki")) {
    return Sparkles;
  }

  if (lowerName.includes("analyse")) {
    return SearchCheck;
  }

  if (lowerName.includes("bau") || lowerName.includes("immobilien")) {
    return Building2;
  }

  return CalendarCheck;
}

export function BookingTypeCardLink({
  description,
  durationMinutes,
  href,
  name,
  primaryColor,
  cardBackgroundColor
}: {
  description: string | null;
  durationMinutes: number;
  href: string;
  name: string;
  primaryColor: string;
  cardBackgroundColor: string;
}) {
  const [selected, setSelected] = useState(false);
  const TypeIcon = getTypeIcon(name);

  return (
    <a
      href={href}
      onClick={() => setSelected(true)}
      aria-busy={selected}
      className="group rounded-lg border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTopColor: primaryColor, backgroundColor: cardBackgroundColor }}
    >
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50" style={{ color: primaryColor }}>
              <TypeIcon className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{durationMinutes} Minuten</span>
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-950">{name}</h3>
          {description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <span
            className={`inline-flex min-w-36 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
              selected ? "text-emerald-950" : "text-white"
            }`}
            style={{ backgroundColor: selected ? "#86EFAC" : primaryColor }}
          >
            {selected ? "Ausgewählt" : "Termin wählen"}
            {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </span>
        </div>
      </div>
    </a>
  );
}
