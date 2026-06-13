"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminPasswordReset() {
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "success" | "error">("loading");
  const [message, setMessage] = useState("Reset-Link wird geprüft.");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    async function prepareSession() {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setStatus("error");
          setMessage("Der Reset-Link konnte nicht bestätigt werden. Bitte senden Sie eine neue Reset-Mail.");
          return;
        }

        window.history.replaceState({}, "", "/admin/reset-password");
        setStatus("ready");
        setMessage("Geben Sie jetzt Ihr neues Passwort ein und speichern Sie es.");
        return;
      }

      if (!code) {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          setStatus("ready");
          setMessage("Geben Sie jetzt Ihr neues Passwort ein und speichern Sie es.");
          return;
        }

        setStatus("error");
        setMessage("Der Reset-Link ist unvollständig oder abgelaufen. Bitte senden Sie eine neue Reset-Mail.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setStatus("error");
        setMessage("Der Reset-Link konnte nicht bestätigt werden. Bitte senden Sie eine neue Reset-Mail.");
        return;
      }

      window.history.replaceState({}, "", "/admin/reset-password");
      setStatus("ready");
      setMessage("Geben Sie jetzt Ihr neues Passwort ein und speichern Sie es.");
    }

    prepareSession();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmation) {
      setStatus("error");
      setMessage("Die beiden Passwörter stimmen nicht überein.");
      return;
    }

    setStatus("saving");
    setMessage("Passwort wird gespeichert.");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage("Das Passwort konnte nicht gespeichert werden. Bitte senden Sie eine neue Reset-Mail.");
      return;
    }

    setStatus("success");
    setMessage("Das Passwort wurde gespeichert. Sie werden zum Login weitergeleitet.");
    window.setTimeout(() => {
      window.location.assign("/admin/login?reset=updated");
    }, 1200);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Neues Passwort setzen</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

      {status === "success" ? (
        <a href="/admin/login?reset=updated" className="mt-6 inline-flex rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">
          Zum Admin Login
        </a>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Neues Passwort</span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              disabled={status === "loading" || status === "saving"}
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Neues Passwort wiederholen</span>
            <input
              name="confirmation"
              type="password"
              minLength={8}
              required
              disabled={status === "loading" || status === "saving"}
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100"
            />
          </label>
          <button
            className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
            type="submit"
            disabled={status === "loading" || status === "saving"}
          >
            {status === "saving" ? "Passwort wird gespeichert" : "Neues Passwort speichern"}
          </button>
        </form>
      )}
    </div>
  );
}
