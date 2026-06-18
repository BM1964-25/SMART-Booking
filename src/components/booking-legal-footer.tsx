import Link from "next/link";
import { BookingProfile } from "@/lib/types";

const defaultPrivacyUrl = "https://www.built-smart-hub.com/datenschutz";
const defaultImprintUrl = "https://www.built-smart-hub.com/impressum";

type BookingLegalFooterProps = {
  embedView?: boolean;
  profile: BookingProfile;
};

export function BookingLegalFooter({ embedView = false, profile }: BookingLegalFooterProps) {
  const legalLinks = [
    profile.show_legal_privacy !== false ? { href: profile.legal_privacy_url || defaultPrivacyUrl, label: "Datenschutz" } : null,
    profile.show_legal_imprint !== false ? { href: profile.legal_imprint_url || defaultImprintUrl, label: "Impressum" } : null
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  if (!embedView && legalLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
        {legalLinks.map((link, index) => (
          <span key={link.href} className="inline-flex items-center gap-3">
            {index > 0 ? <span className="text-slate-300">|</span> : null}
            <Link href={link.href} target="_blank" rel="noreferrer" className="hover:text-brand-600">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
      {embedView ? (
        <Link href="/admin" className="text-center text-slate-400 transition hover:text-brand-600 sm:text-right">
          Admin
        </Link>
      ) : null}
    </div>
  );
}
