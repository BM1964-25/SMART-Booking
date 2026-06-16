import Image from "next/image";
import Link from "next/link";

const legalLinks = [
  { href: "https://www.built-smart-hub.com/impressum", label: "Impressum" },
  { href: "https://www.built-smart-hub.com/datenschutz", label: "Datenschutz" },
  { href: "https://www.built-smart-hub.com/agb", label: "AGB" },
  { href: "https://www.built-smart-hub.com/widerrufbelehrung", label: "Widerrufbelehrung" }
];

export function Footer() {
  return (
    <footer data-smart-booking-shell="footer" className="w-full shrink-0 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-9 text-center md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
          <Image src="/smart-booking-icon.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
          <div>
            <p className="text-base font-semibold text-slate-950">SMART Booking</p>
            <p className="mt-1 text-sm leading-6 text-slate-500 md:whitespace-nowrap">
              Smarte Terminbuchung mit Kalenderabgleich und Verwaltung.
            </p>
          </div>
        </div>

        <div className="text-sm leading-6 text-slate-500 md:text-right">
          <p>© 2026 SmartBuilt-AI · Powered by BuiltSmart Hub - Bernhard Metzger</p>
          <nav aria-label="Rechtliche Links" className="mt-2">
            {legalLinks.map((link, index) => (
              <span key={link.href}>
                {index > 0 ? <span className="mx-2 text-slate-300">|</span> : null}
                <Link href={link.href} className="hover:text-brand-600">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
