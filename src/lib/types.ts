import type { MeetingLocation } from "@/lib/meeting-location";

export type BookingType = {
  id: string;
  profile_id?: string | null;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_active: boolean;
  sort_order: number;
};

export type BookingProfile = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  linkedin_url: string | null;
  xing_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  secondary_website_url: string | null;
  portrait_url: string | null;
  primary_color: string;
  show_portrait: boolean;
  show_subheadline: boolean;
  show_contact_links: boolean;
  is_active: boolean;
};

export type AvailabilityRule = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
};

export type Booking = {
  id: string;
  booking_type_id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  phone: string | null;
  meeting_location: MeetingLocation;
  meeting_url: string | null;
  topic: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: "confirmed" | "cancelled";
  cancellation_token: string;
  calendar_event_id: string | null;
};

export type TimeRange = {
  startsAt: Date;
  endsAt: Date;
};
