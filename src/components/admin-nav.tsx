"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Buchungsübersicht" },
  { href: "/admin/settings", label: "Einstellungen" },
  { href: "/admin/integrations", label: "Kalender & Meetings" },
  { href: "/admin/profiles", label: "Profile" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3">
        {navItems.map((item) => (
          <AdminNavLink key={item.href} href={item.href} label={item.label} active={isActivePath(pathname, item.href)} />
        ))}
      </div>
      <div className="flex justify-start sm:justify-end">
        <AdminNavLink href="/admin/backup" label="Datensicherung" active={isActivePath(pathname, "/admin/backup")} />
      </div>
    </nav>
  );
}

function AdminNavLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md border px-4 py-2 font-semibold transition ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
          : "border-slate-300 bg-white text-slate-800 hover:border-brand-500 hover:text-brand-600"
      }`}
    >
      {label}
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
