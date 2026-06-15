import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { ComponentType } from "react";
import { Globe2, Mail, Phone, UserRound } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { FacebookIcon, InstagramIcon, LinkedInIcon, SpotifyIcon, XIcon, XingIcon, YouTubeIcon } from "@/components/brand-icons";
import { ColorPalettePresets } from "@/components/color-palette-presets";
import { EmbedCodeOptions } from "@/components/embed-code-options";
import { ProfileImageEditor } from "@/components/profile-image-editor";
import { ProfileTabs } from "@/components/profile-tabs";
import { ProfileTemplateControls } from "@/components/profile-template-controls";
import { requireAdmin } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { defaultBookingProfile } from "@/lib/profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile, BookingProfileTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProfilesPage() {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { data: profiles } = await supabase.from("booking_profiles").select("*").order("created_at").returns<BookingProfile[]>();
  const { data: profileTemplates } = await supabase
    .from("booking_profile_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BookingProfileTemplate[]>();
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
      x_url: nullableString(formData.get("x_url")),
      instagram_url: nullableString(formData.get("instagram_url")),
      facebook_url: nullableString(formData.get("facebook_url")),
      youtube_url: nullableString(formData.get("youtube_url")),
      spotify_url: nullableString(formData.get("spotify_url")),
      website_url: nullableString(formData.get("website_url")),
      secondary_website_url: null,
      portrait_url: removePortrait ? null : uploadedPortraitUrl || nullableString(formData.get("portrait_url")),
      primary_color: normalizeColor(String(formData.get("primary_color") || "#527DF6")),
      profile_card_bg_color: normalizeColor(String(formData.get("profile_card_bg_color") || "#F8FAFC"), "#F8FAFC"),
      booking_card_bg_color: normalizeColor(String(formData.get("booking_card_bg_color") || "#FFFFFF"), "#FFFFFF"),
      portrait_position_x: clampNumber(formData.get("portrait_position_x"), 0, 100, 50),
      portrait_position_y: clampNumber(formData.get("portrait_position_y"), 0, 100, 35),
      portrait_zoom: clampNumber(formData.get("portrait_zoom"), 1, 1.8, 1),
      show_portrait: formData.get("show_portrait") === "on",
      show_subheadline: formData.get("show_subheadline") === "on",
      show_contact_links: true,
      show_contact_name: formData.get("show_contact_name") === "on",
      show_contact_email: formData.get("show_contact_email") === "on",
      show_contact_phone: formData.get("show_contact_phone") === "on",
      show_linkedin: formData.get("show_linkedin") === "on",
      show_xing: formData.get("show_xing") === "on",
      show_x: formData.get("show_x") === "on",
      show_instagram: formData.get("show_instagram") === "on",
      show_facebook: formData.get("show_facebook") === "on",
      show_youtube: formData.get("show_youtube") === "on",
      show_spotify: formData.get("show_spotify") === "on",
      show_website: formData.get("show_website") === "on",
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
      x_url: sourceProfile.x_url,
      instagram_url: sourceProfile.instagram_url,
      facebook_url: sourceProfile.facebook_url,
      youtube_url: sourceProfile.youtube_url,
      spotify_url: sourceProfile.spotify_url,
      website_url: sourceProfile.website_url,
      secondary_website_url: sourceProfile.secondary_website_url,
      portrait_url: sourceProfile.portrait_url,
      primary_color: sourceProfile.primary_color,
      profile_card_bg_color: sourceProfile.profile_card_bg_color,
      booking_card_bg_color: sourceProfile.booking_card_bg_color,
      portrait_position_x: sourceProfile.portrait_position_x,
      portrait_position_y: sourceProfile.portrait_position_y,
      portrait_zoom: sourceProfile.portrait_zoom,
      show_portrait: sourceProfile.show_portrait,
      show_subheadline: sourceProfile.show_subheadline,
      show_contact_links: true,
      show_contact_name: sourceProfile.show_contact_name,
      show_contact_email: sourceProfile.show_contact_email,
      show_contact_phone: sourceProfile.show_contact_phone,
      show_linkedin: sourceProfile.show_linkedin,
      show_xing: sourceProfile.show_xing,
      show_x: sourceProfile.show_x,
      show_instagram: sourceProfile.show_instagram,
      show_facebook: sourceProfile.show_facebook,
      show_youtube: sourceProfile.show_youtube,
      show_spotify: sourceProfile.show_spotify,
      show_website: sourceProfile.show_website,
      is_active: false
    });

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
  }

  async function saveProfileTemplate(formData: FormData) {
    "use server";

    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const profileName = String(formData.get("name") || "").trim() || "Profil";
    const templateData = buildProfileTemplateData(formData);

    await supabase.from("booking_profile_templates").insert({
      name: `${profileName} Standardvorlage`,
      template_data: templateData
    });

    revalidatePath("/admin/profiles");
  }

  async function deleteProfileTemplate(formData: FormData) {
    "use server";

    await requireAdmin();
    const templateId = String(formData.get("template_id") || "");

    if (!templateId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    await supabase.from("booking_profile_templates").delete().eq("id", templateId);

    revalidatePath("/admin/profiles");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Profile</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Verwalten Sie Mandantenprofile für unterschiedliche Websites. Jedes Profil erhält einen eigenen öffentlichen Buchungslink mit eigener Headline,
        Kontaktperson und Kontaktlinks.
      </p>
      <AdminNav />

      <ProfileTabs
        profiles={[
          ...(profiles || []).map((profile) => ({ id: profile.id, name: profile.name, slug: profile.slug, isActive: profile.is_active })),
          { id: "new-profile", name: "Neues Profil anlegen", slug: "", isCreate: true }
        ]}
      >
        {(profiles || []).map((profile) => (
          <ProfileForm
            key={profile.id}
            action={saveProfile}
            duplicateAction={duplicateProfile}
            saveTemplateAction={saveProfileTemplate}
            deleteTemplateAction={deleteProfileTemplate}
            profile={profile}
            savedTemplates={profileTemplates || []}
            siteUrl={siteUrl}
          />
        ))}
        <ProfileForm
          action={saveProfile}
          saveTemplateAction={saveProfileTemplate}
          deleteTemplateAction={deleteProfileTemplate}
          savedTemplates={profileTemplates || []}
          siteUrl={siteUrl}
        />
      </ProfileTabs>
    </section>
  );
}

function ProfileForm({
  action,
  duplicateAction,
  saveTemplateAction,
  deleteTemplateAction,
  profile,
  savedTemplates,
  siteUrl
}: {
  action: (formData: FormData) => Promise<void>;
  duplicateAction?: (formData: FormData) => Promise<void>;
  saveTemplateAction: (formData: FormData) => Promise<void>;
  deleteTemplateAction: (formData: FormData) => Promise<void>;
  profile?: BookingProfile;
  savedTemplates: BookingProfileTemplate[];
  siteUrl: string;
}) {
  const slug = profile?.slug || "";
  const publicPath = slug === defaultBookingProfile.slug || !slug ? "/book" : `/book/profile/${slug}`;
  const publicUrl = `${siteUrl}${publicPath}`;

  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
      <EmbedCodeOptions publicUrl={publicUrl} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileTemplateControls savedTemplates={savedTemplates} saveAction={saveTemplateAction} deleteAction={deleteTemplateAction} />
        <Field label="Profilname" name="name" defaultValue={profile?.name || ""} required />
        <Field label="Slug für Link" name="slug" defaultValue={profile?.slug || ""} required />
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Headline" name="headline" defaultValue={profile?.headline || "Termin buchen"} required />
        </div>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
            Subheadline
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <input name="show_subheadline" type="checkbox" defaultChecked={profile?.show_subheadline ?? true} className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600" />
              Anzeigen
            </span>
          </span>
          <textarea
            name="subheadline"
            rows={3}
            defaultValue={profile?.subheadline || "Wählen Sie einen passenden Termin."}
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">Kontaktdaten und Links</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <VisibleField label="Kontaktname" icon={UserRound} name="contact_name" visibilityName="show_contact_name" defaultValue={profile?.contact_name || ""} defaultChecked={profile?.show_contact_name ?? true} />
            <VisibleField label="Kontakt-E-Mail" icon={Mail} name="contact_email" visibilityName="show_contact_email" type="email" defaultValue={profile?.contact_email || ""} defaultChecked={profile?.show_contact_email ?? true} />
            <VisibleField label="Telefon" icon={Phone} name="contact_phone" visibilityName="show_contact_phone" defaultValue={profile?.contact_phone || ""} defaultChecked={profile?.show_contact_phone ?? true} />
            <VisibleField label="Website URL" icon={Globe2} name="website_url" visibilityName="show_website" type="url" defaultValue={profile?.website_url || ""} defaultChecked={profile?.show_website ?? true} />
            <VisibleField label="LinkedIn URL" icon={LinkedInIcon} name="linkedin_url" visibilityName="show_linkedin" type="url" defaultValue={profile?.linkedin_url || ""} defaultChecked={profile?.show_linkedin ?? true} />
            <VisibleField label="Xing URL" icon={XingIcon} name="xing_url" visibilityName="show_xing" type="url" defaultValue={profile?.xing_url || ""} defaultChecked={profile?.show_xing ?? true} />
            <VisibleField label="X / Twitter URL" icon={XIcon} name="x_url" visibilityName="show_x" type="url" defaultValue={profile?.x_url || ""} defaultChecked={profile?.show_x ?? true} />
            <VisibleField label="Instagram URL" icon={InstagramIcon} name="instagram_url" visibilityName="show_instagram" type="url" defaultValue={profile?.instagram_url || ""} defaultChecked={profile?.show_instagram ?? true} />
            <VisibleField label="Facebook URL" icon={FacebookIcon} name="facebook_url" visibilityName="show_facebook" type="url" defaultValue={profile?.facebook_url || ""} defaultChecked={profile?.show_facebook ?? true} />
            <VisibleField label="YouTube URL" icon={YouTubeIcon} name="youtube_url" visibilityName="show_youtube" type="url" defaultValue={profile?.youtube_url || ""} defaultChecked={profile?.show_youtube ?? true} />
            <VisibleField label="Spotify URL" icon={SpotifyIcon} name="spotify_url" visibilityName="show_spotify" type="url" defaultValue={profile?.spotify_url || ""} defaultChecked={profile?.show_spotify ?? true} />
          </div>
        </fieldset>
        <ProfileImageEditor
          portraitUrl={profile?.portrait_url || ""}
          positionX={profile?.portrait_position_x ?? 50}
          positionY={profile?.portrait_position_y ?? 35}
          zoom={profile?.portrait_zoom ?? 1}
          showPortrait={profile?.show_portrait ?? true}
        />
        <ColorPalettePresets />
        <ColorField label="Primärfarbe" name="primary_color" defaultValue={profile?.primary_color || "#527DF6"} />
        <ColorField
          label="Profilkarten-Hintergrund"
          name="profile_card_bg_color"
          defaultValue={profile?.profile_card_bg_color || "#F8FAFC"}
          description="Hintergrundfarbe der Profilfläche mit Portrait und Kontakticons."
        />
        <ColorField
          label="Terminauswahlkarten"
          name="booking_card_bg_color"
          defaultValue={profile?.booking_card_bg_color || "#FFFFFF"}
          description="Hintergrundfarbe für die Terminart-Karten auf der Buchungsseite."
        />
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

function VisibleField({
  label,
  icon: Icon,
  name,
  visibilityName,
  type = "text",
  defaultValue = "",
  defaultChecked
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  name: string;
  visibilityName: string;
  type?: string;
  defaultValue?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 pr-1 text-sm font-medium text-slate-700">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {label}
          <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
          <input name={visibilityName} type="checkbox" defaultChecked={defaultChecked} className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600" />
          Anzeigen
        </span>
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
  description = "Akzentfarbe für Linien, Ziffern und Buchungsbuttons."
}: {
  label: string;
  name: string;
  defaultValue: string;
  description?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2">
        <input name={name} type="color" defaultValue={normalizeColor(defaultValue)} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" />
        <span className="text-sm text-slate-500">{description}</span>
      </div>
    </label>
  );
}

function nullableString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function buildProfileTemplateData(formData: FormData) {
  return {
    headline: String(formData.get("headline") || "").trim(),
    subheadline: String(formData.get("subheadline") || "").trim(),
    contact_name: nullableString(formData.get("contact_name")),
    contact_email: nullableString(formData.get("contact_email")),
    contact_phone: nullableString(formData.get("contact_phone")),
    linkedin_url: nullableString(formData.get("linkedin_url")),
    xing_url: nullableString(formData.get("xing_url")),
    x_url: nullableString(formData.get("x_url")),
    instagram_url: nullableString(formData.get("instagram_url")),
    facebook_url: nullableString(formData.get("facebook_url")),
    youtube_url: nullableString(formData.get("youtube_url")),
    spotify_url: nullableString(formData.get("spotify_url")),
    website_url: nullableString(formData.get("website_url")),
    primary_color: normalizeColor(String(formData.get("primary_color") || "#527DF6")),
    profile_card_bg_color: normalizeColor(String(formData.get("profile_card_bg_color") || "#F8FAFC"), "#F8FAFC"),
    booking_card_bg_color: normalizeColor(String(formData.get("booking_card_bg_color") || "#FFFFFF"), "#FFFFFF"),
    show_subheadline: formData.get("show_subheadline") === "on",
    show_contact_name: formData.get("show_contact_name") === "on",
    show_contact_email: formData.get("show_contact_email") === "on",
    show_contact_phone: formData.get("show_contact_phone") === "on",
    show_linkedin: formData.get("show_linkedin") === "on",
    show_xing: formData.get("show_xing") === "on",
    show_x: formData.get("show_x") === "on",
    show_instagram: formData.get("show_instagram") === "on",
    show_facebook: formData.get("show_facebook") === "on",
    show_youtube: formData.get("show_youtube") === "on",
    show_spotify: formData.get("show_spotify") === "on",
    show_website: formData.get("show_website") === "on"
  };
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

function normalizeColor(value: string, fallback = "#527DF6") {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function clampNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
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
