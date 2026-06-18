import type { MeetingLocation } from "@/lib/meeting-location";

type MeetingServiceIconValue = Extract<MeetingLocation, "zoom" | "google_meet" | "teams">;

export function MeetingServiceIcon({ value, className = "h-5 w-5" }: { value: MeetingServiceIconValue; className?: string }) {
  if (value === "zoom") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#0B5CFF" />
        <path d="M6.4 8.2h7.1c1 0 1.8.8 1.8 1.8v4c0 1-.8 1.8-1.8 1.8H6.4c-1 0-1.8-.8-1.8-1.8v-4c0-1 .8-1.8 1.8-1.8Z" fill="white" />
        <path d="m16 10.3 3.4-1.9v7.2L16 13.7v-3.4Z" fill="white" />
      </svg>
    );
  }

  if (value === "google_meet") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="3" y="5" width="12" height="14" rx="3" fill="#1A73E8" />
        <path d="M5.6 5H15v6.4H3V7.6C3 6.2 4.2 5 5.6 5Z" fill="#34A853" />
        <path d="M3 12.6h12V19H5.6C4.2 19 3 17.8 3 16.4v-3.8Z" fill="#FBBC04" />
        <path d="M15 9.3 21 6v12l-6-3.3V9.3Z" fill="#34A853" />
        <path d="M10.2 11.2 15 5v14l-4.8-6.2v-1.6Z" fill="#EA4335" opacity=".95" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="8.9" y="7.3" width="12" height="10.2" rx="2.2" fill="#7B83EB" />
      <rect x="12.2" y="9.5" width="10" height="8.2" rx="2" fill="#5059C9" />
      <circle cx="13.5" cy="5.2" r="2.4" fill="#7B83EB" />
      <circle cx="18.3" cy="6.1" r="2" fill="#5059C9" />
      <rect x="2.2" y="6.7" width="12.2" height="12.2" rx="2.2" fill="#6264A7" />
      <path d="M5.1 9.7h6.7v1.6H9.3v5H7.4v-5H5.1V9.7Z" fill="white" />
    </svg>
  );
}
