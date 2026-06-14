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
    const removePortrait = formData.get("remove_portrait") === "on";
    const portraitFile = formData.get("portrait_file");
    const uploadedPortraitUrl = await uploadProfilePortrait(portraitFile, id || crypto.randomUUID(), supabase);
    const payload = {
      slug: slugify(String(formData.get("slug") || "")),
      name: String(formData.get("name") || "").trim(),
      headline: String(formData.get("headline") || "").trim(),
      subheadline: String(formData.get("subheadline") || "").trim(),
      contact_name: nullableString(formData.get("contact_name")),
      contact_email: nullableString(formData.get("contact_email")),
      contact_phone: nullableString(formData.get("contact_phone")),
      linkedin_url: nullableString(formData.get("linkedin_url")),
      xing_url: nullableString(formData.get("xing_url")),
      instagram_url: nullableString(formData.get("instagram_url")),
      facebook_url: nullableString(formData.get("facebook_url")),
      youtube_url: nullableString(formData.get("youtube_url")),
      website_url: nullableString(formData.get("website_url")),
      secondary_website_url: null,
      portrait_url: removePortrait ? null : uploadedPortraitUrl || nullableString(formData.get("portrait_url")),
      primary_color: normalizeColor(String(formData.get("primary_color") || "#527DF6")),
      show_portrait: formData.get("show_portrait") === "on",
      show_subheadline: formData.get("show_subheadline") === "on",
      show_contact_links: formData.get("show_contact_links") === "on",
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

  async function duplicateProfile(formData: FormData) {
    "use server";

    await requireAdmin();
    const profileId = String(formData.get("profileId") || "");

    if (!profileId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { data: sourceProfile } = await supabase.from("booking_profiles").select("*").eq("id", profileId).single<BookingProfile>();

    if (!sourceProfile) {
      return;
    }

    const nextSlug = await buildUniqueProfileSlug(sourceProfile.slug, supabase);
    await supabase.from("booking_profiles").insert({
      slug: nextSlug,
      name: `${sourceProfile.name} Kopie`,
      headline: sourceProfile.headline,
      subheadline: sourceProfile.subheadline,
      contact_name: sourceProfile.contact_name,
      contact_email: sourceProfile.contact_email,
      contact_phone: sourceProfile.contact_phone,
      linkedin_url: sourceProfile.linkedin_url,
      xing_url: sourceProfile.xing_url,
      instagram_url: sourceProfile.instagram_url,
      facebook_url: sourceProfile.facebook_url,
      youtube_url: sourceProfile.youtube_url,
      website_url: sourceProfile.website_url,
      secondary_website_url: sourceProfile.secondary_website_url,
      portrait_url: sourceProfile.portrait_url,
      primary_color: sourceProfile.primary_color,
      show_portrait: sourceProfile.show_portrait,
      show_subheadline: sourceProfile.show_subheadline,
      show_contact_links: sourceProfile.show_contact_links,
      is_active: false
    });

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
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
          <ProfileForm key={profile.id} action={saveProfile} duplicateAction={duplicateProfile} profile={profile} siteUrl={siteUrl} />
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
  duplicateAction,
  profile,
  siteUrl
}: {
  action: (formData: FormData) => Promise<void>;
  duplicateAction?: (formData: FormData) => Promise<void>;
  profile?: BookingProfile;
  siteUrl: string;
}) {
  const slug = profile?.slug || "";
  const publicPath = slug === defaultBookingProfile.slug || !slug ? "/book" : `/book/profile/${slug}`;
  const publicUrl = `${siteUrl}${publicPath}`;

  return (
    <form action={action} encType="multipart/form-data" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" value={profile?.id || ""} />
      {profile ? <input type="hidden" name="profileId" value={profile.id} /> : null}
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
        <Field label="Xing URL" name="xing_url" type="url" defaultValue={profile?.xing_url || ""} />
        <Field label="Instagram URL" name="instagram_url" type="url" defaultValue={profile?.instagram_url || ""} />
        <Field label="Facebook URL" name="facebook_url" type="url" defaultValue={profile?.facebook_url || ""} />
        <Field label="YouTube URL" name="youtube_url" type="url" defaultValue={profile?.youtube_url || ""} />
        <Field label="Website URL" name="website_url" type="url" defaultValue={profile?.website_url || ""} />
        <input type="hidden" name="portrait_url" value={profile?.portrait_url || ""} />
        <div className="sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Profilbild</span>
          <div className="mt-2 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr] sm:items-center">
            {profile?.portrait_url ? (
              <img src={profile.portrait_url} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-400 ring-1 ring-slate-200">Kein Bild</div>
            )}
            <div className="space-y-2">
              <input
                name="portrait_file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
              />
              {profile?.portrait_url ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input name="remove_portrait" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                  Bild entfernen
                </label>
              ) : null}
            </div>
          </div>
        </div>
        <ColorField label="Primärfarbe" name="primary_color" defaultValue={profile?.primary_color || "#527DF6"} />
        <fieldset className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">Auf öffentlicher Buchungsseite anzeigen</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Toggle label="Profilbild" name="show_portrait" defaultChecked={profile?.show_portrait ?? true} />
            <Toggle label="Subheadline" name="show_subheadline" defaultChecked={profile?.show_subheadline ?? true} />
            <Toggle label="Kontakticons" name="show_contact_links" defaultChecked={profile?.show_contact_links ?? true} />
          </div>
        </fieldset>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {profile && duplicateAction ? (
          <button
            formAction={duplicateAction}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
            type="submit"
          >
            Profil duplizieren
          </button>
        ) : (
          <span />
        )}
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

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2">
        <input name={name} type="color" defaultValue={normalizeColor(defaultValue)} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" />
        <span className="text-sm text-slate-500">Akzentfarbe für Linien, Ziffern und Buchungsbuttons.</span>
      </div>
    </label>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
      {label}
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

function normalizeColor(value: string) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#527DF6";
}

async function uploadProfilePortrait(fileValue: FormDataEntryValue | null, profileId: string, supabase: ReturnType<typeof createSupabaseAdmin>) {
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return null;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(fileValue.type) || fileValue.size > 3 * 1024 * 1024) {
    return null;
  }

  const extension = fileValue.type === "image/png" ? "png" : fileValue.type === "image/webp" ? "webp" : "jpg";
  const path = `${profileId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("booking-profile-images").upload(path, fileValue, {
    contentType: fileValue.type,
    upsert: true
  });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("booking-profile-images").getPublicUrl(path);
  return data.publicUrl;
}

async function buildUniqueProfileSlug(baseSlug: string, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const base = `${baseSlug}-kopie`;

  for (let index = 1; index <= 50; index += 1) {
    const candidate = index === 1 ? base : `${base}-${index}`;
    const { data } = await supabase.from("booking_profiles").select("id").eq("slug", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}
