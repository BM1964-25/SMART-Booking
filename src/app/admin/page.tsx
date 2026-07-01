import { addDays, subDays } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BellRing,
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
  ListChecks,
  MailCheck,
  Rocket,
  Settings,
  UserRound,
  Video
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { getEvents } from "@/lib/calendar/caldav";
import { hasSupabaseConfig } from "@/lib/config";
import { formatGermanDate, formatGermanTime } from "@/lib/date";
import { defaultBookingProfile } from "@/lib/profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingProfile, BookingType, CalendarConnection } from "@/lib/types";

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

type DashboardVolumeBooking = {
  id: string;
  starts_at: string;
  status: string;
  booking_types: { profile_id: string | null } | null;
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

type ProductionCheckStatus = "ready" | "todo" | "warning";

type ProductionCheck = {
  detail: string;
  status: ProductionCheckStatus;
  title: string;
};

type ReminderStatus = {
  activeTypes: number;
  disabledRows: Array<{
    id: string;
    name: string;
    profileName: string;
    reminder1: boolean;
    reminder2: boolean;
  }>;
  enabledTypes: number;
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
    { data: calendarConnections },
    calendarStatus,
    appSettings
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
      .select("id, starts_at, status, booking_types(profile_id)")
      .gte("starts_at", since28Days.toISOString())
      .order("starts_at", { ascending: true })
      .returns<DashboardVolumeBooking[]>(),
    supabase.from("booking_profiles").select("*").order("name").returns<BookingProfile[]>(),
    supabase.from("booking_types").select("*").order("sort_order").returns<BookingType[]>(),
    supabase.from("calendar_connections").select("*").order("display_name").returns<CalendarConnection[]>(),
    loadCalendarStatus(now, in30Days),
    getEffectiveAppSettings()
  ]);

  async function logout() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const weeklySeries = buildWeeklySeries(recentBookings || [], since28Days);
  const maxWeeklyValue = Math.max(1, ...weeklySeries.map((week) => week.count));
  const profileVolumeRows = buildProfileVolumeRows(recentBookings || [], profiles || []);
  const maxProfileVolume = Math.max(1, ...profileVolumeRows.map((row) => row.count));
  const profileRows = buildProfileRows(profiles || [], bookingTypes || []);
  const activeProfileRows = profileRows.filter((profile) => profile.isActive);
  const reminderStatus = buildReminderStatus(profiles || [], bookingTypes || []);
  const nextFreeHint = nextBookings?.[0] ? `${formatShortGermanDate(new Date(nextBookings[0].starts_at))}\n${formatGermanTime(new Date(nextBookings[0].starts_at))} Uhr` : "Keine Buchung\ngeplant";
  const publicBookingUrl = `${PUBLIC_BOOKING_SITE_URL}/book`;
  const emailConfigured = Boolean(appSettings.smtpUser && appSettings.smtpPassword);
  const meetingConfigured = Boolean(appSettings.zoomMeetingUrl || appSettings.googleMeetUrl || appSettings.teamsMeetingUrl || (process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET));
  const productionChecks = buildProductionChecks({
    activeProfiles: activeProfiles || 0,
    activeTypes: activeTypes || 0,
    calendarConnections: calendarConnections || [],
    calendarReady: calendarStatus.status === "ready",
    emailConfigured,
    meetingConfigured,
    profileRows,
    publicBookingUrl,
    supabaseReady: hasSupabaseConfig()
  });
  const completedChecks = productionChecks.filter((check) => check.status === "ready").length;

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

      <div className="mt-6">
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
      </div>

      <div className="mt-6">
        <Panel
          title="Termin-Erinnerungen"
          action={
            <Link href="/admin/settings#terminarten" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Terminarten prüfen
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${reminderStatus.disabledRows.length ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <BellRing className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{reminderStatus.enabledTypes} von {reminderStatus.activeTypes} aktiven Terminarten</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {reminderStatus.disabledRows.length
                      ? `${reminderStatus.disabledRows.length} aktive Terminarten haben keine Erinnerung aktiviert.`
                      : "Alle aktiven Terminarten haben mindestens eine Erinnerung aktiviert."}
                  </p>
                  <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                    Der automatische Versand greift nur für aktivierte Erinnerungen und wird regelmäßig im Hintergrund geprüft.
                  </p>
                </div>
              </div>
            </div>
            <div>
              {reminderStatus.disabledRows.length ? (
                <div className="overflow-hidden rounded-md border border-amber-200">
                  <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem] gap-3 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-800 sm:grid">
                    <span>Terminart</span>
                    <span>Erinnerung 1</span>
                    <span>Erinnerung 2</span>
                  </div>
                  <div className="divide-y divide-amber-100 bg-white">
                    {reminderStatus.disabledRows.slice(0, 6).map((row) => (
                      <div key={row.id} className="grid gap-3 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-950">{row.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{row.profileName}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 sm:hidden">Erinnerung 1</span>
                          <ReminderBadge active={row.reminder1} />
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 sm:hidden">Erinnerung 2</span>
                          <ReminderBadge active={row.reminder2} />
                        </span>
                      </div>
                    ))}
                  </div>
                  {reminderStatus.disabledRows.length > 6 ? (
                    <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {reminderStatus.disabledRows.length - 6} weitere aktive Terminarten ohne vollständige Erinnerung.
                    </p>
                  ) : null}
                </div>
              ) : (
                <EmptyState text="Keine aktiven Terminarten ohne Erinnerung vorhanden." />
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Terminvolumen der letzten 4 Wochen">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Verlauf pro Woche</h3>
              <div className="mt-3 space-y-3">
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
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Aufteilung nach Profil</h3>
              <div className="mt-3 space-y-3">
                {profileVolumeRows.map((row) => (
                  <div key={row.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span className="truncate">{row.name}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.count === 0 ? 0 : Math.max(6, (row.count / maxProfileVolume) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                {profileVolumeRows.length === 0 ? <EmptyState text="Noch keine Profile für die Auswertung vorhanden." /> : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Gezählt werden bestätigte SMART-Booking-Buchungen nach Termindatum. Externe Kalendertermine ohne Buchung werden nicht berücksichtigt.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Livebetrieb prüfen"
          action={
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Rocket className="h-4 w-4" />
              {completedChecks}/{productionChecks.length} erledigt
            </span>
          }
        >
          <p className="mb-4 max-w-3xl text-sm leading-6 text-slate-600">
            Prüft, ob die öffentlichen Buchungsseiten, Kalender, E-Mail-Versand und Meeting-Links für den laufenden Betrieb bereit sind.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {productionChecks.map((check) => (
              <ReadinessItem key={check.title} {...check} />
            ))}
          </div>
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Aktive Live-Webseiten prüfen</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Öffne die aktiven Buchungsseiten und prüfe Darstellung, Profiltexte und buchbare Terminarten.
                </p>
                <div className="mt-3 grid gap-2">
                  {activeProfileRows.length ? (
                    activeProfileRows.map((profile) => (
                      <Link
                        key={profile.id}
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-brand-300 hover:text-brand-700"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-900">{profile.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{profile.url}</span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-brand-600" />
                      </Link>
                    ))
                  ) : (
                    <EmptyState text="Noch keine aktiven Profile vorhanden." />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Empfohlene Testfolge</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Nutze diese Schritte nach Änderungen, um den gesamten Buchungsprozess bis zur Bestätigung zu testen.
                </p>
                <ol className="mt-3 grid gap-2 text-sm text-slate-600">
                  {["Live-Link öffnen", "Terminart wählen", "Testbuchung durchführen", "E-Mail und Kalendereintrag prüfen", "Storno oder Änderung testen"].map((step, index) => (
                    <li key={step} className="flex gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Profile & Sichtbarkeit">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {profileRows.map((profile) => (
              <div key={profile.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{profile.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{profile.url}</p>
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
      </div>

      <div className="mt-6">
        <Panel title="Schnellaktionen">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <QuickAction href="/admin/bookings" icon={CalendarCheck} title="Buchungen prüfen" text="Stornieren, löschen oder Änderungsvorschläge sehen." />
            <QuickAction href="/admin/settings#terminarten" icon={Settings} title="Terminarten bearbeiten" text="Aktive Formate, Reihenfolge und Profil-Zuordnung pflegen." />
            <QuickAction href="/admin/integrations" icon={Globe2} title="Kalender & Meetings" text="Buchungskalender, Abgleich-Kalender und Meeting-Dienste steuern." />
            <QuickAction href="/admin/profiles" icon={UserRound} title="Profile gestalten" text="Headline, Kontaktdaten, Farben und Premium-Einbettung steuern." />
            <QuickAction href="/admin/backup" icon={Download} title="Datensicherung öffnen" text="Export und Import der Konfiguration verwalten." />
            <QuickAction href={publicBookingUrl} icon={ExternalLink} title="Öffentliche Buchung öffnen" text="Produktionslink in einem neuen Tab prüfen." external />
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Systemstatus">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <StatusLine label="Supabase verbunden" ok={hasSupabaseConfig()} icon={Database} />
            <StatusLine label="Apple CalDAV erreichbar" ok={calendarStatus.status === "ready"} icon={CalendarCheck} detail={calendarStatus.status === "unavailable" ? calendarStatus.message : undefined} />
            <StatusLine label="E-Mail-Versand konfiguriert" ok={emailConfigured} icon={MailCheck} />
            <StatusLine label="Online-Meeting-Link aktiv" ok={meetingConfigured} icon={Video} />
            <StatusLine label="Öffentlicher Buchungslink" ok icon={Globe2} detail={publicBookingUrl} />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ReadinessItem({ detail, status, title }: ProductionCheck) {
  const tone =
    status === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  const iconTone =
    status === "ready"
      ? "bg-emerald-100 text-emerald-700"
      : status === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-white text-slate-500 ring-1 ring-slate-200";

  return (
    <div className={`flex gap-3 rounded-md border p-3 ${tone}`}>
      <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconTone}`}>
        {status === "ready" ? <CheckCircle2 className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
      </div>
    </div>
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
      <p className={`mt-3 text-center font-semibold text-slate-950 ${compact ? "whitespace-pre-line text-sm leading-5" : "text-3xl"}`}>{value}</p>
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

function ReminderBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {active ? "Aktiv" : "Aus"}
    </span>
  );
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

function buildProfileVolumeRows(bookings: DashboardVolumeBooking[], profiles: BookingProfile[]) {
  const counts = new Map<string, number>();

  for (const booking of bookings) {
    if (booking.status !== "confirmed") {
      continue;
    }

    const profileId = booking.booking_types?.profile_id || "general";
    counts.set(profileId, (counts.get(profileId) || 0) + 1);
  }

  const profileRows = profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    count: counts.get(profile.id) || 0
  }));

  const generalCount = counts.get("general") || 0;

  return [
    ...profileRows,
    ...(generalCount > 0 ? [{ id: "general", name: "Allgemeine Terminarten", count: generalCount }] : [])
  ].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de"));
}

function formatShortGermanDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
    year: "numeric"
  }).format(date);
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

function buildReminderStatus(profiles: BookingProfile[], bookingTypes: BookingType[]): ReminderStatus {
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const activeTypes = bookingTypes.filter((type) => type.is_active);
  const rows = activeTypes.map((type) => {
    const reminder1 = Boolean(type.reminder_enabled);
    const reminder2 = Boolean(type.reminder_2_enabled);

    return {
      id: type.id,
      name: type.name,
      profileName: type.profile_id ? profileNames.get(type.profile_id) || "Profil nicht gefunden" : "Allgemeine Terminart",
      reminder1,
      reminder2
    };
  });

  return {
    activeTypes: activeTypes.length,
    disabledRows: rows.filter((row) => !row.reminder1 && !row.reminder2),
    enabledTypes: rows.filter((row) => row.reminder1 || row.reminder2).length
  };
}

function buildProductionChecks({
  activeProfiles,
  activeTypes,
  calendarConnections,
  calendarReady,
  emailConfigured,
  meetingConfigured,
  profileRows,
  publicBookingUrl,
  supabaseReady
}: {
  activeProfiles: number;
  activeTypes: number;
  calendarConnections: CalendarConnection[];
  calendarReady: boolean;
  emailConfigured: boolean;
  meetingConfigured: boolean;
  profileRows: ReturnType<typeof buildProfileRows>;
  publicBookingUrl: string;
  supabaseReady: boolean;
}): ProductionCheck[] {
  const bookingCalendarCount = calendarConnections.filter((connection) => connection.is_active && connection.use_for_booking).length;
  const availabilityCalendarCount = calendarConnections.filter((connection) => connection.is_active && connection.use_for_availability).length;
  const profilesWithoutTypes = profileRows.filter((profile) => profile.isActive && profile.bookingTypes === 0);

  return [
    {
      title: "Öffentliche Buchungsseite",
      status: "ready",
      detail: publicBookingUrl
    },
    {
      title: "Supabase-Datenbank",
      status: supabaseReady ? "ready" : "todo",
      detail: supabaseReady ? "Konfiguration vorhanden. Migrationen und Live-Daten können genutzt werden." : "Supabase-URL und Schlüssel müssen in Vercel gesetzt sein."
    },
    {
      title: "Profile & Terminarten",
      status: activeProfiles > 0 && activeTypes > 0 && profilesWithoutTypes.length === 0 ? "ready" : "warning",
      detail:
        profilesWithoutTypes.length > 0
          ? `${profilesWithoutTypes.length} aktives Profil hat noch keine Terminarten.`
          : `${activeProfiles} aktive Profile und ${activeTypes} aktive Terminarten.`
    },
    {
      title: "Kalenderabgleich",
      status: calendarReady && bookingCalendarCount === 1 && availabilityCalendarCount > 0 ? "ready" : "warning",
      detail:
        bookingCalendarCount === 1
          ? `${availabilityCalendarCount} Abgleich-Kalender aktiv. Neue Termine werden in genau einen Buchungskalender geschrieben.`
          : "Genau ein Buchungskalender muss aktiv sein; Abgleich-Kalender dürfen mehrere sein."
    },
    {
      title: "E-Mail-Zustellung",
      status: emailConfigured ? "ready" : "warning",
      detail: emailConfigured
        ? "SMTP-Daten sind gespeichert. Testmails an Gmail, Outlook und iCloud bleiben der nächste Praxistest."
        : "SMTP-Benutzer und Passwort fehlen noch. Diese Daten können unter Kalender & Meetings gespeichert werden."
    },
    {
      title: "Online-Meeting",
      status: meetingConfigured ? "ready" : "warning",
      detail: meetingConfigured ? "Mindestens ein Meeting-Link ist eingerichtet." : "Optional: Nur für Online-Termine erforderlich. Zoom, Teams oder Google Meet können bei Bedarf in Kalender & Meetings hinterlegt werden."
    }
  ];
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
