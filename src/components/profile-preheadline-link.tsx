import { BookingProfile } from "@/lib/types";

type ProfilePreheadlineLinkProps = {
  profile: BookingProfile;
  color?: string;
  className?: string;
};

export function ProfilePreheadlineLink({ profile, color = "#527DF6", className = "" }: ProfilePreheadlineLinkProps) {
  if (profile.show_preheadline === false) {
    return null;
  }

  const label = profile.preheadline || "SMART Booking";
  const href = normalizeExternalUrl(profile.preheadline_url);
  const classes = `text-sm font-semibold uppercase tracking-wider transition ${className}`.trim();

  if (!label) {
    return null;
  }

  if (href) {
    return (
      <a href={href} className={`${classes} hover:underline`} style={{ color }}>
        {label}
      </a>
    );
  }

  return (
    <p className={classes} style={{ color }}>
      {label}
    </p>
  );
}

function normalizeExternalUrl(value: string | null | undefined) {
  const url = String(value || "").trim();

  if (!url) {
    return null;
  }

  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
