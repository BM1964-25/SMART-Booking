import { addDays, addMinutes, getISODay, isBefore, max, min } from "date-fns";
import { getEvents } from "@/lib/calendar/caldav";
import { eachSlot, TIMEZONE, toBerlinDateTime } from "@/lib/date";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { AvailabilityRule, BookingType, TimeRange } from "@/lib/types";

export type AvailableSlot = {
  startsAt: string;
  endsAt: string;
};

const calendarReadTimeoutMs = 5000;

export async function getAvailableSlots(typeSlug: string, from: Date, to: Date): Promise<AvailableSlot[]> {
  const supabase = createSupabaseAdmin();
  const { data: bookingType, error: typeError } = await supabase
    .from("booking_types")
    .select("*")
    .eq("slug", typeSlug)
    .eq("is_active", true)
    .single<BookingType>();

  if (typeError || !bookingType) {
    throw new Error("Terminart wurde nicht gefunden.");
  }

  const [{ data: rules }, { data: bookings }, { data: blockedTimes }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("is_active", true).returns<AvailabilityRule[]>(),
    supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("status", "confirmed")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString()),
    supabase
      .from("blocked_times")
      .select("starts_at, ends_at")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString())
  ]);

  let calendarRanges: TimeRange[] = [];

  try {
    calendarRanges = (await withTimeout(getEvents(from, to), calendarReadTimeoutMs)).map((event) => ({
      startsAt: event.startsAt,
      endsAt: event.endsAt
    }));
  } catch {
    calendarRanges = [];
  }

  const busyRanges: TimeRange[] = [
    ...(bookings || []).map((booking) => ({
      startsAt: addMinutes(new Date(booking.starts_at), -bookingType.buffer_before_minutes),
      endsAt: addMinutes(new Date(booking.ends_at), bookingType.buffer_after_minutes)
    })),
    ...(blockedTimes || []).map((blocked) => ({ startsAt: new Date(blocked.starts_at), endsAt: new Date(blocked.ends_at) })),
    ...calendarRanges.map((range) => ({
      startsAt: addMinutes(range.startsAt, -bookingType.buffer_before_minutes),
      endsAt: addMinutes(range.endsAt, bookingType.buffer_after_minutes)
    }))
  ];

  const slots: AvailableSlot[] = [];
  let day = from;

  while (isBefore(day, to)) {
    const isoWeekday = getISODay(day);
    const dayRules = (rules || []).filter((rule) => rule.weekday === isoWeekday && rule.timezone === TIMEZONE);

    for (const rule of dayRules) {
      const windowStart = max([toBerlinDateTime(day, rule.start_time), from]);
      const windowEnd = min([toBerlinDateTime(day, rule.end_time), to]);

      for (const slotStart of eachSlot(windowStart, windowEnd, bookingType.duration_minutes)) {
        const slotEnd = addMinutes(slotStart, bookingType.duration_minutes);
        const guardedStart = addMinutes(slotStart, -bookingType.buffer_before_minutes);
        const guardedEnd = addMinutes(slotEnd, bookingType.buffer_after_minutes);

        if (!busyRanges.some((range) => overlaps(guardedStart, guardedEnd, range.startsAt, range.endsAt))) {
          slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
        }
      }
    }

    day = addDays(day, 1);
  }

  return slots;
}

export async function assertSlotAvailable(typeSlug: string, startsAt: Date, endsAt: Date) {
  const slots = await getAvailableSlots(typeSlug, addMinutes(startsAt, -24 * 60), addMinutes(endsAt, 24 * 60));
  const target = startsAt.toISOString();
  return slots.some((slot) => slot.startsAt === target);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Apple Kalender konnte nicht rechtzeitig geladen werden.")), timeoutMs);
    })
  ]);
}
