import { z } from "zod";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const envSchema = z.object({
  APPLE_CALDAV_URL: optionalUrl,
  APPLE_CALDAV_USERNAME: z.string().optional(),
  APPLE_CALDAV_APP_PASSWORD: z.string().optional(),
  APPLE_CALENDAR_ID: z.string().optional(),
  BOOKING_OWNER_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  ZOOM_MEETING_URL: optionalUrl,
  ZOOM_ACCOUNT_ID: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  TEAMS_MEETING_URL: optionalUrl,
  GOOGLE_MEET_URL: optionalUrl,
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  ONSITE_MEETING_URL: optionalUrl
});

export function getEnv() {
  return envSchema.parse({
    APPLE_CALDAV_URL: process.env.APPLE_CALDAV_URL,
    APPLE_CALDAV_USERNAME: process.env.APPLE_CALDAV_USERNAME,
    APPLE_CALDAV_APP_PASSWORD: process.env.APPLE_CALDAV_APP_PASSWORD,
    APPLE_CALENDAR_ID: process.env.APPLE_CALENDAR_ID,
    BOOKING_OWNER_EMAIL: process.env.BOOKING_OWNER_EMAIL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    MAIL_FROM: process.env.MAIL_FROM,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ZOOM_MEETING_URL: process.env.ZOOM_MEETING_URL,
    ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
    ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
    TEAMS_MEETING_URL: process.env.TEAMS_MEETING_URL,
    GOOGLE_MEET_URL: process.env.GOOGLE_MEET_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    ONSITE_MEETING_URL: process.env.ONSITE_MEETING_URL
  });
}
