import { z } from "zod";
import { meetingLocationValues } from "@/lib/meeting-location";

export const createBookingSchema = z.object({
  bookingTypeSlug: z.string().min(2),
  startsAt: z.string().datetime(),
  customerName: z.string().min(2, "Bitte geben Sie Ihren Namen ein."),
  customerEmail: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  company: z.string().min(2, "Bitte geben Sie Ihr Unternehmen ein."),
  phone: z.string().trim().min(5, "Bitte geben Sie Ihre Telefonnummer ein.").max(60, "Die Telefonnummer ist zu lang."),
  meetingLocation: z.enum(meetingLocationValues),
  topic: z.string().min(10, "Bitte beschreiben Sie Ihr Anliegen kurz."),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "Bitte bestätigen Sie den Datenschutzhinweis." })
  })
});

export const availabilityQuerySchema = z.object({
  type: z.string().min(2),
  from: z.string().datetime(),
  to: z.string().datetime()
});

export const cancelBookingSchema = z.object({
  token: z.string().min(24)
});

export const changeRequestSchema = z.object({
  token: z.string().min(24),
  proposedStartsAt: z.string().datetime().optional().or(z.literal("")),
  message: z.string().min(10, "Bitte beschreiben Sie Ihren Änderungsvorschlag.")
});

export const bookingTypeMutationSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  bufferBeforeMinutes: z.number().int().min(0),
  bufferAfterMinutes: z.number().int().min(0),
  isActive: z.boolean().default(true)
});

export const availabilityMutationSchema = z.object({
  id: z.string().uuid().optional(),
  weekday: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true)
});
