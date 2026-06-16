import { addDays, subDays } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileWarning,
  Globe2,
  Layers3,
  MailCheck,
  Settings,
  ShieldCheck,
  UserRound,
  Video
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { getEvents } from "@/lib/calendar/caldav";
import { hasSupabaseConfig } from "@/lib/config";
import { formatGermanDate, formatGermanTime } from "@/lib/date";
import { defaultBookingProfile } from "@/lib/profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingProfile, BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

const PUBLIC_BOOKING_SITE_URL = "https://booking.builtsmart-ai.app";
const calendarTimeoutMs = 3500;

type DashboardBooking = {
  id: string;
  customer_name: string;
  customer_email: string;
  company: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booking_types: { name: string | null } | null;
};

type CalendarStatus =
  | {
      status: "ready";
      events: Array<{ startsAt: Date; endsAt: Date; summary?: string }>;
    }
  | {
      status: "unavailable";
      events: [];
      message: string;
    };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const now = new Date();
  const in30Days = addDays(now, 30);
  const since28Days = subDays(now, 28);

  const [
    { count: bookingsTotal },
    { count: upcomingBookings },
    { count: cancelledBookings },
    { count: activeTypes },
    { count: activeProfiles },
    { data: nextBookings },
    { data: recentBookings },
    { data: profiles },
    { data: bookingTypes },
    calendarStatus
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed").gte("starts_at", now.toISOString()),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("booking_types").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("booking_profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("bookings")
      .select("id, customer_name, customer_email, company, starts_at, ends_at, status, booking_types(name)")
      .eq("status", "confirmed")
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(3)
      .returns<DashboardBooking[]>(),
    supabase
      .from("bookings")
      .select("id, starts_at, status")
      .gte("starts_at", since28Days.toISOString())
      .order("starts_at", { ascending: true }),
    supabase.from("booking_profiles").select("*").order("name").returns<BookingProfile[]>(),
    supabase.from("booking_types").select("*").order("sort_order").returns<BookingType[]>(),
    loadCalendarStatus(now, in30Days)
  ]);

  async function logout() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const weeklySeries = buildWeeklySeries(recentBookings || [], since28Days);
  const maxWeeklyValue = Math.max(1, ...weeklySeries.map((week) => week.count));
  const profileRows = buildProfileRows(profiles || [], bookingTypes || []);
  const nextFreeHint = nextBookings?.[0] ? `${formatGermanDate(new Date(nextBookings[0].starts_at))}, ${formatGermanTime(new Date(nextBookings[0].starts_at))}` : "Keine Buchung geplant";
  const publicBookingUrl = `${PUBLIC_BOOKING_SITE_URL}/book`;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Überblick über Buchungen, Terminarten, Profile, Systemstatus und die wichtigsten Verwaltungsaktionen.
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand-500 hover:text-brand-700" type="submit">
            Abmelden
          </button>
        </form>
      </div>

      <AdminNav />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Buchungen gesamt" value={bookingsTotal || 0} icon={CalendarCheck} />
        <MetricCard label="Anstehend" value={upcomingBookings || 0} icon={Clock3} tone="green" />
        <MetricCard label="Storniert" value={cancelledBookings || 0} icon={FileWarning} tone="amber" />
        <MetricCard label="Aktive Terminarten" value={activeTypes || 0} icon={Layers3} />
        <MetricCard label="Aktive Profile" value={activeProfiles || 0} icon={UserRound} />
        <MetricCard label="Nächster Termin" value={nextFreeHint} icon={CalendarClock} compact />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Nächste Buchungen"
          action={
            <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Alle anzeigen
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="space-y-3">
            {(nextBookings || []).length ? (
              (nextBookings || []).map((booking) => (
                <div key={booking.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{booking.booking_types?.name || "Termin"}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.customer_name} · {booking.company}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{booking.customer_email}</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 sm:text-right">
                    <p>{formatGermanDate(new Date(booking.starts_at))}</p>
                    <p className="mt-1 text-brand-600">{formatGermanTime(new Date(booking.starts_at))}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Noch keine anstehenden Buchungen vorhanden." />
            )}
          </div>
        </Panel>

        <Panel title="Systemstatus">
          <div className="space-y-2">
            <StatusLine label="Supabase verbunden" ok={hasSupabaseConfig()} icon={Database} />
            <StatusLine label="Apple CalDAV erreichbar" ok={calendarStatus.status === "ready"} icon={CalendarCheck} detail={calendarStatus.status === "unavailable" ? calendarStatus.message : undefined} />
            <StatusLine label="E-Mail-Versand konfiguriert" ok={Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD)} icon={MailCheck} />
            <StatusLine label="Zoom-Link aktiv" ok={Boolean(process.env.ZOOM_MEETING_URL || (process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET))} icon={Video} />
            <StatusLine label="Öffentlicher Buchungslink" ok icon={Globe2} detail={publicBookingUrl} />
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Buchungsentwicklung">
          <div className="space-y-3">
            {weeklySeries.map((week) => (
              <div key={week.label}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{week.label}</span>
                  <span>{week.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(6, (week.count / maxWeeklyValue) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Profile & Sichtbarkeit">
          <div className="grid gap-3 md:grid-cols-2">
            {profileRows.map((profile) => (
              <div key={profile.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{profile.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{profile.url}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${profile.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {profile.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">{profile.bookingTypes}/4 Terminarten</span>
                  <span className={`rounded-full px-2.5 py-1 ${profile.allowEmbedView ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
                    Premium {profile.allowEmbedView ? "aktiv" : "aus"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Schnellaktionen">
          <div className="grid gap-3">
            <QuickAction href="/admin/bookings" icon={CalendarCheck} title="Buchungen prüfen" text="Stornieren, löschen oder Änderungsvorschläge sehen." />
            <QuickAction href="/admin/settings#terminarten" icon={Settings} title="Terminarten bearbeiten" text="Aktive Formate, Reihenfolge und Profil-Zuordnung pflegen." />
            <QuickAction href="/admin/profiles" icon={UserRound} title="Profile gestalten" text="Headline, Kontaktdaten, Farben und Premium-Einbettung steuern." />
            <QuickAction href="/admin/backup" icon={Download} title="Datensicherung öffnen" text="Export und Import der Konfiguration verwalten." />
            <QuickAction href={publicBookingUrl} icon={ExternalLink} title="Öffentliche Buchung öffnen" text="Produktionslink in einem neuen Tab prüfen." external />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function MetricCard({
  compact = false,
  icon: Icon,
  label,
  tone = "blue",
  value
}: {
  compact?: boolean;
  icon: typeof CalendarCheck;
  label: string;
  tone?: "amber" | "blue" | "green";
  value: string | number;
}) {
  const color = tone === "green" ? "text-emerald-600 bg-emerald-50" : tone === "amber" ? "text-amber-600 bg-amber-50" : "text-brand-600 bg-brand-50";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-h-10 flex-1 text-sm font-medium text-slate-500">{label}</p>
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-center font-semibold text-slate-950 ${compact ? "text-base leading-6" : "text-3xl"}`}>{value}</p>
    </div>
  );
}

function Panel({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusLine({
  detail,
  icon: Icon,
  label,
  ok
}: {
  detail?: string;
  icon: typeof CalendarCheck;
  label: string;
  ok: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {detail ? <p className="mt-1 break-words text-xs leading-5 text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

function QuickAction({
  external = false,
  href,
  icon: Icon,
  text,
  title
}: {
  external?: boolean;
  href: string;
  icon: typeof CalendarCheck;
  text: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-300 hover:bg-white"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-600 ring-1 ring-slate-200 group-hover:ring-brand-200">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span>
      </span>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">{text}</p>;
}

function buildWeeklySeries(bookings: Array<{ starts_at: string; status: string }>, since: Date) {
  return Array.from({ length: 4 }, (_, index) => {
    const start = addDays(since, index * 7);
    const end = addDays(start, 7);
    const count = bookings.filter((booking) => {
      const startsAt = new Date(booking.starts_at);
      return booking.status === "confirmed" && startsAt >= start && startsAt < end;
    }).length;

    return {
      label: `${formatGermanDate(start)} - ${formatGermanDate(addDays(end, -1))}`,
      count
    };
  });
}

function buildProfileRows(profiles: BookingProfile[], bookingTypes: BookingType[]) {
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    isActive: profile.is_active,
    allowEmbedView: profile.allow_embed_view,
    bookingTypes: bookingTypes.filter((type) => type.profile_id === profile.id).length,
    url: `${PUBLIC_BOOKING_SITE_URL}${profile.slug === defaultBookingProfile.slug ? "/book" : `/book/profile/${profile.slug}`}`
  }));
}

async function loadCalendarStatus(from: Date, to: Date): Promise<CalendarStatus> {
  try {
    const events = await withTimeout(getEvents(from, to), calendarTimeoutMs);
    const upcomingEvents = events
      .filter((event) => event.startsAt >= from)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, 3)
      .map((event) => ({
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        summary: event.summary
      }));

    return { status: "ready", events: upcomingEvents };
  } catch (error) {
    return {
      status: "unavailable",
      events: [],
      message: error instanceof Error ? error.message : "Apple CalDAV konnte nicht geladen werden."
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Apple CalDAV antwortet gerade nicht rechtzeitig.")), timeoutMs);
    })
  ]);
}
