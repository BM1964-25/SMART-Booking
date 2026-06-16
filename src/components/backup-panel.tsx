"use client";

import { ChangeEvent, useId, useMemo, useState } from "react";
import { Check, Download, FileJson, Upload } from "lucide-react";

type BackupSummary = {
  profiles: number;
  bookingTypes: number;
  bookingTypeProfiles: number;
  availabilityRules: number;
  blockedTimes: number;
  profileTemplates: number;
  calendarConnections: number;
};

type ImportState = "idle" | "checking" | "ready" | "importing" | "success" | "error";

export function BackupPanel() {
  const fileInputId = useId();
  const [backup, setBackup] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<ImportState>("idle");
  const canImport = state === "ready" && Boolean(backup);
  const summaryRows = useMemo(
    () =>
      summary
        ? [
            ["Profile", summary.profiles],
            ["Terminarten", summary.bookingTypes],
            ["Profil-Zuordnungen", summary.bookingTypeProfiles],
            ["Verfügbarkeitsregeln", summary.availabilityRules],
            ["Blockierte Zeiten", summary.blockedTimes],
            ["Profil-Vorlagen", summary.profileTemplates],
            ["Kalender-Verbindungen", summary.calendarConnections]
          ]
        : [],
    [summary]
  );

  async function readBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setBackup(null);
    setSummary(null);
    setMessage(null);
    setState("idle");
    setFileName(file?.name || "");

    if (!file) {
      return;
    }

    setState("checking");

    try {
      const parsed = JSON.parse(await file.text());
      const response = await fetch("/api/admin/backup/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ backup: parsed, dryRun: true })
      });
      const result = (await response.json()) as { summary?: BackupSummary; warning?: string; error?: string };

      if (!response.ok || !result.summary) {
        throw new Error(result.error || "Die Sicherung konnte nicht geprüft werden.");
      }

      setBackup(parsed);
      setSummary(result.summary);
      setMessage(result.warning || "Sicherung geprüft.");
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Die Datei konnte nicht gelesen werden.");
      setState("error");
    }
  }

  async function importBackup() {
    if (!canImport) {
      return;
    }

    setState("importing");
    setMessage("Import läuft. Bitte warten.");

    try {
      const response = await fetch("/api/admin/backup/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ backup, dryRun: false })
      });
      const result = (await response.json()) as { summary?: BackupSummary; imported?: boolean; error?: string; details?: string };

      if (!response.ok || !result.imported) {
        throw new Error(result.details || result.error || "Import konnte nicht abgeschlossen werden.");
      }

      setSummary(result.summary || summary);
      setMessage("Import abgeschlossen. Bitte laden Sie die Adminseiten neu, wenn Sie geänderte Werte nicht sofort sehen.");
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import fehlgeschlagen.");
      setState("error");
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Export und Import</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Sichern Sie die SMART-Booking-Konfiguration als Datei und stellen Sie sie bei Bedarf wieder her. Buchungen bleiben dabei bewusst außen vor, damit echte Kundentermine nicht versehentlich verändert werden.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
          <div>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Download className="h-4 w-4 text-brand-600" />
              Export
            </span>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Erstellt eine vollständige JSON-Sicherung der aktuellen Konfiguration. Enthalten sind Profile, Terminarten, Profil-Zuordnungen, Verfügbarkeiten, Blockzeiten, Kalender-Verbindungen und Profil-Vorlagen.
            </p>
            <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
              Speicherort: Die Datei wird vom Browser heruntergeladen, normalerweise in den Downloads-Ordner Ihres Computers.
            </p>
          </div>
          <a
            href="/api/admin/backup/export"
            className="mt-4 inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
          >
            <Download className="h-4 w-4" />
            Export erstellen
          </a>
        </div>

        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileJson className="h-4 w-4 text-brand-600" />
            Import
          </span>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Lädt eine vorhandene SMART-Booking-JSON-Sicherung von Ihrem Computer. Vor dem Import wird geprüft, welche Konfigurationsbereiche in der Datei enthalten sind.
          </p>
          <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
            Quelle: Wählen Sie eine zuvor exportierte JSON-Datei aus, zum Beispiel aus Ihrem Downloads-Ordner oder einem Sicherungsordner.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input id={fileInputId} type="file" accept="application/json,.json" onChange={readBackupFile} className="sr-only" />
            <label
              htmlFor={fileInputId}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
            >
              <Upload className="h-4 w-4" />
              Datei auswählen
            </label>
            {fileName ? <span className="text-sm font-medium text-slate-600">{fileName}</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Importprüfung</h3>
          {summary ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {summaryRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-500">Wählen Sie zuerst eine SMART-Booking-JSON-Sicherung aus. Danach sehen Sie hier, welche Datenbereiche übernommen würden.</p>
          )}
          {message ? (
            <p className={`mt-3 rounded-md px-3 py-2 text-sm leading-6 ${state === "error" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}>
              {message}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!canImport}
            onClick={importBackup}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {state === "success" ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {state === "importing" ? "Import läuft" : state === "success" ? "Importiert" : "Import ausführen"}
          </button>
      </div>
    </section>
  );
}
