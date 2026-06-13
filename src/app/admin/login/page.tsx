import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";

    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/admin/login?error=invalid&email=${encodeURIComponent(email)}`);
    }

    redirect("/admin");
  }

  async function sendPasswordReset(formData: FormData) {
    "use server";

    const email = String(formData.get("resetEmail") || formData.get("email") || "").trim();

    if (!email) {
      redirect("/admin/login?error=missing-email");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/admin/reset-password`
    });

    if (error) {
      redirect(`/admin/login?error=reset-failed&email=${encodeURIComponent(email)}`);
    }

    redirect(`/admin/login?reset=sent&email=${encodeURIComponent(email)}`);
  }

  const isConfigured = hasSupabaseConfig();
  const email = "email" in params ? String(params.email || "") : "";

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Admin Login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Melden Sie sich mit dem Benutzer an, den Sie in Supabase unter Authentication angelegt haben. Die User ID ist kein Passwort.
        </p>

        {!isConfigured ? (
          <Notice tone="warning">Supabase ist noch nicht verbunden. Fehlend: {missingSupabaseKeys().join(", ")}.</Notice>
        ) : null}
        {params.error === "invalid" ? (
          <Notice tone="error">
            E-Mail oder Passwort ist nicht korrekt. Wenn Sie das Passwort nicht kennen, nutzen Sie unten „Passwort zurücksetzen“.
          </Notice>
        ) : null}
        {params.error === "missing-email" ? <Notice tone="error">Bitte geben Sie Ihre Admin-E-Mail-Adresse ein.</Notice> : null}
        {params.error === "reset-failed" ? (
          <Notice tone="error">Die Reset-Mail konnte nicht gesendet werden. Bitte prüfen Sie, ob die E-Mail in Supabase Auth existiert.</Notice>
        ) : null}
        {params.reset === "sent" ? (
          <Notice tone="success">
            Die Reset-Mail wurde gesendet. Öffnen Sie den Link in der Mail und setzen Sie dort ein neues Passwort.
          </Notice>
        ) : null}
        {params.reset === "updated" ? (
          <Notice tone="success">
            Das neue Passwort wurde gespeichert. Melden Sie sich jetzt mit Ihrer E-Mail-Adresse und dem neuen Passwort an.
          </Notice>
        ) : null}

        <AdminLoginForm email={email} isConfigured={isConfigured} loginAction={login} resetAction={sendPasswordReset} />
      </div>
    </section>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "warning" | "error" | "success" }) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900"
  };

  return <div className={`mt-5 rounded-md border p-3 text-sm leading-6 ${styles[tone]}`}>{children}</div>;
}
