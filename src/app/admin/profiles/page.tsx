import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { defaultBookingProfile } from "@/lib/profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProfilesPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { data: profiles } = await supabase.from("booking_profiles").select("*").order("created_at").returns<BookingProfile[]>();
  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  async function saveProfile(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const id = String(formData.get("id") || "");
    const payload = {
      slug: slugify(String(formData.get("slug") || "")),
      name: String(formData.get("name") || "").trim(),
      headline: String(formData.get("headline") || "").trim(),
      subheadline: String(formData.get("subheadline") || "").trim(),
      contact_name: nullableString(formData.get("contact_name")),
      contact_email: nullableString(formData.get("contact_email")),
      contact_phone: nullableString(formData.get("contact_phone")),
      linkedin_url: nullableString(formData.get("linkedin_url")),
      website_url: nullableString(formData.get("website_url")),
      secondary_website_url: nullableString(formData.get("secondary_website_url")),
      portrait_url: nullableString(formData.get("portrait_url")),
      primary_color: String(formData.get("primary_color") || "#527DF6").trim(),
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString()
    };

    if (!payload.slug || !payload.name || !payload.headline || !payload.subheadline) {
      return;
    }

    if (id) {
      await supabase.from("booking_profiles").update(payload).eq("id", id);
    } else {
      await supabase.from("booking_profiles").insert(payload);
    }

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
    revalidatePath("/book");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Profile</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Verwalten Sie Mandantenprofile für unterschiedliche Websites. Jedes Profil erhält einen eigenen öffentlichen Buchungslink mit eigener Headline,
        Kontaktperson und Kontaktlinks.
      </p>
      <AdminNav />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {(profiles || []).map((profile) => (
          <ProfileForm key={profile.id} action={saveProfile} profile={profile} siteUrl={siteUrl} />
        ))}
      </div>

      <details className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Neues Profil anlegen</summary>
        <div className="mt-4">
          <ProfileForm action={saveProfile} siteUrl={siteUrl} />
        </div>
      </details>
    </section>
  );
}

function ProfileForm({
  action,
  profile,
  siteUrl
}: {
  action: (formData: FormData) => Promise<void>;
  profile?: BookingProfile;
  siteUrl: string;
}) {
  const slug = profile?.slug || "";
  const publicPath = slug === defaultBookingProfile.slug || !slug ? "/book" : `/book/profile/${slug}`;
  const publicUrl = `${siteUrl}${publicPath}`;

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" value={profile?.id || ""} />
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">{profile?.name || "Neues Profil"}</p>
          <Link href={publicPath} className="mt-1 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
            {publicUrl}
          </Link>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={profile?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Aktiv
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Profilname" name="name" defaultValue={profile?.name || ""} required />
        <Field label="Slug für Link" name="slug" defaultValue={profile?.slug || ""} required />
        <div className="sm:col-span-2">
          <Field label="Headline" name="headline" defaultValue={profile?.headline || "Termin buchen"} required />
        </div>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Subheadline</span>
          <textarea
            name="subheadline"
            rows={3}
            defaultValue={profile?.subheadline || "Wählen Sie einen passenden Termin."}
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <Field label="Kontaktname" name="contact_name" defaultValue={profile?.contact_name || ""} />
        <Field label="Kontakt-E-Mail" name="contact_email" type="email" defaultValue={profile?.contact_email || ""} />
        <Field label="Telefon" name="contact_phone" defaultValue={profile?.contact_phone || ""} />
        <Field label="LinkedIn URL" name="linkedin_url" type="url" defaultValue={profile?.linkedin_url || ""} />
        <Field label="Website URL" name="website_url" type="url" defaultValue={profile?.website_url || ""} />
        <Field label="Weitere Website URL" name="secondary_website_url" type="url" defaultValue={profile?.secondary_website_url || ""} />
        <Field label="Portrait-Pfad" name="portrait_url" defaultValue={profile?.portrait_url || ""} />
        <Field label="Primärfarbe" name="primary_color" defaultValue={profile?.primary_color || "#527DF6"} />
      </div>

      <div className="mt-4 flex justify-end">
        <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white" type="submit">
          {profile ? "Profil speichern" : "Profil anlegen"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function nullableString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
