import { getEffectiveAppSettings } from "@/lib/app-settings";
import { deleteEvent as deleteAppleCalendarEvent } from "@/lib/calendar/caldav";
import { deleteGoogleCalendarEvent } from "@/lib/calendar/google";
import { deleteMicrosoftCalendarEvent } from "@/lib/calendar/microsoft";

type CalendarProvider = "apple" | "google" | "microsoft";

type DeleteBookingCalendarEventInput = {
  eventId: string | null | undefined;
  eventUrl?: string | null;
};

export async function deleteBookingCalendarEvent({ eventId, eventUrl }: DeleteBookingCalendarEventInput) {
  if (!eventId) {
    return;
  }

  const provider = await resolveCalendarProvider(eventId, eventUrl);

  if (provider === "google") {
    await deleteGoogleCalendarEvent(eventId);
    return;
  }

  if (provider === "microsoft") {
    await deleteMicrosoftCalendarEvent(eventId);
    return;
  }

  await deleteAppleCalendarEvent(eventId);
}

async function resolveCalendarProvider(eventId: string, eventUrl: string | null | undefined): Promise<CalendarProvider> {
  const value = `${eventId} ${eventUrl || ""}`.toLowerCase();

  if (value.includes("google.com") || value.includes("googleapis.com")) {
    return "google";
  }

  if (value.includes("outlook") || value.includes("office.com") || value.includes("microsoft")) {
    return "microsoft";
  }

  if (value.includes("icloud.com") || value.includes("caldav")) {
    return "apple";
  }

  const settings = await getEffectiveAppSettings();
  return settings.activeCalendarProvider;
}
