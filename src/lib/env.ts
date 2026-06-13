import { z } from "zod";

const envSchema = z.object({
  APPLE_CALDAV_URL: z.string().url().optional(),
  APPLE_CALDAV_USERNAME: z.string().optional(),
  APPLE_CALDAV_APP_PASSWORD: z.string().optional(),
  APPLE_CALENDAR_ID: z.string().optional(),
  BOOKING_OWNER_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000")
});

export function getEnv() {
  return envSchema.parse({
    APPLE_CALDAV_URL: process.env.APPLE_CALDAV_URL,
    APPLE_CALDAV_USERNAME: process.env.APPLE_CALDAV_USERNAME,
    APPLE_CALDAV_APP_PASSWORD: process.env.APPLE_CALDAV_APP_PASSWORD,
    APPLE_CALENDAR_ID: process.env.APPLE_CALENDAR_ID,
    BOOKING_OWNER_EMAIL: process.env.BOOKING_OWNER_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
  });
}
