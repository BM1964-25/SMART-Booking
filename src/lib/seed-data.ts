import { addDays, addHours, addMinutes, set } from "date-fns";
import { BookingType } from "@/lib/types";

export const seedBookingTypes: BookingType[] = [
  {
    id: "seed-erstgespraech",
    slug: "erstgespraech",
    name: "Kostenloses Erstgespräch",
    description: "Kurzes Kennenlernen und Einordnung Ihres Vorhabens.",
    duration_minutes: 30,
    buffer_before_minutes: 5,
    buffer_after_minutes: 10,
    is_active: true,
    sort_order: 1
  },
  {
    id: "seed-ki-demo-builtsmart-ai",
    slug: "ki-demo-builtsmart-ai",
    name: "KI-Demo BuiltSmart AI",
    description: "Live-Demo der wichtigsten Funktionen und Einsatzszenarien.",
    duration_minutes: 30,
    buffer_before_minutes: 10,
    buffer_after_minutes: 10,
    is_active: true,
    sort_order: 2
  },
  {
    id: "seed-projektanalyse",
    slug: "projektanalyse",
    name: "Projektanalyse",
    description: "Strukturierte Analyse Ihres Projekts und nächste Schritte.",
    duration_minutes: 30,
    buffer_before_minutes: 10,
    buffer_after_minutes: 15,
    is_active: true,
    sort_order: 3
  },
  {
    id: "seed-beratung-bau-immobilien",
    slug: "beratung-bau-immobilien",
    name: "Beratung Bau und Immobilien",
    description: "Fachliche Beratung für Bau- und Immobilienprozesse.",
    duration_minutes: 30,
    buffer_before_minutes: 10,
    buffer_after_minutes: 15,
    is_active: true,
    sort_order: 4
  }
];

export function findSeedBookingType(slug: string) {
  return seedBookingTypes.find((type) => type.slug === slug);
}

export function demoSlots(durationMinutes: number) {
  const slots: { startsAt: string; endsAt: string }[] = [];
  const today = new Date();

  for (let dayOffset = 1; dayOffset <= 5; dayOffset += 1) {
    const day = addDays(today, dayOffset);
    const base = set(day, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

    [0, 2, 4].forEach((hourOffset) => {
      const startsAt = addHours(base, hourOffset);
      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: addMinutes(startsAt, durationMinutes).toISOString()
      });
    });
  }

  return slots;
}
