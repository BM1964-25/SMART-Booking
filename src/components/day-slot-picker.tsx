"use client";

import { useState } from "react";
import Link from "next/link";
import { formatGermanTime, TIMEZONE } from "@/lib/date";

type Slot = {
  startsAt: string;
  endsAt: string;
};

type DaySlotPickerProps = {
  bookingTypeSlug: string;
  days: string[];
  groupedSlots: Record<string, Slot[]>;
};

const dayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  timeZone: TIMEZONE
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TIMEZONE
});

const longDayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIMEZONE
});

export function DaySlotPicker({ bookingTypeSlug, days, groupedSlots }: DaySlotPickerProps) {
  const firstAvailableDay = days.find((day) => (groupedSlots[day] || []).length > 0) || days[0];
  const [selectedDay, setSelectedDay] = useState(firstAvailableDay);
  const selectedSlots = groupedSlots[selectedDay] || [];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Tag auswählen</h2>
            <p className="mt-1 text-sm text-slate-500">Buchbar sind Termine innerhalb der nächsten 4 Wochen.</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Europe/Berlin</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {days.map((day) => {
            const slots = groupedSlots[day] || [];
            const isSelected = day === selectedDay;
            const hasSlots = slots.length > 0;

            return (
              <button
                key={day}
                type="button"
                disabled={!hasSlots}
                onClick={() => setSelectedDay(day)}
                className={`flex min-h-16 flex-col items-center justify-center rounded-md border px-3 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : hasSlots
                      ? "border-slate-200 bg-white text-slate-800 hover:border-brand-300"
                      : "border-slate-100 bg-slate-50 text-slate-300"
                }`}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide">{dayFormatter.format(new Date(`${day}T12:00:00`))}</span>
                <span className="mt-1 block text-base font-semibold">{dateFormatter.format(new Date(`${day}T12:00:00`))}</span>
                {!hasSlots ? <span className="mt-1 block text-xs">Belegt</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">{longDayFormatter.format(new Date(`${selectedDay}T12:00:00`))}</h2>
        {selectedSlots.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {selectedSlots.map((slot) => (
              <Link
                key={slot.startsAt}
                href={`/book/${bookingTypeSlug}/confirm?start=${encodeURIComponent(slot.startsAt)}`}
                className="rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-brand-500 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                {formatGermanTime(new Date(slot.startsAt))}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            An diesem Tag sind keine freien Uhrzeiten verfügbar. Bitte wählen Sie einen anderen Tag.
          </p>
        )}
      </section>
    </div>
  );
}
