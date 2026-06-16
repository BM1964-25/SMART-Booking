import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { ExternalLink, Globe2, Mail, Phone, UserRound } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { FacebookIcon, InstagramIcon, LinkedInIcon, SpotifyIcon, XIcon, XingIcon, YouTubeIcon } from "@/components/brand-icons";
import { ContactIconOrderEditor } from "@/components/contact-icon-order-editor";
import { ColorPalettePresets } from "@/components/color-palette-presets";
import { CopyLinkField } from "@/components/copy-link-field";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import { EmbedCodeOptions } from "@/components/embed-code-options";
import { ProfileIdentityFields } from "@/components/profile-identity-fields";
import { ProfileImageEditor } from "@/components/profile-image-editor";
import { ProfileSaveButton } from "@/components/profile-save-button";
import { ProfileSaveForm, ProfileSaveMessage, type ProfileSaveState } from "@/components/profile-save-form";
import { ProfileTabs } from "@/components/profile-tabs";
import { ProfileTemplateControls } from "@/components/profile-template-controls";
import { requireAdmin } from "@/lib/admin";
import { normalizeContactIconOrder } from "@/lib/contact-icon-order";
import { getEnv } from "@/lib/env";
import { profileBookPath } from "@/lib/profiles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingProfile, BookingProfileTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";
const MAX_PROFILES = 4;
const DEFAULT_PRIVACY_URL = "https://www.built-smart-hub.com/datenschutz";
const DEFAULT_IMPRINT_URL = "https://www.built-smart-hub.com/impressum";
const PUBLIC_BOOKING_SITE_URL = "https://booking.builtsmart-ai.app";
const PROFILE_SAVE_VERIFY_SELECT = "id, profile_layout, show_workflow_steps, highlight_subheadline, show_highlight_subheadline, subheadline, show_subheadline";

export default async function AdminProfilesPage({ searchParams }: { searchParams?: Promise<{ profile?: string; savedProfile?: string }> }) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const savedProfileId = resolvedSearchParams?.savedProfile || "";
  const requestedProfileId = resolvedSearchParams?.profile || "";
  const supabase = createSupabaseAdmin();
  const { data: profiles } = await supabase.from("booking_profiles").select("*").order("created_at").returns<BookingProfile[]>();
  const { data: profileTemplates } = await supabase
    .from("booking_profile_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BookingProfileTemplate[]>();
  const siteUrl = normalizePublicSiteUrl(getEnv().NEXT_PUBLIC_SITE_URL);
  const profileCount = (profiles || []).length;
  const canCreateMoreProfiles = profileCount < MAX_PROFILES;

  async function saveProfile(_state: ProfileSaveState, formData: FormData): Promise<ProfileSaveState> {
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
      preheadline: nullableString(formData.get("preheadline")),
      headline: String(formData.get("headline") || "").trim(),
      subheadline: String(formData.get("subheadline") || "").trim(),
      highlight_subheadline: nullableString(formData.get("highlight_subheadline")),
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
      contact_icon_order: normalizeContactIconOrder(formData.get("contact_icon_order")),
      portrait_url: removePortrait ? null : uploadedPortraitUrl || nullableString(formData.get("portrait_url")),
      portrait_display_name: nullableString(formData.get("portrait_display_name")),
      portrait_info: nullableString(formData.get("portrait_info")),
      primary_color: normalizeColor(String(formData.get("primary_color") || "#527DF6")),
      profile_card_bg_color: normalizeColor(String(formData.get("profile_card_bg_color") || "#F8FAFC"), "#F8FAFC"),
      booking_card_bg_color: normalizeColor(String(formData.get("booking_card_bg_color") || "#FFFFFF"), "#FFFFFF"),
      profile_layout: normalizeProfileLayout(formData.get("profile_layout")),
      show_workflow_steps: formData.get("show_workflow_steps") === "on",
      portrait_position_x: clampNumber(formData.get("portrait_position_x"), 0, 100, 50),
      portrait_position_y: clampNumber(formData.get("portrait_position_y"), 0, 100, 35),
      portrait_zoom: clampNumber(formData.get("portrait_zoom"), 1, 1.8, 1),
      show_portrait: formData.get("show_portrait") === "on",
      show_portrait_display_name: formData.get("show_portrait_display_name") === "on",
      show_portrait_info: formData.get("show_portrait_info") === "on",
      show_preheadline: formData.get("show_preheadline") === "on",
      show_subheadline: formData.get("show_subheadline") === "on",
      show_highlight_subheadline: formData.get("show_highlight_subheadline") === "on",
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
      show_legal_privacy: formData.get("show_legal_privacy") === "on",
      show_legal_imprint: formData.get("show_legal_imprint") === "on",
      legal_privacy_url: nullableString(formData.get("legal_privacy_url")) || DEFAULT_PRIVACY_URL,
      legal_imprint_url: nullableString(formData.get("legal_imprint_url")) || DEFAULT_IMPRINT_URL,
      allow_embed_view: formData.get("allow_embed_view") === "on",
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString()
    };

    if (!payload.slug || !payload.name || !payload.headline || !payload.subheadline) {
      return { status: "error", message: "Bitte füllen Sie Profilname, Slug, Headline und Subheadline aus." };
    }

    if (id) {
      const { data, error } = await supabase.from("booking_profiles").update(payload).eq("id", id).select(PROFILE_SAVE_VERIFY_SELECT).single<{
        id: string;
        profile_layout: string | null;
        show_workflow_steps: boolean | null;
        highlight_subheadline: string | null;
        show_highlight_subheadline: boolean | null;
        subheadline: string | null;
        show_subheadline: boolean | null;
      }>();

      if (error) {
        return { status: "error", message: error.message || "Profil konnte nicht gespeichert werden." };
      }

      if (!profileSaveMatches(data, payload)) {
        return { status: "error", message: "Profil wurde nicht vollständig gespeichert. Bitte erneut versuchen." };
      }
    } else {
      const { count } = await supabase.from("booking_profiles").select("id", { count: "exact", head: true });

      if ((count || 0) >= MAX_PROFILES) {
        return { status: "error", message: `Es können maximal ${MAX_PROFILES} Profile angelegt werden.` };
      }

      const { data, error } = await supabase.from("booking_profiles").insert(payload).select(PROFILE_SAVE_VERIFY_SELECT).single<{
        id: string;
        profile_layout: string | null;
        show_workflow_steps: boolean | null;
        highlight_subheadline: string | null;
        show_highlight_subheadline: boolean | null;
        subheadline: string | null;
        show_subheadline: boolean | null;
      }>();

      if (error) {
        return { status: "error", message: error.message || "Profil konnte nicht angelegt werden." };
      }

      if (!data?.id || !profileSaveMatches(data, payload)) {
        return { status: "error", message: "Profil wurde nicht vollständig angelegt. Bitte erneut versuchen." };
      }

      revalidatePath("/admin/profiles");
      revalidatePath("/admin/settings");
      revalidatePath("/book");
      if (payload.slug) {
        revalidatePath(`/book/profile/${payload.slug}`);
      }

      redirect(`/admin/profiles?savedProfile=${encodeURIComponent(data.id)}`);
    }

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
    revalidatePath("/book");
    if (payload.slug) {
      revalidatePath(`/book/profile/${payload.slug}`);
    }
    redirect(`/admin/profiles?savedProfile=${encodeURIComponent(id)}`);
  }

  async function duplicateProfile(formData: FormData) {
    "use server";

    await requireAdmin();
    const profileId = String(formData.get("profileId") || "");

    if (!profileId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { count } = await supabase.from("booking_profiles").select("id", { count: "exact", head: true });

    if ((count || 0) >= MAX_PROFILES) {
      return;
    }

    const { data: sourceProfile } = await supabase.from("booking_profiles").select("*").eq("id", profileId).single<BookingProfile>();

    if (!sourceProfile) {
      return;
    }

    const nextSlug = await buildUniqueProfileSlug(sourceProfile.slug, supabase);
    await supabase.from("booking_profiles").insert({
      slug: nextSlug,
      name: `${sourceProfile.name} Kopie`,
      preheadline: sourceProfile.preheadline || "SMART Booking",
      headline: sourceProfile.headline,
      subheadline: sourceProfile.subheadline,
      highlight_subheadline: sourceProfile.highlight_subheadline,
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
      contact_icon_order: normalizeContactIconOrder(sourceProfile.contact_icon_order),
      portrait_url: sourceProfile.portrait_url,
      portrait_display_name: sourceProfile.portrait_display_name || sourceProfile.contact_name,
      portrait_info: sourceProfile.portrait_info,
      primary_color: sourceProfile.primary_color,
      profile_card_bg_color: sourceProfile.profile_card_bg_color,
      booking_card_bg_color: sourceProfile.booking_card_bg_color,
      profile_layout: sourceProfile.profile_layout || "split",
      show_workflow_steps: sourceProfile.show_workflow_steps ?? true,
      portrait_position_x: sourceProfile.portrait_position_x,
      portrait_position_y: sourceProfile.portrait_position_y,
      portrait_zoom: sourceProfile.portrait_zoom,
      show_portrait: sourceProfile.show_portrait,
      show_portrait_display_name: sourceProfile.show_portrait_display_name ?? true,
      show_portrait_info: sourceProfile.show_portrait_info ?? false,
      show_preheadline: sourceProfile.show_preheadline ?? true,
      show_subheadline: sourceProfile.show_subheadline,
      show_highlight_subheadline: sourceProfile.show_highlight_subheadline ?? false,
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
      show_legal_privacy: sourceProfile.show_legal_privacy ?? true,
      show_legal_imprint: sourceProfile.show_legal_imprint ?? true,
      legal_privacy_url: sourceProfile.legal_privacy_url || DEFAULT_PRIVACY_URL,
      legal_imprint_url: sourceProfile.legal_imprint_url || DEFAULT_IMPRINT_URL,
      allow_embed_view: sourceProfile.allow_embed_view ?? false,
      is_active: false
    });

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
  }

  async function deleteProfile(formData: FormData) {
    "use server";

    await requireAdmin();
    const profileId = String(formData.get("id") || "");
    const profileSlug = slugify(String(formData.get("slug") || ""));

    if (!profileId) {
      return;
    }

    const supabase = createSupabaseAdmin();
    const { count } = await supabase.from("booking_profiles").select("id", { count: "exact", head: true });

    if ((count || 0) <= 1) {
      return;
    }

    await supabase.from("booking_type_profiles").delete().eq("profile_id", profileId);
    await supabase.from("booking_profiles").delete().eq("id", profileId);

    revalidatePath("/admin/profiles");
    revalidatePath("/admin/settings");
    revalidatePath("/book");
    if (profileSlug) {
      revalidatePath(`/book/profile/${profileSlug}`);
    }
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
      {profileCount >= MAX_PROFILES ? (
        <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Es können maximal {MAX_PROFILES} Profile angelegt werden. Ein Profil entspricht einer eigenen öffentlichen Buchungsseite für eine Website oder Marke.
        </p>
      ) : null}

      <ProfileTabs
        initialActiveId={savedProfileId || requestedProfileId}
        profiles={[
          ...(profiles || []).map((profile) => ({
            id: profile.id,
            name: profile.name,
            slug: profile.slug,
            primaryColor: profile.primary_color,
            isActive: profile.is_active
          })),
          ...(canCreateMoreProfiles ? [{ id: "new-profile", name: "Neues Profil anlegen", slug: "", isCreate: true }] : [])
        ]}
      >
        {(profiles || []).map((profile) => (
          <ProfileForm
            key={profile.id}
            action={saveProfile}
            duplicateAction={duplicateProfile}
            deleteProfileAction={deleteProfile}
            saveTemplateAction={saveProfileTemplate}
            deleteTemplateAction={deleteProfileTemplate}
            profile={profile}
            savedTemplates={profileTemplates || []}
            siteUrl={siteUrl}
            canCreateMoreProfiles={canCreateMoreProfiles}
            canDeleteProfile={profileCount > 1}
            initialSaveState={savedProfileId === profile.id ? { status: "success", message: "Profil gespeichert." } : undefined}
          />
        ))}
        {canCreateMoreProfiles ? (
          <ProfileForm
            action={saveProfile}
            saveTemplateAction={saveProfileTemplate}
            deleteTemplateAction={deleteProfileTemplate}
            savedTemplates={profileTemplates || []}
            siteUrl={siteUrl}
            canCreateMoreProfiles={canCreateMoreProfiles}
            canDeleteProfile={false}
            initialSaveState={undefined}
          />
        ) : null}
      </ProfileTabs>
    </section>
  );
}

function ProfileForm({
  action,
  duplicateAction,
  deleteProfileAction,
  saveTemplateAction,
  deleteTemplateAction,
  profile,
  savedTemplates,
  siteUrl,
  canCreateMoreProfiles,
  canDeleteProfile,
  initialSaveState
}: {
  action: (_state: ProfileSaveState, formData: FormData) => Promise<ProfileSaveState>;
  duplicateAction?: (formData: FormData) => Promise<void>;
  deleteProfileAction?: (formData: FormData) => Promise<void>;
  saveTemplateAction: (formData: FormData) => Promise<void>;
  deleteTemplateAction: (formData: FormData) => Promise<void>;
  profile?: BookingProfile;
  savedTemplates: BookingProfileTemplate[];
  siteUrl: string;
  canCreateMoreProfiles: boolean;
  canDeleteProfile: boolean;
  initialSaveState?: ProfileSaveState;
}) {
  const slug = profile?.slug || "";
  const publicPath = profile ? profileBookPath(profile) : "/book";
  const isPremiumPreview = profile?.allow_embed_view === true;
  const previewParams = new URLSearchParams({ preview: "admin" });

  if (profile?.id) {
    previewParams.set("returnProfile", profile.id);
  }

  if (isPremiumPreview) {
    previewParams.set("embed", "1");
  }

  const previewPath = `${publicPath}?${previewParams.toString()}`;
  const publicUrl = `${siteUrl}${publicPath}`;
  const embedUrl = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}embed=1`;

  return (
    <ProfileSaveForm action={action} initialState={initialSaveState} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" value={profile?.id || ""} />
      {profile ? <input type="hidden" name="profileId" value={profile.id} /> : null}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">{profile?.name || "Neues Profil"}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href={publicPath} className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
              {publicUrl}
            </Link>
            {profile ? (
              <Link
                href={previewPath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-950 transition hover:border-emerald-400 hover:bg-emerald-200"
              >
                Live-Vorschau öffnen
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="text-sm text-slate-500">Live-Vorschau ist nach dem ersten Speichern verfügbar.</span>
            )}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Die Live-Vorschau zeigt den zuletzt gespeicherten Stand
            {isPremiumPreview ? " als Premium-Einbettung ohne Header und Footer" : " als Standard-Buchungsseite mit Header und Footer"}. Änderungen werden erst
            nach „Profil speichern“ sichtbar.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={profile?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Aktiv
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileIdentityFields defaultName={profile?.name || ""} defaultSlug={profile?.slug || ""} />
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
            Pre-Headline
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <input name="show_preheadline" type="checkbox" defaultChecked={profile?.show_preheadline ?? true} className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600" />
              Anzeigen
            </span>
          </span>
          <input
            name="preheadline"
            type="text"
            defaultValue={profile?.preheadline || "SMART Booking"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Headline" name="headline" defaultValue={profile?.headline || "Termin buchen"} required />
        </div>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
            Subheadline 1
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <input
                name="show_highlight_subheadline"
                type="checkbox"
                defaultChecked={profile?.show_highlight_subheadline ?? false}
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
              />
              Anzeigen
            </span>
          </span>
          <textarea
            name="highlight_subheadline"
            rows={2}
            defaultValue={profile?.highlight_subheadline || ""}
            placeholder="Fetter Hinweis, der direkt unter der Headline erscheint."
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
            Subheadline 2
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
          <legend className="px-1 text-sm font-semibold text-slate-800">Profilansicht</legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Wählen Sie, wie der obere Bereich der öffentlichen Buchungsseite dargestellt wird.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 has-[:checked]:border-brand-500 has-[:checked]:ring-1 has-[:checked]:ring-brand-500">
              <input
                name="profile_layout"
                type="radio"
                value="split"
                defaultChecked={(profile?.profile_layout || "split") !== "centered"}
                className="mt-1 h-4 w-4 border-slate-300 text-brand-600"
              />
              <span>
                <span className="block font-semibold text-slate-950">Klassisch geteilt</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Text links, Profilkarte rechts. Gut für sachliche Beratungsseiten.</span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 has-[:checked]:border-brand-500 has-[:checked]:ring-1 has-[:checked]:ring-brand-500">
              <input
                name="profile_layout"
                type="radio"
                value="centered"
                defaultChecked={profile?.profile_layout === "centered"}
                className="mt-1 h-4 w-4 border-slate-300 text-brand-600"
              />
              <span>
                <span className="block font-semibold text-slate-950">Zentriert</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Headline, Profilkarte und Kontakticons stehen mittig und ruhiger im Fokus.</span>
              </span>
            </label>
          </div>
          <label className="mt-3 flex cursor-pointer items-start justify-between gap-4 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <span>
              <span className="block font-semibold text-slate-950">Ablaufanzeige anzeigen</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Zeigt die 01/02/03-Leiste „Gespräch auswählen“, „Wunschtermin festlegen“, „Buchung abschließen“.
              </span>
            </span>
            <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-200 transition has-[:checked]:bg-brand-500">
              <input name="show_workflow_steps" type="checkbox" defaultChecked={profile?.show_workflow_steps ?? true} className="peer sr-only" />
              <span className="ml-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>
        </fieldset>
        <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">Website-Einbindung</legend>
          <div className="mt-2 grid gap-3">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Zwei Buchungsvarianten für unterschiedliche Leistungspakete</p>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Die Standard-Variante öffnet SMART Booking als eigene Buchungsseite mit Header und Footer. Die Premium-Variante ist für die Einbindung in
                bestehende Webseiten gedacht und blendet Header sowie Footer aus.
              </p>
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-brand-100 bg-brand-50 p-4 text-sm text-slate-700">
              <span>
                <span className="block font-semibold text-slate-950">Premium-Link freischalten</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Gibt die reduzierte Buchungsansicht ohne SMART-Booking-Header und Footer frei. Geeignet für höherwertige Pakete, bei denen die Buchung ruhiger
                  in eine Kundenwebsite eingebunden werden soll.
                </span>
              </span>
              <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-200 transition has-[:checked]:bg-brand-500">
                <input name="allow_embed_view" type="checkbox" defaultChecked={profile?.allow_embed_view ?? false} className="peer sr-only" />
                <span className="ml-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
            <div className="grid gap-3 lg:grid-cols-2">
              <LinkBox
                badge="Standard"
                title="Buchungsseite"
                description="Für Basis-Kunden oder externe Terminbuttons. SMART-Booking-Header und Footer bleiben sichtbar."
                value={publicUrl}
              />
              <LinkBox
                badge="Premium"
                title="Website-Einbettung"
                description="Für höherwertige Pakete. Die Buchung wirkt wie ein Bestandteil der Kundenwebsite."
                value={embedUrl}
                muted={!(profile?.allow_embed_view ?? false)}
              />
            </div>
          </div>
        </fieldset>
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
        <ContactIconOrderEditor order={normalizeContactIconOrder(profile?.contact_icon_order)} />
        <ProfileImageEditor
          portraitUrl={profile?.portrait_url || ""}
          displayName={profile?.portrait_display_name || profile?.contact_name || ""}
          portraitInfo={profile?.portrait_info || ""}
          positionX={profile?.portrait_position_x ?? 50}
          positionY={profile?.portrait_position_y ?? 35}
          zoom={profile?.portrait_zoom ?? 1}
          showPortrait={profile?.show_portrait ?? true}
          showDisplayName={profile?.show_portrait_display_name ?? true}
          showPortraitInfo={profile?.show_portrait_info ?? false}
        />
        <fieldset className="overflow-hidden rounded-md border border-slate-200 bg-white sm:col-span-2 lg:col-span-3">
          <legend className="sr-only">Rechtliches</legend>
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">Rechtliches</p>
          </div>
          <LegalLinkField
            label="Datenschutzerklärung anzeigen"
            name="show_legal_privacy"
            urlName="legal_privacy_url"
            defaultUrl={profile?.legal_privacy_url || DEFAULT_PRIVACY_URL}
            defaultChecked={profile?.show_legal_privacy ?? true}
          />
          <LegalLinkField
            label="Impressum anzeigen"
            name="show_legal_imprint"
            urlName="legal_imprint_url"
            defaultUrl={profile?.legal_imprint_url || DEFAULT_IMPRINT_URL}
            defaultChecked={profile?.show_legal_imprint ?? true}
          />
        </fieldset>
        <ColorPalettePresets />
        <ColorField label="Primärfarbe" name="primary_color" defaultValue={profile?.primary_color || "#527DF6"} />
        <ColorField
          label="Profilkarten-Hintergrund"
          name="profile_card_bg_color"
          defaultValue={profile?.profile_card_bg_color || "#F8FAFC"}
          description="Hintergrundfarbe der Profilfläche mit Profilbild und Kontakticons."
        />
        <ColorField
          label="Terminauswahlkarten"
          name="booking_card_bg_color"
          defaultValue={profile?.booking_card_bg_color || "#FFFFFF"}
          description="Hintergrundfarbe für die Terminart-Karten auf der Buchungsseite."
        />
        <ProfileTemplateControls
          savedTemplates={savedTemplates}
          currentData={profile ? buildProfileTemplateDataFromProfile(profile) : null}
          saveAction={saveTemplateAction}
          deleteAction={deleteTemplateAction}
        />
      </div>
      <EmbedCodeOptions allowEmbedView={profile?.allow_embed_view ?? false} embedUrl={embedUrl} publicUrl={publicUrl} />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {profile && duplicateAction && canCreateMoreProfiles ? (
            <button
              formAction={duplicateAction}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
              type="submit"
            >
              Profil duplizieren
            </button>
          ) : profile && duplicateAction ? (
            <p className="text-sm text-slate-500">Duplizieren ist ab {MAX_PROFILES} Profilen nicht verfügbar.</p>
          ) : null}
          {profile && deleteProfileAction && canDeleteProfile ? <DeleteProfileButton action={deleteProfileAction} profileName={profile.name} /> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProfileSaveButton isNewProfile={!profile} />
          <ProfileSaveMessage />
        </div>
      </div>
    </ProfileSaveForm>
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

function LegalLinkField({
  label,
  name,
  urlName,
  defaultUrl,
  defaultChecked
}: {
  label: string;
  name: string;
  urlName: string;
  defaultUrl: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.2fr)] md:items-center">
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-200 transition has-[:checked]:bg-brand-500">
          <input name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
          <span className="ml-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>
      <label className="block">
        <span className="sr-only">{label} URL</span>
        <input
          name={urlName}
          type="url"
          defaultValue={defaultUrl}
          placeholder="https://..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
    </div>
  );
}

function LinkBox({
  badge,
  description,
  muted = false,
  title,
  value
}: {
  badge: "Premium" | "Standard";
  description: string;
  muted?: boolean;
  title: string;
  value: string;
}) {
  return (
    <div className={`rounded-md border p-4 ${muted ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            badge === "Premium" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {badge}
        </span>
      </div>
      {muted ? <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Erst nach Freischaltung als Premium-Funktion aktiv.</p> : null}
      <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Öffentlicher HTTPS-Link</p>
      <CopyLinkField disabled={muted} value={value} />
    </div>
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

function profileSaveMatches(
  data:
    | {
        profile_layout: string | null;
        show_workflow_steps: boolean | null;
        highlight_subheadline: string | null;
        show_highlight_subheadline: boolean | null;
        subheadline: string | null;
        show_subheadline: boolean | null;
      }
    | null
    | undefined,
  payload: {
    profile_layout: string;
    show_workflow_steps: boolean;
    highlight_subheadline: string | null;
    show_highlight_subheadline: boolean;
    subheadline: string;
    show_subheadline: boolean;
  }
) {
  return (
    data?.profile_layout === payload.profile_layout &&
    data.show_workflow_steps === payload.show_workflow_steps &&
    normalizeSavedText(data.highlight_subheadline) === normalizeSavedText(payload.highlight_subheadline) &&
    data.show_highlight_subheadline === payload.show_highlight_subheadline &&
    normalizeSavedText(data.subheadline) === normalizeSavedText(payload.subheadline) &&
    data.show_subheadline === payload.show_subheadline
  );
}

function normalizeSavedText(value: string | null | undefined) {
  return String(value || "").trim();
}

function normalizePublicSiteUrl(value: string) {
  const siteUrl = String(value || "").replace(/\/$/, "");

  if (!siteUrl || siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")) {
    return PUBLIC_BOOKING_SITE_URL;
  }

  return siteUrl;
}

function buildProfileTemplateData(formData: FormData) {
  return {
    preheadline: nullableString(formData.get("preheadline")),
    headline: String(formData.get("headline") || "").trim(),
    subheadline: String(formData.get("subheadline") || "").trim(),
    highlight_subheadline: nullableString(formData.get("highlight_subheadline")),
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
    contact_icon_order: normalizeContactIconOrder(formData.get("contact_icon_order")),
    portrait_display_name: nullableString(formData.get("portrait_display_name")),
    portrait_info: nullableString(formData.get("portrait_info")),
    primary_color: normalizeColor(String(formData.get("primary_color") || "#527DF6")),
    profile_card_bg_color: normalizeColor(String(formData.get("profile_card_bg_color") || "#F8FAFC"), "#F8FAFC"),
    booking_card_bg_color: normalizeColor(String(formData.get("booking_card_bg_color") || "#FFFFFF"), "#FFFFFF"),
    profile_layout: normalizeProfileLayout(formData.get("profile_layout")),
    show_workflow_steps: formData.get("show_workflow_steps") === "on",
    show_portrait_display_name: formData.get("show_portrait_display_name") === "on",
    show_portrait_info: formData.get("show_portrait_info") === "on",
    show_preheadline: formData.get("show_preheadline") === "on",
    show_subheadline: formData.get("show_subheadline") === "on",
    show_highlight_subheadline: formData.get("show_highlight_subheadline") === "on",
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
    show_legal_privacy: formData.get("show_legal_privacy") === "on",
    show_legal_imprint: formData.get("show_legal_imprint") === "on",
    legal_privacy_url: nullableString(formData.get("legal_privacy_url")) || DEFAULT_PRIVACY_URL,
    legal_imprint_url: nullableString(formData.get("legal_imprint_url")) || DEFAULT_IMPRINT_URL
  };
}

function buildProfileTemplateDataFromProfile(profile: BookingProfile) {
  return {
    preheadline: profile.preheadline,
    headline: profile.headline,
    subheadline: profile.subheadline,
    highlight_subheadline: profile.highlight_subheadline,
    contact_name: profile.contact_name,
    contact_email: profile.contact_email,
    contact_phone: profile.contact_phone,
    linkedin_url: profile.linkedin_url,
    xing_url: profile.xing_url,
    x_url: profile.x_url,
    instagram_url: profile.instagram_url,
    facebook_url: profile.facebook_url,
    youtube_url: profile.youtube_url,
    spotify_url: profile.spotify_url,
    website_url: profile.website_url,
    contact_icon_order: normalizeContactIconOrder(profile.contact_icon_order),
    portrait_display_name: profile.portrait_display_name || profile.contact_name,
    portrait_info: profile.portrait_info,
    primary_color: profile.primary_color,
    profile_card_bg_color: profile.profile_card_bg_color,
    booking_card_bg_color: profile.booking_card_bg_color,
    profile_layout: profile.profile_layout || "split",
    show_workflow_steps: profile.show_workflow_steps ?? true,
    show_portrait_display_name: profile.show_portrait_display_name ?? true,
    show_portrait_info: profile.show_portrait_info ?? false,
    show_preheadline: profile.show_preheadline,
    show_subheadline: profile.show_subheadline,
    show_highlight_subheadline: profile.show_highlight_subheadline ?? false,
    show_contact_name: profile.show_contact_name,
    show_contact_email: profile.show_contact_email,
    show_contact_phone: profile.show_contact_phone,
    show_linkedin: profile.show_linkedin,
    show_xing: profile.show_xing,
    show_x: profile.show_x,
    show_instagram: profile.show_instagram,
    show_facebook: profile.show_facebook,
    show_youtube: profile.show_youtube,
    show_spotify: profile.show_spotify,
    show_website: profile.show_website,
    show_legal_privacy: profile.show_legal_privacy,
    show_legal_imprint: profile.show_legal_imprint,
    legal_privacy_url: profile.legal_privacy_url || DEFAULT_PRIVACY_URL,
    legal_imprint_url: profile.legal_imprint_url || DEFAULT_IMPRINT_URL
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

function normalizeProfileLayout(value: FormDataEntryValue | string | null | undefined) {
  return String(value || "") === "centered" ? "centered" : "split";
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
