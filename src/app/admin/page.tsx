import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const [{ count: bookings }, { count: types }] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("booking_types").select("*", { count: "exact", head: true })
  ]);

  async function logout() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-slate-950">Admin Dashboard</h1>
        <form action={logout}>
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800" type="submit">
            Abmelden
          </button>
        </form>
      </div>
      <AdminNav />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Buchungen" value={bookings || 0} />
        <Stat label="Terminarten" value={types || 0} />
        <Stat label="Kalender" value="Apple CalDAV" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/bookings" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Buchungen ansehen
        </Link>
        <Link href="/admin/settings" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
          Einstellungen
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
