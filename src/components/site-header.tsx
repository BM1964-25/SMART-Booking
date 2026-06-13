import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-base font-semibold tracking-normal text-slate-950">
          SMART Booking
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-600">
          <Link href="/book" className="hover:text-brand-600">
            Termin buchen
          </Link>
          <Link href="/admin" className="hover:text-brand-600">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
