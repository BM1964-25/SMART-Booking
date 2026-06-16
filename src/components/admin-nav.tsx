"use client";

import { Clock3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <CurrentDateTime />
        <AdminNavLink href="/admin/backup" label="Datensicherung" active={isActivePath(pathname, "/admin/backup")} />
      </div>
    </nav>
  );
}

function CurrentDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    return null;
  }

  const date = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(now);
  const time = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm">
      <Clock3 className="h-4 w-4 text-brand-600" />
      <span>
        {date} · {time} Uhr
      </span>
    </span>
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
