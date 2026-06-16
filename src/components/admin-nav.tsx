export function AdminNav() {
  return (
    <nav className="mt-6 flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3">
        <a href="/admin" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
          Dashboard
        </a>
        <a href="/admin/bookings" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
          Buchungsübersicht
        </a>
        <a href="/admin/settings" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
          Einstellungen
        </a>
        <a href="/admin/profiles" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
          Profile
        </a>
      </div>
      <div className="flex justify-start sm:justify-end">
        <a href="/admin/backup" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:border-brand-500 hover:text-brand-600">
          Datensicherung
        </a>
      </div>
    </nav>
  );
}
