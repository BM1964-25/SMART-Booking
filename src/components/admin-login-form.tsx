"use client";

import Link from "next/link";
import { useState } from "react";

type AdminLoginFormProps = {
  isConfigured: boolean;
  loginAction: (formData: FormData) => Promise<void>;
  resetAction: (formData: FormData) => Promise<void>;
};

export function AdminLoginForm({ isConfigured, loginAction, resetAction }: AdminLoginFormProps) {
  const [emailValue, setEmailValue] = useState("");

  return (
    <>
      <form action={loginAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">E-Mail-Adresse</span>
          <input
            name="email"
            type="email"
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
            required
            autoComplete="username email"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Passwort</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Das Passwort wird nicht von SMART Booking gespeichert. Ihr Browser oder Passwortmanager kann es sicher speichern.
        </p>
        <button
          className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
          type="submit"
          disabled={!isConfigured}
        >
          Anmelden
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-950">Passwort zurücksetzen</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Geben Sie die E-Mail-Adresse Ihres Administratorkontos ein. Sie erhalten anschließend einen Link zum Zurücksetzen des Passworts.
        </p>
        <form action={resetAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="resetEmail"
            type="email"
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
            required
            autoComplete="username email"
            placeholder="E-Mail-Adresse"
            className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
            type="submit"
            disabled={!isConfigured}
          >
            Link senden
          </button>
        </form>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Nach dem Klick auf den Mail-Link kommen Sie zur Seite <Link className="text-brand-600" href="/admin/reset-password">Neues Passwort setzen</Link>.
        </p>
      </div>
    </>
  );
}
