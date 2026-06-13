"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type AvailabilityRuleInput = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type AvailabilityGridProps = {
  action: (formData: FormData) => Promise<void>;
  rules: AvailabilityRuleInput[];
};

const weekdays = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" }
];

const hours = Array.from({ length: 14 }, (_, index) => index + 7);

export function AvailabilityGrid({ action, rules }: AvailabilityGridProps) {
  const initialSelection = useMemo(() => buildInitialSelection(rules), [rules]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSelection);
  const [dragMode, setDragMode] = useState<"select" | "remove" | null>(null);
  const selected = useMemo(() => new Set(selectedSlots), [selectedSlots]);

  function setCell(weekday: number, hour: number, mode: "select" | "remove") {
    const key = cellKey(weekday, hour);
    setSelectedSlots((current) => {
      const next = new Set(current);

      if (mode === "select") {
        next.add(key);
      } else {
        next.delete(key);
      }

      return Array.from(next).sort();
    });
  }

  function beginSelection(weekday: number, hour: number) {
    const key = cellKey(weekday, hour);
    const mode = selected.has(key) ? "remove" : "select";
    setDragMode(mode);
    setCell(weekday, hour, mode);
  }

  function fillWeekday(weekday: number, startHour: number, endHour: number) {
    setSelectedSlots((current) => {
      const next = new Set(current);

      for (let hour = startHour; hour < endHour; hour += 1) {
        next.add(cellKey(weekday, hour));
      }

      return Array.from(next).sort();
    });
  }

  function clearWeekday(weekday: number) {
    setSelectedSlots((current) => current.filter((key) => !key.startsWith(`${weekday}-`)));
  }

  const rulesPayload = JSON.stringify(buildRulesPayload(selectedSlots));

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="rules" value={rulesPayload} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Verfügbarkeiten</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Markieren Sie die Stunden, in denen Termine grundsätzlich buchbar sein sollen.
          </p>
        </div>
        <SubmitButton />
      </div>

      <div className="mt-5 overflow-x-auto" onMouseUp={() => setDragMode(null)} onMouseLeave={() => setDragMode(null)}>
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[72px_repeat(7,minmax(84px,1fr))] gap-1">
            <div />
            {weekdays.map((day) => (
              <div key={day.value} className="rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                {day.label}
              </div>
            ))}

            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="flex h-10 items-center justify-end pr-3 text-xs font-medium text-slate-500">
                  {formatHour(hour)}
                </div>
                {weekdays.map((day) => {
                  const key = cellKey(day.value, hour);
                  const isSelected = selected.has(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      onMouseDown={() => beginSelection(day.value, hour)}
                      onMouseEnter={() => {
                        if (dragMode) {
                          setCell(day.value, hour, dragMode);
                        }
                      }}
                      onTouchStart={() => beginSelection(day.value, hour)}
                      className={`h-10 rounded-md border text-xs font-semibold transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-slate-200 bg-white text-slate-400 hover:border-brand-300 hover:bg-brand-50"
                      }`}
                    >
                      {isSelected ? "frei" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {weekdays.slice(0, 5).map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => fillWeekday(day.value, 9, 17)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-600"
          >
            {day.label} 9-17
          </button>
        ))}
        {weekdays.map((day) => (
          <button
            key={`clear-${day.value}`}
            type="button"
            onClick={() => clearWeekday(day.value)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-200 hover:text-red-600"
          >
            {day.label} leeren
          </button>
        ))}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
      {pending ? "Wird gespeichert" : "Verfügbarkeit speichern"}
    </button>
  );
}

function buildInitialSelection(rules: AvailabilityRuleInput[]) {
  const selection = new Set<string>();

  for (const rule of rules) {
    if (!rule.is_active) {
      continue;
    }

    const startHour = Number(rule.start_time.slice(0, 2));
    const endHour = Number(rule.end_time.slice(0, 2));

    for (let hour = startHour; hour < endHour; hour += 1) {
      if (hours.includes(hour)) {
        selection.add(cellKey(rule.weekday, hour));
      }
    }
  }

  return Array.from(selection).sort();
}

function buildRulesPayload(selectedSlots: string[]) {
  return weekdays.flatMap((day) => {
    const selectedHours = selectedSlots
      .filter((slot) => slot.startsWith(`${day.value}-`))
      .map((slot) => Number(slot.split("-")[1]))
      .sort((a, b) => a - b);

    if (selectedHours.length === 0) {
      return [];
    }

    const ranges: Array<{ weekday: number; startTime: string; endTime: string }> = [];
    let rangeStart = selectedHours[0];
    let previous = selectedHours[0];

    for (const hour of selectedHours.slice(1)) {
      if (hour === previous + 1) {
        previous = hour;
        continue;
      }

      ranges.push({ weekday: day.value, startTime: toTime(rangeStart), endTime: toTime(previous + 1) });
      rangeStart = hour;
      previous = hour;
    }

    ranges.push({ weekday: day.value, startTime: toTime(rangeStart), endTime: toTime(previous + 1) });
    return ranges;
  });
}

function cellKey(weekday: number, hour: number) {
  return `${weekday}-${hour}`;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function toTime(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
