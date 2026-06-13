import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hasSupabaseConfig, missingSupabaseKeys } from "@/lib/config";
import { seedBookingTypes } from "@/lib/seed-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terminart auswählen"
};

export default async function BookPage() {
  let types: BookingType[] = seedBookingTypes;
  const isConfigured = hasSupabaseConfig();

  if (isConfigured) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from("booking_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .returns<BookingType[]>();
    types = data || [];
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Terminart auswählen</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Wählen Sie das Format, das am besten zu Ihrem Anliegen passt.</p>
      {!isConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Die Oberfläche läuft gerade im Setup-Modus mit Startdaten. Für echte Verfügbarkeiten und Buchungen fehlen noch:{" "}
          <span className="font-semibold">{missingSupabaseKeys().join(", ")}</span>.
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {types.map((type) => (
          <Link key={type.id} href={`/book/${type.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{type.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
                <p className="mt-4 text-sm font-medium text-slate-700">{type.duration_minutes} Minuten</p>
              </div>
              <ArrowRight className="h-5 w-5 text-brand-600" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
