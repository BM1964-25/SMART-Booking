import { hasSupabaseConfig } from "@/lib/config";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile } from "@/lib/types";

export const defaultBookingProfile: BookingProfile = {
  id: "seed-builtsmart-ai",
  slug: "builtsmart-ai",
  name: "BuiltSmart AI",
  preheadline: "SMART Booking",
  headline: "Termin mit BuiltSmart AI buchen",
  subheadline: "Wählen Sie einen passenden 30-Minuten-Termin für ein Erstgespräch, eine KI-Demo oder eine projektbezogene Beratung.",
  contact_name: "Bernhard Metzger",
  contact_email: "info@built-smart-hub.com",
  contact_phone: "+491627111911",
  linkedin_url: "https://www.linkedin.com/in/bernhard-metzger-8376539a",
  xing_url: null,
  x_url: null,
  instagram_url: null,
  facebook_url: null,
  youtube_url: null,
  spotify_url: null,
  website_url: "https://www.builtsmart-ai.app",
  secondary_website_url: "https://www.built-smart-hub.com",
  contact_icon_order: ["email", "phone", "website", "linkedin", "xing", "x", "instagram", "facebook", "youtube", "spotify"],
  portrait_url: "/bernhard-metzger.jpg",
  primary_color: "#527DF6",
  profile_card_bg_color: "#F8FAFC",
  booking_card_bg_color: "#FFFFFF",
  portrait_position_x: 50,
  portrait_position_y: 35,
  portrait_zoom: 1,
  show_portrait: true,
  show_preheadline: true,
  show_subheadline: true,
  show_contact_links: true,
  show_contact_name: true,
  show_contact_email: true,
  show_contact_phone: true,
  show_linkedin: true,
  show_xing: true,
  show_x: true,
  show_instagram: true,
  show_facebook: true,
  show_youtube: true,
  show_spotify: true,
  show_website: true,
  show_legal_privacy: true,
  show_legal_imprint: true,
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
