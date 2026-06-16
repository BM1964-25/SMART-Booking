import Image from "next/image";
import Link from "next/link";
import { HelpPanel } from "@/components/help-panel";

export function SiteHeader() {
  return (
    <header data-smart-booking-shell="header" className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="inline-flex items-center gap-3 text-base font-semibold tracking-normal text-slate-950">
          <Image
            src="/smart-booking-icon.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg"
          />
          <span>SMART Booking</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-600 sm:gap-5">
          <Link href="/book" className="hover:text-brand-600">
            Termin buchen
          </Link>
          <Link href="/admin" className="hover:text-brand-600">
            Admin
          </Link>
          <HelpPanel />
        </nav>
      </div>
    </header>
  );
}
