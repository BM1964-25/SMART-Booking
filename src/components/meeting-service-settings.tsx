"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Link2, PlugZap } from "lucide-react";
import { MeetingServiceIcon } from "@/components/meeting-service-icon";
import { PasswordInputField } from "@/components/password-input-field";
import type { MeetingLocation } from "@/lib/meeting-location";

type MeetingMode = "fixed_link" | "api";

type MeetingServiceSettingsProps = {
  activeCalendarProvider?: "apple" | "google" | "microsoft";
  googleClientId?: string;
  googleClientSecret?: string;
  googleConnectedEmail?: string | null;
  googleConnectHref?: string;
  googleMeetUrl?: string;
  googleMode?: MeetingMode;
  microsoftConnectedEmail?: string | null;
  teamsMode?: MeetingMode;
  teamsUrl?: string;
  zoomAccountId?: string;
  zoomClientId?: string;
  zoomClientSecret?: string;
  zoomMode?: MeetingMode;
  zoomUrl?: string;
};

export function MeetingServiceSettings({
  activeCalendarProvider = "apple",
  googleClientId = "",
  googleClientSecret = "",
  googleConnectedEmail = null,
  googleConnectHref = "/api/integrations/google/connect",
  googleMeetUrl = "",
  googleMode = "fixed_link",
  microsoftConnectedEmail = null,
  teamsMode = "fixed_link",
  teamsUrl = "",
  zoomAccountId = "",
  zoomClientId = "",
  zoomClientSecret = "",
  zoomMode = "fixed_link",
  zoomUrl = ""
}: MeetingServiceSettingsProps) {
  const teamsApiAvailable = activeCalendarProvider === "microsoft" && Boolean(microsoftConnectedEmail);

  return (
    <>
      <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-950">Meeting-Links flexibel nutzen</p>
            <p className="mt-1 max-w-4xl">
              Feste Links funktionieren mit jedem Kalenderanbieter und werden für alle zukünftigen Buchungen wiederverwendet. Automatische Links per API erzeugen pro
              Buchung einen eigenen Link. Google Meet per API benötigt Google Kalender als aktiven Anbieter, Microsoft Teams per API benötigt Microsoft 365 / Outlook als
              aktiven Anbieter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("smart-booking:open-help", { detail: { sectionId: "integrations" } }))}
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Hilfe öffnen
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <MeetingServiceCard
          apiDescription="Erzeugt pro Buchung automatisch einen eigenen Zoom-Link, wenn Account ID, Client ID und Client Secret vollständig hinterlegt und in Zoom aktiv sind."
          apiFields={
            <>
              <TextInput label="Zoom Account ID" name="zoom_account_id" defaultValue={zoomAccountId} hint="Aus der Zoom Server-to-Server-OAuth-App. Kein Meeting-Link." />
              <TextInput label="Zoom Client ID" name="zoom_client_id" defaultValue={zoomClientId} hint="Aus der Zoom Server-to-Server-OAuth-App. Kein Meeting-Link." />
              <PasswordInputField label="Zoom Client Secret" name="zoom_client_secret" defaultValue={zoomClientSecret} />
            </>
          }
          defaultMode={zoomMode}
          fixedDescription="Nutzt bei jeder Zoom-Buchung denselben dauerhaft hinterlegten Zoom-Link."
          fixedField={<TextInput label="Fester Zoom-Link" name="zoom_meeting_url" type="url" defaultValue={zoomUrl} hint="Beispiel: https://zoom.us/j/..." />}
          fixedFieldName="zoom_meeting_url"
          modeName="zoom_meeting_mode"
          service="zoom"
          title="Zoom"
          apiTestHref="/api/zoom/test"
          apiTestLabel="Zoom API prüfen"
        />
        <MeetingServiceCard
          apiDescription="Erzeugt pro Buchung automatisch einen eigenen Google-Meet-Link, wenn Google Kalender verbunden und als Buchungskalender aktiv ist."
          apiFields={
            <>
              <TextInput
                label="Google OAuth Client ID"
                name="google_client_id"
                defaultValue={googleClientId}
                hint="Aus Google Cloud. Muss auf .apps.googleusercontent.com enden."
              />
              <PasswordInputField label="Google OAuth Client Secret" name="google_client_secret" defaultValue={googleClientSecret} />
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                {googleConnectedEmail ? (
                  <p>
                    Verbunden mit <span className="font-semibold text-slate-900">{googleConnectedEmail}</span>. Nur neu verbinden, wenn das Google-Konto gewechselt oder
                    die Verbindung erneuert werden soll.
                  </p>
                ) : (
                  <p>Nach dem Speichern der OAuth-Daten kann Google verbunden werden.</p>
                )}
                <a
                  href={googleConnectHref}
                  className="mt-3 inline-flex rounded-md border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
                >
                  {googleConnectedEmail ? "Google neu verbinden" : "Google verbinden"}
                </a>
              </div>
            </>
          }
          defaultMode={googleMode}
          fixedDescription="Nutzt bei jeder Google-Meet-Buchung denselben dauerhaft hinterlegten Meet-Link."
          fixedField={<TextInput label="Fester Google-Meet-Link" name="google_meet_url" type="url" defaultValue={googleMeetUrl} hint="Beispiel: https://meet.google.com/abc-defg-hij" />}
          fixedFieldName="google_meet_url"
          apiConnectedMessage={googleConnectedEmail ? `Google ist mit ${googleConnectedEmail} verbunden.` : ""}
          modeName="google_meeting_mode"
          service="google_meet"
          title="Google Meet"
          apiTestLabel="Google Verbindung prüfen"
          apiUnavailableMessage="Bitte zuerst die OAuth-Daten speichern und Google über den Button verbinden."
        />
        <MeetingServiceCard
          apiDescription={
            teamsApiAvailable
              ? "Erzeugt pro Buchung automatisch einen eigenen Teams-Link über den verbundenen Microsoft-Kalender."
              : "Funktioniert, sobald Microsoft 365 / Outlook verbunden und als aktiver Kalenderanbieter gespeichert ist."
          }
          apiDisabled={!teamsApiAvailable}
          apiFields={
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {teamsApiAvailable ? (
                <p>
                  Microsoft ist mit <span className="font-semibold text-slate-900">{microsoftConnectedEmail}</span> verbunden. Teams-Links werden beim Eintragen in den
                  Microsoft-Kalender erzeugt.
                </p>
              ) : (
                <p>Verbinden Sie Microsoft 365 / Outlook und speichern Sie Microsoft als aktiven Kalenderanbieter.</p>
              )}
            </div>
          }
          apiConnectedMessage={teamsApiAvailable && microsoftConnectedEmail ? `Microsoft ist mit ${microsoftConnectedEmail} verbunden.` : ""}
          defaultMode={teamsMode}
          fixedDescription="Nutzt bei jeder Teams-Buchung denselben dauerhaft hinterlegten Teams-Link."
          fixedField={<TextInput label="Fester Microsoft-Teams-Link" name="teams_meeting_url" type="url" defaultValue={teamsUrl} />}
          fixedFieldName="teams_meeting_url"
          modeName="teams_meeting_mode"
          service="teams"
          title="Microsoft Teams"
          apiTestLabel="Microsoft Verbindung prüfen"
          apiUnavailableMessage="Teams per API funktioniert erst, wenn Microsoft 365 / Outlook verbunden und als aktiver Kalenderanbieter gespeichert ist."
        />
      </div>
    </>
  );
}

function MeetingServiceCard({
  apiDescription,
  apiDisabled = false,
  apiConnectedMessage,
  apiFields,
  apiTestHref,
  apiTestLabel = "API prüfen",
  apiUnavailableMessage,
  defaultMode,
  fixedDescription,
  fixedField,
  fixedFieldName,
  modeName,
  service,
  title
}: {
  apiDescription: string;
  apiDisabled?: boolean;
  apiConnectedMessage?: string;
  apiFields?: ReactNode;
  apiTestHref?: string;
  apiTestLabel?: string;
  apiUnavailableMessage?: string;
  defaultMode: MeetingMode;
  fixedDescription: string;
  fixedField: ReactNode;
  fixedFieldName: string;
  modeName: string;
  service: Extract<MeetingLocation, "zoom" | "google_meet" | "teams">;
  title: string;
}) {
  const [mode, setMode] = useState<MeetingMode>(apiDisabled ? "fixed_link" : defaultMode);
  const [testState, setTestState] = useState<"idle" | "pending" | "success" | "error">(apiConnectedMessage ? "success" : "idle");
  const [testMessage, setTestMessage] = useState<string>(apiConnectedMessage || "");
  const apiIsActive = mode === "api" && !apiDisabled;

  async function handleTest(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    const data = form ? new FormData(form) : new FormData();

    setTestState("pending");
    setTestMessage("");

    if (!apiIsActive) {
      const value = String(data.get(fixedFieldName) || "").trim();

      if (!value) {
        setTestState("error");
        setTestMessage("Bitte zuerst einen festen Link eintragen.");
        return;
      }

      try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("invalid protocol");
        }

        setTestState("success");
        setTestMessage("Der feste Link ist formal gültig.");
      } catch {
        setTestState("error");
        setTestMessage("Der feste Link ist keine gültige Webadresse.");
      }

      return;
    }

    if (apiConnectedMessage) {
      setTestState("success");
      setTestMessage(apiConnectedMessage);
      return;
    }

    if (!apiTestHref) {
      setTestState("error");
      setTestMessage(apiUnavailableMessage || (apiDisabled ? "Die API ist vorbereitet, aber noch nicht aktivierbar." : "Für diese API ist noch kein Prüftest hinterlegt."));
      return;
    }

    try {
      const response = await fetch(apiTestHref, { method: "GET" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Die Verbindung konnte nicht geprüft werden.");
      }

      setTestState("success");
      setTestMessage("Die API-Verbindung wurde erfolgreich geprüft.");
    } catch (error) {
      setTestState("error");
      setTestMessage(error instanceof Error ? error.message : "Die Verbindung konnte nicht geprüft werden.");
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-950">
          <MeetingServiceIcon value={service} className="h-7 w-7" />
          {title}
        </h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${apiIsActive ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
          {apiIsActive ? "API aktiv" : "Fester Link"}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <ModeOption
          checked={mode === "fixed_link"}
          description={fixedDescription}
          icon="link"
          label="Fester Link"
          name={modeName}
          onChange={() => setMode("fixed_link")}
          value="fixed_link"
        />
        <ModeOption
          checked={apiIsActive}
          description={apiDescription}
          disabled={apiDisabled}
          icon="api"
          label={apiDisabled ? "API mit Microsoft" : "API"}
          name={modeName}
          onChange={() => setMode("api")}
          value="api"
        />
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">{apiIsActive ? "Aktive API-Daten" : "Aktiver fester Link"}</p>
        <div key={`${service}-${mode}`} className="mt-3 grid gap-3">
          {apiIsActive ? apiFields : fixedField}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testState === "pending"}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400"
          >
            {testState === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <PlugZap className="h-4 w-4" aria-hidden="true" />}
            {apiIsActive ? apiTestLabel : "Link prüfen"}
          </button>
          {testMessage ? (
            <span className={`inline-flex items-start gap-2 text-xs leading-5 ${testState === "error" ? "text-red-700" : "text-emerald-700"}`}>
              {testState === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              {testMessage}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ModeOption({
  checked,
  description,
  disabled = false,
  icon,
  label,
  name,
  onChange,
  value
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: "api" | "link";
  label: string;
  name: string;
  onChange: () => void;
  value: MeetingMode;
}) {
  const Icon = icon === "api" ? PlugZap : Link2;

  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-md border p-3 transition ${
        disabled ? "cursor-not-allowed border-slate-200 bg-white text-slate-400" : checked ? "border-brand-400 bg-brand-50 text-slate-800" : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} className="mt-1 h-4 w-4 accent-brand-500" />
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${checked && !disabled ? "text-brand-600" : "text-slate-400"}`} aria-hidden="true" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5">{description}</span>
      </span>
    </label>
  );
}

function TextInput({ defaultValue = "", hint, label, name, type = "text" }: { defaultValue?: string; hint?: string; label: string; name: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}
