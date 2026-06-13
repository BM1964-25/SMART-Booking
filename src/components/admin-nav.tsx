import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="mt-6 flex flex-wrap gap-3 text-sm">
      <Link href="/admin" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
        Dashboard
      </Link>
      <Link href="/admin/bookings" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
        Buchungsübersicht
      </Link>
      <Link href="/admin/settings" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
        Einstellungen
      </Link>
    </nav>
  );
}
