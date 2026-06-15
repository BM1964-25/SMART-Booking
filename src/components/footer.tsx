"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const hideLegalLinks = pathname === "/book" || pathname.startsWith("/book/");

  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-5 py-10 text-center md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
          <Image src="/smart-booking-icon.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
          <div>
            <p className="text-base font-semibold text-slate-950">SMART Booking</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Intelligente Terminbuchung für professionelle Services.</p>
          </div>
        </div>

        <div className="text-sm leading-6 text-slate-500 md:text-right">
          <p>© 2026 SmartBuilt-AI · Powered by BuiltSmart Hub - Bernhard Metzger</p>
          {!hideLegalLinks ? (
            <nav aria-label="Rechtliche Links" className="mt-2">
              <Link href="https://www.built-smart-hub.com/impressum" className="hover:text-brand-600">
                Impressum
              </Link>
              <span className="mx-2 text-slate-300">|</span>
              <Link href="https://www.built-smart-hub.com/datenschutz" className="hover:text-brand-600">
                Datenschutz
              </Link>
              <span className="mx-2 text-slate-300">|</span>
              <Link href="https://www.built-smart-hub.com/agb" className="hover:text-brand-600">
                AGB
              </Link>
              <span className="mx-2 text-slate-300">|</span>
              <Link href="https://www.built-smart-hub.com/widerrufbelehrung" className="hover:text-brand-600">
                Widerrufbelehrung
              </Link>
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
