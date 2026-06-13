"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminLoginFormProps = {
  email: string;
  isConfigured: boolean;
  loginAction: (formData: FormData) => Promise<void>;
  resetAction: (formData: FormData) => Promise<void>;
};

const STORAGE_KEY = "smart-booking-admin-email";

export function AdminLoginForm({ email, isConfigured, loginAction, resetAction }: AdminLoginFormProps) {
  const [rememberEmail, setRememberEmail] = useState(true);
  const [emailValue, setEmailValue] = useState(email);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(STORAGE_KEY);

    if (!email && savedEmail) {
      setEmailValue(savedEmail);
    }
  }, [email]);

  function rememberCurrentEmail() {
    if (rememberEmail && emailValue) {
      window.localStorage.setItem(STORAGE_KEY, emailValue);
    }

    if (!rememberEmail) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <>
      <form action={loginAction} onSubmit={rememberCurrentEmail} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">E-Mail</span>
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
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={(event) => setRememberEmail(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          E-Mail-Adresse auf diesem Gerät merken
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Das Passwort wird nicht von SMART Booking gespeichert. Ihr Browser oder Passwortmanager kann es sicher speichern.
        </p>
        <button
          className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
          type="submit"
          disabled={!isConfigured}
        >
          Einloggen
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-950">Passwort zurücksetzen</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Wenn Sie kein Passwort kennen, senden wir eine Reset-Mail an den Supabase-Admin-Benutzer.
        </p>
        <form action={resetAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="resetEmail"
            type="email"
            value={emailValue || "bernhard.metzger@me.com"}
            onChange={(event) => setEmailValue(event.target.value)}
            required
            autoComplete="username email"
            className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
            type="submit"
            disabled={!isConfigured}
          >
            Reset-Mail senden
          </button>
        </form>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Nach dem Klick auf den Mail-Link kommen Sie zur Seite <Link className="text-brand-600" href="/admin/reset-password">Neues Passwort setzen</Link>.
        </p>
      </div>
    </>
  );
}
