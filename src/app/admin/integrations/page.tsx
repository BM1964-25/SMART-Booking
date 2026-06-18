import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { MeetingServiceSettings } from "@/components/meeting-service-settings";
import { PasswordInputField } from "@/components/password-input-field";
import { SaveSubmitButton } from "@/components/save-submit-button";
import { requireAdmin } from "@/lib/admin";
import { getAppSettings, isMissingAppSettingsError, saveAppSettings } from "@/lib/app-settings";
import { listCalendars, matchesConfiguredCalendar } from "@/lib/calendar/caldav";
import { listGoogleCalendars } from "@/lib/calendar/google";
import { listMicrosoftCalendars } from "@/lib/calendar/microsoft";
import { getEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { CalendarConnection } from "@/lib/types";

export const dynamic = "force-dynamic";
const calendarListTimeoutMs = 5000;

type CalendarOption = {
  id: string;
  url: string;
  displayName: string;
  isConfiguredFallback: boolean;
};

export default async function AdminIntegrationsPage({
  searchParams
}: {
  searchParams?: Promise<{ calendarTab?: string; saved?: string; settingsSaved?: string; googleConnected?: string; microsoftConnected?: string; error?: string }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const supabase = createSupabaseAdmin();
  const [
    { data: connections },
    { error: schemaCheckError },
    appSettingsResult,
    { error: calendarProviderSchemaError },
    { error: microsoftSettingsSchemaError },
    { data: googleConnection, error: googleConnectionError },
    { data: microsoftConnection, error: microsoftConnectionError }
  ] = await Promise.all([
    supabase
      .from("calendar_connections")
      .select("*")
      .returns<CalendarConnection[]>(),
    supabase
      .from("calendar_connections")
      .select("id,use_for_booking,use_for_availability")
      .eq("provider", "apple")
      .limit(1),
    loadAppSettings(),
    supabase
      .from("app_settings")
      .select("id,active_calendar_provider,zoom_meeting_mode,google_meeting_mode,teams_meeting_mode,zoom_account_id,zoom_client_id,zoom_client_secret,google_client_id,google_client_secret")
      .eq("id", true)
      .limit(1),
    supabase
      .from("app_settings")
      .select("id,microsoft_client_id,microsoft_client_secret")
      .eq("id", true)
      .limit(1),
    supabase
      .from("calendar_oauth_connections")
      .select("account_email,is_active")
      .eq("provider", "google")
      .maybeSingle<{ account_email: string | null; is_active: boolean }>(),
    supabase
      .from("calendar_oauth_connections")
      .select("account_email,is_active")
      .eq("provider", "microsoft")
      .maybeSingle<{ account_email: string | null; is_active: boolean }>()
  ]);
  const schemaReady = !schemaCheckError;
  const settingsReady = !appSettingsResult.error;
  const calendarProviderReady = settingsReady && !calendarProviderSchemaError;
  const communicationSettingsReady = settingsReady && !calendarProviderSchemaError;
  const microsoftSettingsReady = settingsReady && !microsoftSettingsSchemaError;
  const googleOAuthTableMissing = Boolean(googleConnectionError && isMissingOAuthTableError(googleConnectionError.message));
  const microsoftOAuthTableMissing = Boolean(microsoftConnectionError && isMissingOAuthTableError(microsoftConnectionError.message));
  const appSettings = appSettingsResult.settings;
  const env = getEnv();
  const activeCalendarProvider = normalizeCalendarProvider(appSettings?.active_calendar_provider);

  if (!resolvedSearchParams?.calendarTab) {
    const params = new URLSearchParams();
    params.set("calendarTab", activeCalendarProvider);

    if (resolvedSearchParams?.saved) {
      params.set("saved", resolvedSearchParams.saved);
    }

    if (resolvedSearchParams?.settingsSaved) {
      params.set("settingsSaved", resolvedSearchParams.settingsSaved);
    }

    if (resolvedSearchParams?.googleConnected) {
      params.set("googleConnected", resolvedSearchParams.googleConnected);
    }

    if (resolvedSearchParams?.microsoftConnected) {
      params.set("microsoftConnected", resolvedSearchParams.microsoftConnected);
    }

    if (resolvedSearchParams?.error) {
      params.set("error", resolvedSearchParams.error);
    }

    redirect(`/admin/integrations?${params.toString()}`);
  }

  const selectedCalendarTab = normalizeCalendarProvider(resolvedSearchParams?.calendarTab || activeCalendarProvider);
  const savedConnections = schemaReady ? connections || [] : [];
  const googleAccountEmail = googleConnection?.is_active ? googleConnection.account_email : null;
  const microsoftAccountEmail = microsoftConnection?.is_active ? microsoftConnection.account_email : null;
  const appleConnections = savedConnections.filter((connection) => connection.provider === "apple");
  const googleConnections = savedConnections.filter((connection) => connection.provider === "google");
  const microsoftConnections = savedConnections.filter((connection) => connection.provider === "microsoft");
  const calendarsResult = schemaReady ? await loadAppleCalendarOptions(appleConnections) : { calendars: [], error: "" };
  const googleCalendarsResult = schemaReady && googleAccountEmail ? await loadGoogleCalendarOptions() : { calendars: [], error: "" };
  const microsoftCalendarsResult = schemaReady && microsoftAccountEmail ? await loadMicrosoftCalendarOptions() : { calendars: [], error: "" };
  const selectedBookingCalendar = findBookingCalendar(appleConnections, calendarsResult.calendars);
  const selectedAvailabilityCalendars = findAvailabilityCalendars(appleConnections, calendarsResult.calendars, selectedBookingCalendar);
  const selectedGoogleBookingCalendar = findBookingCalendar(googleConnections, googleCalendarsResult.calendars);
  const selectedGoogleAvailabilityCalendars = findAvailabilityCalendars(googleConnections, googleCalendarsResult.calendars, selectedGoogleBookingCalendar);
  const selectedMicrosoftBookingCalendar = findBookingCalendar(microsoftConnections, microsoftCalendarsResult.calendars);
  const selectedMicrosoftAvailabilityCalendars = findAvailabilityCalendars(microsoftConnections, microsoftCalendarsResult.calendars, selectedMicrosoftBookingCalendar);
  const displayMeetingValues = {
    googleClientId: appSettings?.google_client_id || env.GOOGLE_CLIENT_ID || null,
    googleMeetUrl: appSettings?.google_meet_url || env.GOOGLE_MEET_URL || null,
    zoomAccountId: appSettings?.zoom_account_id || env.ZOOM_ACCOUNT_ID || null,
    zoomClientId: appSettings?.zoom_client_id || env.ZOOM_CLIENT_ID || null,
    zoomMeetingUrl: appSettings?.zoom_meeting_url || env.ZOOM_MEETING_URL || null
  };

  async function saveAppleCalendarIntegration(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const bookingCalendarId = String(formData.get("booking_calendar_id") || "");
    const availabilityCalendarIds = formData.getAll("availability_calendar_ids").map((value) => String(value));
    const { error: schemaError } = await supabase
      .from("calendar_connections")
      .select("id,use_for_booking,use_for_availability")
      .eq("provider", "apple")
      .limit(1);

    if (schemaError && isMissingCalendarRoleColumnError(schemaError.message)) {
      redirect(`/admin/integrations?error=${encodeURIComponent("Die Kalenderrollen sind noch nicht vollständig eingerichtet. Bis dahin werden keine Kalendereinstellungen verändert.")}`);
    }

    if (!bookingCalendarId) {
      revalidatePath("/admin/integrations");
      redirect("/admin/integrations?calendarTab=apple&error=Bitte%20Buchungskalender%20ausw%C3%A4hlen.");
    }

    const calendars = await loadAppleCalendarOptions([]);

    if (calendars.error) {
      redirect(`/admin/integrations?error=${encodeURIComponent(calendars.error)}`);
    }

    const selectedIds = new Set([bookingCalendarId, ...availabilityCalendarIds]);
    const rows = calendars.calendars.filter((calendar) => selectedIds.has(calendar.id)).map((calendar) => ({
      provider: "apple",
      calendar_id: calendar.id,
      display_name: calendar.displayName,
      is_active: true,
      use_for_booking: calendar.id === bookingCalendarId,
      use_for_availability: availabilityCalendarIds.includes(calendar.id)
    }));

    const { error: resetBookingError } = await supabase
      .from("calendar_connections")
      .update({ use_for_booking: false, use_for_availability: false })
      .eq("provider", "apple");

    if (resetBookingError) {
      revalidatePath("/admin/integrations");
      redirect(`/admin/integrations?error=${encodeURIComponent(resetBookingError.message)}`);
    }

    const { error } = await supabase.from("calendar_connections").upsert(rows, {
      onConflict: "provider,calendar_id"
    });

    if (error) {
      revalidatePath("/admin/integrations");
      redirect(`/admin/integrations?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect("/admin/integrations?calendarTab=apple&saved=1");
  }

  async function saveGoogleCalendarIntegration(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const bookingCalendarId = String(formData.get("booking_google_calendar_id") || "");
    const availabilityCalendarIds = formData.getAll("availability_google_calendar_ids").map((value) => String(value));

    if (!bookingCalendarId) {
      redirect("/admin/integrations?calendarTab=google&error=Bitte%20Google%20Buchungskalender%20ausw%C3%A4hlen.");
    }

    let calendars: CalendarOption[] = [];

    try {
      calendars = (await listGoogleCalendars()).map((calendar) => ({
        id: calendar.id,
        url: calendar.id,
        displayName: calendar.displayName,
        isConfiguredFallback: calendar.primary === true
      }));
    } catch (error) {
      redirect(`/admin/integrations?calendarTab=google&error=${encodeURIComponent(error instanceof Error ? error.message : "Google Kalender konnten nicht geladen werden.")}`);
    }

    const selectedIds = new Set([bookingCalendarId, ...availabilityCalendarIds]);
    const rows = calendars.filter((calendar) => selectedIds.has(calendar.id)).map((calendar) => ({
      provider: "google",
      calendar_id: calendar.id,
      display_name: calendar.displayName,
      is_active: true,
      use_for_booking: calendar.id === bookingCalendarId,
      use_for_availability: availabilityCalendarIds.includes(calendar.id)
    }));

    const { error: resetError } = await supabase
      .from("calendar_connections")
      .update({ use_for_booking: false, use_for_availability: false })
      .eq("provider", "google");

    if (resetError) {
      redirect(`/admin/integrations?calendarTab=google&error=${encodeURIComponent(resetError.message)}`);
    }

    const { error } = await supabase.from("calendar_connections").upsert(rows, {
      onConflict: "provider,calendar_id"
    });

    if (error) {
      redirect(`/admin/integrations?calendarTab=google&error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect("/admin/integrations?calendarTab=google&saved=1");
  }

  async function saveMicrosoftCalendarIntegration(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const bookingCalendarId = String(formData.get("booking_microsoft_calendar_id") || "");
    const availabilityCalendarIds = formData.getAll("availability_microsoft_calendar_ids").map((value) => String(value));

    if (!bookingCalendarId) {
      redirect("/admin/integrations?calendarTab=microsoft&error=Bitte%20Microsoft%20Buchungskalender%20ausw%C3%A4hlen.");
    }

    let calendars: CalendarOption[] = [];

    try {
      calendars = (await listMicrosoftCalendars()).map((calendar) => ({
        id: calendar.id,
        url: calendar.id,
        displayName: calendar.displayName,
        isConfiguredFallback: calendar.primary === true
      }));
    } catch (error) {
      redirect(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(error instanceof Error ? error.message : "Microsoft Kalender konnten nicht geladen werden.")}`);
    }

    const selectedIds = new Set([bookingCalendarId, ...availabilityCalendarIds]);
    const rows = calendars.filter((calendar) => selectedIds.has(calendar.id)).map((calendar) => ({
      provider: "microsoft",
      calendar_id: calendar.id,
      display_name: calendar.displayName,
      is_active: true,
      use_for_booking: calendar.id === bookingCalendarId,
      use_for_availability: availabilityCalendarIds.includes(calendar.id)
    }));

    const { error: resetError } = await supabase
      .from("calendar_connections")
      .update({ use_for_booking: false, use_for_availability: false })
      .eq("provider", "microsoft");

    if (resetError) {
      redirect(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(resetError.message)}`);
    }

    const { error } = await supabase.from("calendar_connections").upsert(rows, {
      onConflict: "provider,calendar_id"
    });

    if (error) {
      redirect(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect("/admin/integrations?calendarTab=microsoft&saved=1");
  }

  async function saveCalendarProviderSettings(formData: FormData) {
    "use server";

    await requireAdmin();
    const provider = normalizeCalendarProvider(nullableText(formData.get("active_calendar_provider")));
    const { error } = await saveAppSettings({
      active_calendar_provider: provider
    });

    if (error) {
      redirect(`/admin/integrations?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect(`/admin/integrations?calendarTab=${provider}&saved=1`);
  }

  async function saveCommunicationSettings(formData: FormData) {
    "use server";

    await requireAdmin();
    const currentSettings = await getAppSettings();
    const provider = normalizeCalendarProvider(nullableText(formData.get("active_calendar_provider")));
    const googleMeetingMode = normalizeMeetingMode(nullableText(formData.get("google_meeting_mode")));
    const zoomMeetingMode = normalizeMeetingMode(nullableText(formData.get("zoom_meeting_mode")));
    let googleClientId = nullableTextOrExisting(formData, "google_client_id", currentSettings?.google_client_id);
    let googleMeetUrl = nullableTextOrExisting(formData, "google_meet_url", currentSettings?.google_meet_url);
    let zoomAccountId = nullableTextOrExisting(formData, "zoom_account_id", currentSettings?.zoom_account_id);
    let zoomClientId = nullableTextOrExisting(formData, "zoom_client_id", currentSettings?.zoom_client_id);
    let zoomMeetingUrl = nullableTextOrExisting(formData, "zoom_meeting_url", currentSettings?.zoom_meeting_url);
    const microsoftClientId = nullableTextOrExisting(formData, "microsoft_client_id", currentSettings?.microsoft_client_id);
    const microsoftClientSecret = nullableTextOrExisting(formData, "microsoft_client_secret", currentSettings?.microsoft_client_secret);

    const googleValuesError = validateGoogleMeetingValues({
      clientId: googleClientId,
      meetUrl: googleMeetUrl,
      validateClientId: googleMeetingMode === "api" || formData.has("google_client_id"),
      validateMeetUrl: googleMeetingMode === "fixed_link" || formData.has("google_meet_url")
    });
    const zoomValuesError = validateZoomMeetingValues({
      accountId: zoomAccountId,
      clientId: zoomClientId,
      meetingUrl: zoomMeetingUrl,
      validateApi: zoomMeetingMode === "api" || formData.has("zoom_account_id") || formData.has("zoom_client_id"),
      validateLink: zoomMeetingMode === "fixed_link" || formData.has("zoom_meeting_url")
    });

    if (googleValuesError) {
      redirect(`/admin/integrations?error=${encodeURIComponent(googleValuesError)}`);
    }

    if (zoomValuesError) {
      redirect(`/admin/integrations?error=${encodeURIComponent(zoomValuesError)}`);
    }

    const { error } = await saveAppSettings({
      active_calendar_provider: provider,
      booking_owner_email: nullableText(formData.get("booking_owner_email")),
      google_meeting_mode: googleMeetingMode,
      google_client_id: googleClientId,
      google_client_secret: nullableTextOrExisting(formData, "google_client_secret", currentSettings?.google_client_secret),
      google_meet_url: googleMeetUrl,
      mail_from: nullableText(formData.get("mail_from")),
      ...(formData.has("microsoft_client_id") || formData.has("microsoft_client_secret")
        ? {
            microsoft_client_id: microsoftClientId,
            microsoft_client_secret: microsoftClientSecret
          }
        : {}),
      onsite_meeting_url: nullableText(formData.get("onsite_meeting_url")),
      smtp_host: nullableText(formData.get("smtp_host")) || "smtp-relay.brevo.com",
      smtp_password: nullableText(formData.get("smtp_password")),
      smtp_port: Number(formData.get("smtp_port") || 587),
      smtp_user: nullableText(formData.get("smtp_user")),
      teams_meeting_url: nullableTextOrExisting(formData, "teams_meeting_url", currentSettings?.teams_meeting_url),
      teams_meeting_mode: normalizeMeetingMode(nullableText(formData.get("teams_meeting_mode"))),
      zoom_account_id: zoomAccountId,
      zoom_client_id: zoomClientId,
      zoom_client_secret: nullableTextOrExisting(formData, "zoom_client_secret", currentSettings?.zoom_client_secret),
      zoom_meeting_mode: zoomMeetingMode,
      zoom_meeting_url: zoomMeetingUrl
    });

    if (error) {
      redirect(`/admin/integrations?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    revalidatePath("/admin");
    revalidatePath("/book");
    redirect(`/admin/integrations?calendarTab=${provider}&settingsSaved=1`);
  }

  async function saveMicrosoftOAuthSettings(formData: FormData) {
    "use server";

    await requireAdmin();
    const microsoftClientId = nullableText(formData.get("microsoft_client_id"));
    const microsoftClientSecret = nullableText(formData.get("microsoft_client_secret"));

    if (!microsoftClientId || !microsoftClientSecret) {
      redirect("/admin/integrations?calendarTab=microsoft&error=Bitte%20Microsoft%20OAuth%20Client%20ID%20und%20Client%20Secret%20eintragen.");
    }

    if (microsoftClientId.startsWith("http")) {
      redirect("/admin/integrations?calendarTab=microsoft&error=Im%20Feld%20Microsoft%20OAuth%20Client%20ID%20steht%20ein%20Link.%20Dort%20geh%C3%B6rt%20die%20Client%20ID%20aus%20Azure%20hinein.");
    }

    const { error } = await saveAppSettings({
      microsoft_client_id: microsoftClientId,
      microsoft_client_secret: microsoftClientSecret
    });

    if (error) {
      redirect(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/integrations");
    redirect("/admin/integrations?calendarTab=microsoft&settingsSaved=1");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Kalender & Meetings</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Verbinden Sie Kalender und Meeting-Dienste so, dass SMART Booking freie Zeiten korrekt prüft und neue Buchungen kontrolliert in den richtigen Kalender schreibt.
      </p>
      <AdminNav />

      {!schemaReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Technische Einrichtung erforderlich</p>
          <p>
            Die Kalenderauswahl ist noch nicht vollständig eingerichtet. Vorher zeigt SMART Booking keine Kalenderauswahl und speichert keine neue Mehrkalender-Auswahl.
          </p>
        </div>
      ) : null}
      {!settingsReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Technische Einrichtung erforderlich</p>
          <p>
            Die Speicherung von Kalenderanbieter, E-Mail- und Meeting-Daten ist noch nicht vollständig eingerichtet. Danach können diese Angaben direkt in SMART Booking
            gespeichert werden.
          </p>
        </div>
      ) : null}
      {settingsReady && !calendarProviderReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Technische Einrichtung erforderlich</p>
          <p>
            Kalenderanbieter und Meeting-Modi können noch nicht dauerhaft gespeichert werden. Bitte schließen Sie die technische Einrichtung ab.
          </p>
        </div>
      ) : null}
      {settingsReady && googleOAuthTableMissing ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Technische Einrichtung erforderlich</p>
          <p>
            Die Google-Kalenderverbindung ist noch nicht vollständig eingerichtet. Danach kann Google Kalender verbunden werden.
          </p>
        </div>
      ) : null}
      {settingsReady && microsoftOAuthTableMissing ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Technische Einrichtung erforderlich</p>
          <p>
            Die Microsoft-Kalenderverbindung ist noch nicht vollständig eingerichtet. Danach kann Microsoft 365 / Outlook verbunden werden.
          </p>
        </div>
      ) : null}

      {resolvedSearchParams?.saved ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Integration wurde gespeichert.</p>
      ) : null}
      {resolvedSearchParams?.settingsSaved ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">E-Mail- und Meeting-Daten wurden gespeichert.</p>
      ) : null}
      {resolvedSearchParams?.googleConnected ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Google Kalender wurde verbunden.</p>
      ) : null}
      {resolvedSearchParams?.microsoftConnected ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Microsoft 365 / Outlook wurde verbunden.</p>
      ) : null}
      {resolvedSearchParams?.error ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{resolvedSearchParams.error}</p>
      ) : null}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Kalenderanbieter & Kalenderauswahl</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              SMART Booking nutzt pro Installation genau einen aktiven Kalenderanbieter. Wählen Sie unten den Dienst aus, den Sie prüfen oder bearbeiten möchten.
              Abgleich-Kalender können nur aus dem aktiv gesetzten Anbieter stammen.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Aktiv: {getCalendarProviderLabel(activeCalendarProvider)}</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3" role="tablist" aria-label="Kalenderanbieter">
          <CalendarProviderCard
            active={selectedCalendarTab === "apple"}
            current={activeCalendarProvider === "apple"}
            description="Produktiv angebunden. Ein Apple-/iCloud-Kalender erhält neue Buchungen, weitere Kalender können die Verfügbarkeit prüfen."
            href="/admin/integrations?calendarTab=apple"
            label="Apple / iCloud"
            meta={`${calendarsResult.calendars.length} Kalender`}
            status={activeCalendarProvider === "apple" ? "Aktiv" : "Nutzbar"}
          />
          <CalendarProviderCard
            active={selectedCalendarTab === "google"}
            current={activeCalendarProvider === "google"}
            description="Nutzbar nach Google-Verbindung. Ein Google-Kalender erhält neue Buchungen, weitere Google-Kalender prüfen belegte Zeiten."
            href="/admin/integrations?calendarTab=google"
            label="Google Kalender"
            meta={googleAccountEmail ? `${googleCalendarsResult.calendars.length} Kalender` : "Verbinden"}
            status={activeCalendarProvider === "google" ? "Aktiv" : googleAccountEmail ? "Verbunden" : "Vorbereitet"}
          />
          <CalendarProviderCard
            active={selectedCalendarTab === "microsoft"}
            current={activeCalendarProvider === "microsoft"}
            description="Nutzbar nach Microsoft-Verbindung. Ein Outlook-/Microsoft-Kalender erhält neue Buchungen, weitere Microsoft-Kalender prüfen belegte Zeiten."
            href="/admin/integrations?calendarTab=microsoft"
            label="Microsoft 365 / Outlook"
            meta={microsoftAccountEmail ? `${microsoftCalendarsResult.calendars.length} Kalender` : "Verbinden"}
            status={activeCalendarProvider === "microsoft" ? "Aktiv" : microsoftAccountEmail ? "Verbunden" : "Vorbereitet"}
          />
        </div>

        {selectedCalendarTab !== activeCalendarProvider ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-200 bg-brand-50 p-3">
            <p className="text-sm leading-6 text-slate-600">
              Sie bearbeiten gerade {getCalendarProviderLabel(selectedCalendarTab)}. Für neue Buchungen bleibt aktuell {getCalendarProviderLabel(activeCalendarProvider)} zuständig. Der
              Button rechts macht den ausgewählten Anbieter aktiv; die Kalenderrollen im Abschnitt darunter speichern Sie separat.
            </p>
            {calendarProviderReady &&
            (selectedCalendarTab === "apple" ||
              (selectedCalendarTab === "google" && googleAccountEmail) ||
              (selectedCalendarTab === "microsoft" && microsoftSettingsReady && microsoftAccountEmail)) ? (
              <form action={saveCalendarProviderSettings}>
                <input type="hidden" name="active_calendar_provider" value={selectedCalendarTab} />
                <SaveSubmitButton
                  idleLabel="Als aktiven Anbieter speichern"
                  pendingLabel="Wird gespeichert"
                  savedLabel="Gespeichert"
                  className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
                />
              </form>
            ) : (
              <button type="button" disabled className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white">
                Einrichtung zuerst abschließen
              </button>
            )}
          </div>
        ) : null}

        {selectedCalendarTab === "google" ? googleAccountEmail ? (
        <form action={saveGoogleCalendarIntegration} className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Google Kalender</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Verbunden mit {googleAccountEmail}. Wählen Sie genau einen Google-Kalender für neue Buchungen und bei Bedarf weitere Google-Kalender für den Abgleich
                belegter Zeiten.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${googleCalendarsResult.error ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {googleCalendarsResult.error ? "Prüfung erforderlich" : `${googleCalendarsResult.calendars.length} Kalender gefunden`}
            </span>
          </div>

          {googleCalendarsResult.error ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Google Kalender konnte gerade nicht geladen werden.</p>
              <p>{googleCalendarsResult.error}</p>
            </div>
          ) : null}

          <fieldset className="mt-5 rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">Google-Kalenderrollen</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Genau ein Kalender erhält neue Buchungen. Weitere Google-Kalender können für die Verfügbarkeitsprüfung berücksichtigt werden.
            </p>
            <div className="mt-4 space-y-2">
              {googleCalendarsResult.calendars.length > 0 ? (
                <>
                  <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px] gap-3 px-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                    <span>Kalender</span>
                    <span className="text-center leading-tight">
                      <span className="block">Neue</span>
                      <span className="block">Buchungen</span>
                    </span>
                    <span className="text-center leading-tight">
                      <span className="block">Verfügbarkeit</span>
                      <span className="block">prüfen</span>
                    </span>
                  </div>
                  {googleCalendarsResult.calendars.map((calendar) => (
                    <div key={calendar.id} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm md:grid-cols-[minmax(0,1fr)_150px_150px] md:items-center">
                      <CalendarLabel calendar={calendar} />
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Neue Buchungen in diesen Kalender eintragen">
                        <input
                          type="radio"
                          name="booking_google_calendar_id"
                          value={calendar.id}
                          defaultChecked={calendar.id === selectedGoogleBookingCalendar}
                          className="h-4 w-4 accent-brand-500"
                        />
                      </label>
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Diesen Kalender für die Verfügbarkeitsprüfung berücksichtigen">
                        <input
                          type="checkbox"
                          name="availability_google_calendar_ids"
                          value={calendar.id}
                          defaultChecked={selectedGoogleAvailabilityCalendars.includes(calendar.id)}
                          className="h-4 w-4 rounded accent-brand-500"
                        />
                      </label>
                    </div>
                  ))}
                </>
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Google Kalender werden nach erfolgreicher Verbindung angezeigt.
                </p>
              )}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-xs leading-5 text-slate-600">
              {activeCalendarProvider === "google"
                ? "Speichert, welcher Google-Kalender neue Buchungen erhält und welche Google-Kalender belegte Zeiten blockieren."
                : `Speichert nur die Google-Kalenderauswahl. Für neue Buchungen bleibt ${getCalendarProviderLabel(activeCalendarProvider)} aktiv, bis Sie oben den Anbieter wechseln.`}
            </p>
            <SaveSubmitButton
              idleLabel="Google Kalender speichern"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          </div>
        </form>
        ) : (
          <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-5 text-sm leading-6 text-slate-700">
            <p className="font-semibold">Google Kalender ist noch nicht verbunden.</p>
            <p className="mt-1">
              Tragen Sie unten bei E-Mail & Meeting-Dienste zuerst die Google OAuth Client ID und das Google OAuth Client Secret ein. Danach können Sie Google verbinden und
              hier den Buchungskalender sowie die Abgleich-Kalender auswählen.
            </p>
          </div>
        ) : null}

      {selectedCalendarTab === "apple" ? (
      <form action={saveAppleCalendarIntegration} className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Apple CalDAV</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Wählen Sie genau einen Apple-Kalender aus, der neue Buchungen erhält. Zusätzlich können weitere Apple-Kalender für die Verfügbarkeitsprüfung berücksichtigt
              werden, damit private Termine, Urlaub oder andere Belegungen keine freien Zeitfenster erzeugen.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${calendarsResult.error ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {calendarsResult.error ? "Prüfung erforderlich" : `${calendarsResult.calendars.length} Kalender gefunden`}
          </span>
        </div>

        {calendarsResult.error ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Apple CalDAV konnte gerade nicht geladen werden.</p>
            <p>{calendarsResult.error}</p>
          </div>
        ) : null}

        <fieldset className="mt-5 rounded-md border border-slate-200 p-4">
          <legend className="px-2 text-sm font-semibold text-slate-950">Kalenderrollen</legend>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Der Link wird je Kalender nur einmal angezeigt. Wählen Sie genau einen Kalender für neue Buchungen. Zusätzlich können weitere Apple-Kalender für die
            Verfügbarkeitsprüfung berücksichtigt werden.
          </p>
          <div className="mt-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
            <span>
              <span className="font-semibold text-slate-950">Buchungskalender:</span> ein Kalender für neue Buchungen.
            </span>
            <span>
              <span className="font-semibold text-slate-950">Abgleich-Kalender:</span> weitere Apple-Kalender zur reinen Verfügbarkeitsprüfung.
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {calendarsResult.calendars.length > 0 ? (
              <>
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px] gap-3 px-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                  <span>Kalender</span>
                  <span className="text-center leading-tight">
                    <span className="block">Neue</span>
                    <span className="block">Buchungen</span>
                  </span>
                  <span className="text-center leading-tight">
                    <span className="block">Verfügbarkeit</span>
                    <span className="block">prüfen</span>
                  </span>
                </div>
                {calendarsResult.calendars.map((calendar) => (
                  <div key={calendar.id} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm md:grid-cols-[minmax(0,1fr)_150px_150px] md:items-center">
                    <CalendarLabel calendar={calendar} />
                    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Neue Buchungen in diesen Kalender eintragen">
                      <input
                        type="radio"
                        name="booking_calendar_id"
                        value={calendar.id}
                        defaultChecked={calendar.id === selectedBookingCalendar}
                        className="h-4 w-4 accent-brand-500"
                      />
                    </label>
                    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Diesen Kalender für die Verfügbarkeitsprüfung berücksichtigen">
                      <input
                        type="checkbox"
                        name="availability_calendar_ids"
                        value={calendar.id}
                        defaultChecked={selectedAvailabilityCalendars.includes(calendar.id)}
                        className="h-4 w-4 rounded accent-brand-500"
                      />
                    </label>
                  </div>
                ))}
              </>
            ) : (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Kalender werden angezeigt, sobald die technische Einrichtung abgeschlossen ist.
              </p>
            )}
          </div>
        </fieldset>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-950">Sicherheitslogik</p>
          <p>
            SMART Booking trägt neue Termine nur im ausgewählten Buchungskalender ein. Alle Abgleich-Kalender dienen ausschließlich der Verfügbarkeitsprüfung und werden
            nicht verändert.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-xs leading-5 text-slate-600">
            {activeCalendarProvider === "apple"
              ? "Speichert, welcher Apple-Kalender neue Buchungen erhält und welche Apple-Kalender belegte Zeiten blockieren."
              : `Speichert nur die Apple-Kalenderauswahl. Für neue Buchungen bleibt ${getCalendarProviderLabel(activeCalendarProvider)} aktiv, bis Sie oben den Anbieter wechseln.`}
          </p>
          {schemaReady ? (
            <SaveSubmitButton
              idleLabel="Kalender speichern"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          ) : (
            <button type="button" disabled className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white">
              Einrichtung zuerst abschließen
            </button>
          )}
        </div>
      </form>
      ) : null}

      {selectedCalendarTab === "microsoft" ? microsoftAccountEmail ? (
        <form action={saveMicrosoftCalendarIntegration} className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Microsoft 365 / Outlook</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Verbunden mit {microsoftAccountEmail}. Wählen Sie genau einen Microsoft-Kalender für neue Buchungen und bei Bedarf weitere Microsoft-Kalender für den
                Abgleich belegter Zeiten.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${microsoftCalendarsResult.error ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {microsoftCalendarsResult.error ? "Prüfung erforderlich" : `${microsoftCalendarsResult.calendars.length} Kalender gefunden`}
            </span>
          </div>

          {microsoftCalendarsResult.error ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Microsoft Kalender konnte gerade nicht geladen werden.</p>
              <p>{microsoftCalendarsResult.error}</p>
            </div>
          ) : null}

          <fieldset className="mt-5 rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">Microsoft-Kalenderrollen</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Genau ein Outlook-/Microsoft-Kalender erhält neue Buchungen. Weitere Microsoft-Kalender können für die Verfügbarkeitsprüfung berücksichtigt werden.
            </p>
            <div className="mt-4 space-y-2">
              {microsoftCalendarsResult.calendars.length > 0 ? (
                <>
                  <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px] gap-3 px-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                    <span>Kalender</span>
                    <span className="text-center leading-tight">
                      <span className="block">Neue</span>
                      <span className="block">Buchungen</span>
                    </span>
                    <span className="text-center leading-tight">
                      <span className="block">Verfügbarkeit</span>
                      <span className="block">prüfen</span>
                    </span>
                  </div>
                  {microsoftCalendarsResult.calendars.map((calendar) => (
                    <div key={calendar.id} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm md:grid-cols-[minmax(0,1fr)_150px_150px] md:items-center">
                      <CalendarLabel calendar={calendar} />
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Neue Buchungen in diesen Kalender eintragen">
                        <input
                          type="radio"
                          name="booking_microsoft_calendar_id"
                          value={calendar.id}
                          defaultChecked={calendar.id === selectedMicrosoftBookingCalendar}
                          className="h-4 w-4 accent-brand-500"
                        />
                      </label>
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-brand-300" title="Diesen Kalender für die Verfügbarkeitsprüfung berücksichtigen">
                        <input
                          type="checkbox"
                          name="availability_microsoft_calendar_ids"
                          value={calendar.id}
                          defaultChecked={selectedMicrosoftAvailabilityCalendars.includes(calendar.id)}
                          className="h-4 w-4 rounded accent-brand-500"
                        />
                      </label>
                    </div>
                  ))}
                </>
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Microsoft Kalender werden nach erfolgreicher Verbindung angezeigt.
                </p>
              )}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-xs leading-5 text-slate-600">
              {activeCalendarProvider === "microsoft"
                ? "Speichert, welcher Microsoft-Kalender neue Buchungen erhält und welche Microsoft-Kalender belegte Zeiten blockieren."
                : `Speichert nur die Microsoft-Kalenderauswahl. Für neue Buchungen bleibt ${getCalendarProviderLabel(activeCalendarProvider)} aktiv, bis Sie oben den Anbieter wechseln.`}
            </p>
            <SaveSubmitButton
              idleLabel="Microsoft Kalender speichern"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-5 text-sm leading-6 text-slate-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">Microsoft 365 / Outlook ist noch nicht verbunden.</p>
              <p className="mt-1 max-w-3xl">
                Speichern Sie zuerst die Microsoft OAuth-Daten. Danach verbinden Sie Microsoft und wählen anschließend einen Buchungskalender sowie optionale
                Prüfkalender aus.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Microsoft vorbereiten</span>
          </div>
          {microsoftSettingsReady ? (
            <>
              <form action={saveMicrosoftOAuthSettings} className="mt-4 rounded-md border border-blue-100 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField label="Microsoft OAuth Client ID" name="microsoft_client_id" defaultValue={appSettings?.microsoft_client_id || env.MICROSOFT_CLIENT_ID || ""} />
                  <PasswordInputField label="Microsoft OAuth Client Secret" name="microsoft_client_secret" defaultValue={appSettings?.microsoft_client_secret || env.MICROSOFT_CLIENT_SECRET || ""} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-2xl text-xs leading-5 text-slate-500">
                    Schritt 1: OAuth-Daten speichern. Schritt 2: Microsoft verbinden. Danach erscheinen die Microsoft-Kalender zur Auswahl.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <SaveSubmitButton
                      idleLabel="OAuth-Daten speichern"
                      pendingLabel="Wird gespeichert"
                      savedLabel="Gespeichert"
                      className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
                    />
                    <a
                      href="/api/integrations/microsoft/connect"
                      className="inline-flex rounded-md border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
                    >
                      Microsoft verbinden
                    </a>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">Microsoft-Erweiterung noch nicht vollständig eingerichtet</p>
              <p className="mt-1">
                Die Oberfläche ist vorbereitet. Damit Microsoft OAuth-Daten gespeichert werden können, müssen in der Datenbank noch zwei Felder ergänzt werden.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-800">{`alter table app_settings
  add column if not exists microsoft_client_id text,
  add column if not exists microsoft_client_secret text;`}</pre>
            </div>
          )}
        </div>
      ) : null}
      </section>

      <form action={saveCommunicationSettings} className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="active_calendar_provider" value={activeCalendarProvider} />
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">E-Mail & Meeting-Dienste</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Hinterlegen Sie die Daten, die SMART Booking für Bestätigungsmails, Kalenderverbindungen und Online-Meeting-Links nutzt. Gespeicherte Werte werden für neue
              Buchungen verwendet und können jederzeit angepasst werden.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${communicationSettingsReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {communicationSettingsReady ? "Speicher bereit" : "Einrichtung offen"}
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <fieldset className="rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">E-Mail-Versand</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Diese Daten benötigt SMART Booking, um Kunden und Betreiber nach einer Buchung per E-Mail zu informieren.
            </p>
            <div className="mt-4 grid gap-3">
              <InputField label="SMTP-Host" name="smtp_host" defaultValue={appSettings?.smtp_host || env.SMTP_HOST || "smtp-relay.brevo.com"} />
              <InputField label="SMTP-Port" name="smtp_port" type="number" defaultValue={String(appSettings?.smtp_port || env.SMTP_PORT || 587)} />
              <InputField label="SMTP-Benutzer" name="smtp_user" defaultValue={appSettings?.smtp_user || env.SMTP_USER || ""} />
              <PasswordInputField label="SMTP-Passwort" name="smtp_password" defaultValue={appSettings?.smtp_password || env.SMTP_PASSWORD || ""} />
              <InputField label="Absender" name="mail_from" defaultValue={appSettings?.mail_from || env.MAIL_FROM || "SMART Booking <termine@builtsmart-ai.app>"} />
              <InputField label="Admin-/Empfänger-E-Mail" name="booking_owner_email" type="email" defaultValue={appSettings?.booking_owner_email || env.BOOKING_OWNER_EMAIL || ""} />
            </div>
          </fieldset>

          <fieldset className="rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-950">Ortstermin</legend>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Optionaler Link oder eine feste Adresse, die bei Terminarten mit Ortstermin in Kalender und E-Mail übernommen wird.
            </p>
            <div className="mt-4 grid gap-3">
              <InputField label="Ortstermin-Link / Adresse" name="onsite_meeting_url" type="url" defaultValue={appSettings?.onsite_meeting_url || env.ONSITE_MEETING_URL || ""} />
            </div>
          </fieldset>
        </div>

        <MeetingServiceSettings
          activeCalendarProvider={activeCalendarProvider}
          googleClientId={displayMeetingValues.googleClientId || ""}
          googleClientSecret={appSettings?.google_client_secret || env.GOOGLE_CLIENT_SECRET || ""}
          googleConnectedEmail={googleAccountEmail}
          googleMeetUrl={displayMeetingValues.googleMeetUrl || ""}
          googleMode={normalizeMeetingMode(appSettings?.google_meeting_mode)}
          microsoftConnectedEmail={microsoftAccountEmail}
          teamsMode={normalizeMeetingMode(appSettings?.teams_meeting_mode)}
          teamsUrl={appSettings?.teams_meeting_url || env.TEAMS_MEETING_URL || ""}
          zoomAccountId={displayMeetingValues.zoomAccountId || ""}
          zoomClientId={displayMeetingValues.zoomClientId || ""}
          zoomClientSecret={appSettings?.zoom_client_secret || env.ZOOM_CLIENT_SECRET || ""}
          zoomMode={normalizeMeetingMode(appSettings?.zoom_meeting_mode)}
          zoomUrl={displayMeetingValues.zoomMeetingUrl || ""}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-3xl text-xs leading-5 text-slate-500">
            Die gespeicherten Daten werden für E-Mail-Versand, Kalenderverbindung und Meeting-Links verwendet. Änderungen wirken sich auf neue Buchungen aus.
          </p>
          {communicationSettingsReady ? (
            <SaveSubmitButton
              idleLabel="E-Mail & Meetings speichern"
              pendingLabel="Wird gespeichert"
              savedLabel="Gespeichert"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:bg-slate-300"
            />
          ) : (
            <button type="button" disabled className="rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-white">
              Einrichtung zuerst abschließen
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

async function loadAppSettings() {
  try {
    return { settings: await getAppSettings(), error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "App-Einstellungen konnten nicht geladen werden.";
    return {
      settings: null,
      error: isMissingAppSettingsError(message) ? "Die App-Einstellungen sind noch nicht vollständig eingerichtet." : message
    };
  }
}

async function loadAppleCalendarOptions(savedConnections: CalendarConnection[]) {
  try {
    const env = getEnv();
    const calendars = (await withTimeout(listCalendars(), calendarListTimeoutMs)).filter(isEventCalendar);

    return {
      calendars: calendars.map((calendar) => {
        const url = normalizeCalendarValue(calendar.url);
        const displayName = normalizeCalendarValue(calendar.displayName) || url || "Apple Kalender";

        return {
          id: url || displayName,
          url,
          displayName,
          isConfiguredFallback: env.APPLE_CALENDAR_ID ? matchesConfiguredCalendar(calendar, env.APPLE_CALENDAR_ID) : savedConnections.length === 0
        };
      }),
      error: ""
    };
  } catch (error) {
    return {
      calendars: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Apple-Kalender."
    };
  }
}

async function loadGoogleCalendarOptions() {
  try {
    const calendars = await withTimeout(listGoogleCalendars(), calendarListTimeoutMs);

    return {
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        url: calendar.id,
        displayName: calendar.displayName,
        isConfiguredFallback: calendar.primary === true
      })),
      error: ""
    };
  } catch (error) {
    return {
      calendars: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Google-Kalender."
    };
  }
}

async function loadMicrosoftCalendarOptions() {
  try {
    const calendars = await withTimeout(listMicrosoftCalendars(), calendarListTimeoutMs);

    return {
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        url: calendar.id,
        displayName: calendar.displayName,
        isConfiguredFallback: calendar.primary === true
      })),
      error: ""
    };
  } catch (error) {
    return {
      calendars: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Microsoft-Kalender."
    };
  }
}

function findBookingCalendar(connections: CalendarConnection[], calendars: CalendarOption[]) {
  const saved = connections.find((connection) => connection.is_active && connection.use_for_booking && connection.calendar_id)?.calendar_id;
  const fallback = calendars.find((calendar) => calendar.isConfiguredFallback)?.id || calendars[0]?.id || "";

  return saved || fallback;
}

function findAvailabilityCalendars(connections: CalendarConnection[], calendars: CalendarOption[], bookingCalendarId: string) {
  const saved = connections
    .filter((connection) => connection.is_active && connection.use_for_availability && connection.calendar_id)
    .map((connection) => connection.calendar_id || "");

  if (saved.length > 0) {
    return saved;
  }

  return bookingCalendarId ? [bookingCalendarId] : calendars.slice(0, 1).map((calendar) => calendar.id);
}

function isMissingCalendarRoleColumnError(message: string) {
  return message.includes("use_for_booking") || message.includes("use_for_availability") || message.includes("schema cache");
}

function isMissingOAuthTableError(message: string) {
  return message.includes("calendar_oauth_connections") || message.includes("schema cache");
}

function normalizeCalendarValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isEventCalendar(calendar: { components?: unknown; displayName?: unknown }) {
  if (!Array.isArray(calendar.components)) {
    return normalizeCalendarValue(calendar.displayName).toLowerCase() !== "erinnerungen";
  }

  return calendar.components.some((component) => String(component).toUpperCase() === "VEVENT");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Apple CalDAV antwortet gerade nicht rechtzeitig. Bitte später erneut öffnen.")), timeoutMs);
    })
  ]);
}

function CalendarLabel({ calendar }: { calendar: CalendarOption }) {
  return (
    <span className="min-w-0">
      <span className="block font-semibold text-slate-950">{calendar.displayName}</span>
      <span className="mt-1 block break-all text-xs leading-5 text-slate-500">{calendar.url}</span>
      {calendar.isConfiguredFallback ? <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Aktuelle Standardauswahl</span> : null}
    </span>
  );
}

function CalendarProviderCard({
  active,
  current,
  description,
  href,
  label,
  meta,
  muted = false,
  status
}: {
  active: boolean;
  current: boolean;
  description: string;
  href: string;
  label: string;
  meta: string;
  muted?: boolean;
  status: string;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      role="tab"
      aria-selected={active}
      className={`block rounded-md border p-4 text-sm transition ${
        active
          ? "border-brand-500 bg-brand-50 text-slate-800 shadow-sm"
          : muted
            ? "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700"
      }`}
    >
      <span className="block">
        <span className={`block font-semibold ${muted && !active ? "text-slate-600" : "text-slate-950"}`}>{label}</span>
        <span className="mt-2 block leading-6">{description}</span>
        <span className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${current ? "bg-emerald-50 text-emerald-700" : active ? "bg-white text-brand-700" : "bg-slate-100 text-slate-500"}`}>
            {status}
          </span>
          <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-white text-brand-700" : "bg-slate-100 text-slate-500"}`}>{meta}</span>
        </span>
      </span>
    </a>
  );
}

function InputField({
  defaultValue = "",
  label,
  name,
  type = "text"
}: {
  defaultValue?: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function nullableTextOrExisting(formData: FormData, name: string, existing: string | null | undefined) {
  return formData.has(name) ? nullableText(formData.get(name)) : existing || null;
}

function validateGoogleMeetingValues({
  clientId,
  meetUrl,
  validateClientId,
  validateMeetUrl
}: {
  clientId: string | null;
  meetUrl: string | null;
  validateClientId: boolean;
  validateMeetUrl: boolean;
}) {
  if (validateClientId && clientId && isUrl(clientId)) {
    return "Im Feld Google OAuth Client ID steht ein Link. Dort muss die Client-ID aus Google Cloud stehen, sie endet auf .apps.googleusercontent.com. Der Meet-Link gehört in das Feld Fester Google-Meet-Link.";
  }

  if (validateClientId && clientId && !clientId.endsWith(".apps.googleusercontent.com")) {
    return "Die Google OAuth Client ID muss auf .apps.googleusercontent.com enden. Bitte kopieren Sie die Client-ID aus Google Cloud, nicht den Meet-Link oder den Dateinamen.";
  }

  if (validateMeetUrl && meetUrl && meetUrl.endsWith(".apps.googleusercontent.com")) {
    return "Im Feld Fester Google-Meet-Link steht eine OAuth Client ID. Dort gehört ein Link wie https://meet.google.com/abc-defg-hij hinein.";
  }

  return null;
}

function validateZoomMeetingValues({
  accountId,
  clientId,
  meetingUrl,
  validateApi,
  validateLink
}: {
  accountId: string | null;
  clientId: string | null;
  meetingUrl: string | null;
  validateApi: boolean;
  validateLink: boolean;
}) {
  if (validateApi && accountId && isUrl(accountId)) {
    return "Im Feld Zoom Account ID steht ein Link. Dort gehört die Account ID aus der Zoom Server-to-Server-OAuth-App hinein. Der Zoom-Link gehört in das Feld Fester Zoom-Link.";
  }

  if (validateApi && clientId && isUrl(clientId)) {
    return "Im Feld Zoom Client ID steht ein Link. Dort gehört die Client ID aus der Zoom Server-to-Server-OAuth-App hinein. Der Zoom-Link gehört in das Feld Fester Zoom-Link.";
  }

  if (validateLink && meetingUrl && !isUrl(meetingUrl)) {
    return "Der feste Zoom-Link muss eine vollständige Webadresse sein, zum Beispiel https://zoom.us/j/...";
  }

  return null;
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeCalendarProvider(value: string | null | undefined): "apple" | "google" | "microsoft" {
  return value === "google" || value === "microsoft" ? value : "apple";
}

function normalizeMeetingMode(value: string | null | undefined): "fixed_link" | "api" {
  return value === "api" ? "api" : "fixed_link";
}

function getCalendarProviderLabel(provider: "apple" | "google" | "microsoft") {
  switch (provider) {
    case "google":
      return "Google Kalender";
    case "microsoft":
      return "Microsoft 365 / Outlook";
    case "apple":
    default:
      return "Apple CalDAV";
  }
}
