import { addMinutes, format, isBefore, parseISO, set } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const TIMEZONE = "Europe/Berlin";

export function formatGermanDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE
  }).format(date);
}

export function formatGermanTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE
  }).format(date);
}

export function toBerlinDateTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const zoned = toZonedTime(day, TIMEZONE);
  const local = set(zoned, { hours, minutes, seconds: 0, milliseconds: 0 });
  return fromZonedTime(local, TIMEZONE);
}

export function isoToDate(value: string) {
  return parseISO(value);
}

export function buildSlotLabel(startsAt: Date, endsAt: Date) {
  return `${formatGermanDate(startsAt)}, ${formatGermanTime(startsAt)}-${formatGermanTime(endsAt)} Uhr`;
}

export function eachSlot(start: Date, end: Date, durationMinutes: number, stepMinutes = 30) {
  const slots: Date[] = [];
  let cursor = start;

  while (!isBefore(end, addMinutes(cursor, durationMinutes))) {
    slots.push(cursor);
    cursor = addMinutes(cursor, stepMinutes);
  }

  return slots;
}

export function htmlDateValue(date: Date) {
  return format(toZonedTime(date, TIMEZONE), "yyyy-MM-dd");
}
