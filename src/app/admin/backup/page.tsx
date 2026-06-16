import { AdminNav } from "@/components/admin-nav";
import { BackupPanel } from "@/components/backup-panel";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminBackupPage() {
  await requireAdmin();

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Datensicherung</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Exportieren und importieren Sie die SMART-Booking-Konfiguration für Profile, Terminarten, Verfügbarkeit, Blockzeiten und Profil-Vorlagen.
      </p>
      <AdminNav />
      <BackupPanel />
    </section>
  );
}
