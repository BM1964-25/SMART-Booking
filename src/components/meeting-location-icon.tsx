import { Building2, HelpCircle, Phone } from "lucide-react";
import { MeetingServiceIcon } from "@/components/meeting-service-icon";
import type { MeetingLocation } from "@/lib/meeting-location";

export function MeetingLocationIcon({ value, className = "h-4 w-4" }: { value?: string | null; className?: string }) {
  const iconClassName = className;

  switch (value as MeetingLocation | undefined) {
    case "zoom":
      return <MeetingServiceIcon value="zoom" className={iconClassName} />;
    case "google_meet":
      return <MeetingServiceIcon value="google_meet" className={iconClassName} />;
    case "teams":
      return <MeetingServiceIcon value="teams" className={iconClassName} />;
    case "onsite":
      return <Building2 className={iconClassName} aria-hidden="true" />;
    case "individual":
      return <HelpCircle className={iconClassName} aria-hidden="true" />;
    case "phone":
    default:
      return <Phone className={iconClassName} aria-hidden="true" />;
  }
}
