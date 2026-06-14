import { hasSupabaseConfig } from "@/lib/config";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile } from "@/lib/types";

export const defaultBookingProfile: BookingProfile = {
  id: "seed-builtsmart-ai",
  slug: "builtsmart-ai",
  name: "BuiltSmart AI",
  headline: "Termin mit BuiltSmart AI buchen",
  subheadline: "Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.",
  contact_name: "Bernhard Metzger",
  contact_email: "info@built-smart-hub.com",
  contact_phone: "+491627111911",
  linkedin_url: "https://www.linkedin.com/in/bernhard-metzger-8376539a",
  website_url: "https://www.builtsmart-ai.app",
  secondary_website_url: "https://www.built-smart-hub.com",
  portrait_url: "/bernhard-metzger.jpg",
  primary_color: "#527DF6",
  is_active: true
};

export async function getActiveProfiles() {
  if (!hasSupabaseConfig()) {
    return [defaultBookingProfile];
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase.from("booking_profiles").select("*").eq("is_active", true).order("name").returns<BookingProfile[]>();

  return data?.length ? data : [defaultBookingProfile];
}

export async function getBookingProfile(slug?: string | null) {
  if (!hasSupabaseConfig()) {
    return defaultBookingProfile;
  }

  const supabase = createSupabaseAdmin();
  const query = supabase.from("booking_profiles").select("*").eq("is_active", true);
  const { data } = slug
    ? await query.eq("slug", slug).maybeSingle<BookingProfile>()
    : await query.order("created_at", { ascending: true }).limit(1).maybeSingle<BookingProfile>();

  return data || defaultBookingProfile;
}

export function profileBookPath(profile: BookingProfile) {
  return profile.slug === defaultBookingProfile.slug ? "/book" : `/book/profile/${profile.slug}`;
}
