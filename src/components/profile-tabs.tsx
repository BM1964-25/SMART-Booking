"use client";

import { Children, ReactNode, useEffect, useState } from "react";

type ProfileTab = {
  id: string;
  name: string;
  slug: string;
  primaryColor?: string | null;
  isActive?: boolean;
  isCreate?: boolean;
};

export function ProfileTabs({ children, initialActiveId, profiles }: { children: ReactNode; initialActiveId?: string; profiles: ProfileTab[] }) {
  const panels = Children.toArray(children);
  const fallbackActiveId = profiles.some((profile) => profile.id === initialActiveId) ? initialActiveId || "" : profiles[0]?.id || "";
  const [activeId, setActiveId] = useState(fallbackActiveId);
  const activeIndex = Math.max(
    0,
    profiles.findIndex((profile) => profile.id === activeId)
  );

  useEffect(() => {
    if (initialActiveId) {
      return;
    }

    const rememberedProfileId = window.sessionStorage.getItem("smart-booking-active-profile-tab");

    if (rememberedProfileId && profiles.some((profile) => profile.id === rememberedProfileId)) {
      setActiveId(rememberedProfileId);
    }
  }, [initialActiveId, profiles]);

  if (profiles.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Noch kein Profil angelegt. Nutzen Sie den Tab „Neues Profil anlegen“, um das erste Profil zu erstellen.
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {profiles.map((profile) => {
          const selected = profile.id === profiles[activeIndex]?.id;
          const profileColor = isValidHexColor(profile.primaryColor) ? profile.primaryColor : "#527DF6";

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setActiveId(profile.id);
                rememberProfileTab(profile.id);
              }}
              className={`relative -mb-px inline-flex items-center gap-2 rounded-t-md border px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-slate-200 border-b-white bg-white text-slate-950 shadow-sm"
                  : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
              style={selected && !profile.isCreate ? { borderTopColor: profileColor } : undefined}
            >
              {profile.isCreate ? <span className="text-base leading-none">+</span> : null}
              {!profile.isCreate ? (
                <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: profileColor }} aria-hidden="true" />
              ) : null}
              <span>{profile.name}</span>
              {!profile.isCreate ? (
                <span className={`h-1.5 w-1.5 rounded-full ${profile.isActive ? "bg-emerald-500" : "bg-slate-300"}`} aria-label={profile.isActive ? "Aktiv" : "Inaktiv"} />
              ) : null}
              {selected && !profile.isCreate ? (
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: profileColor }} />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="pt-5">{panels[activeIndex]}</div>
    </section>
  );
}

function rememberProfileTab(profileId: string) {
  window.sessionStorage.setItem("smart-booking-active-profile-tab", profileId);

  const url = new URL(window.location.href);
  url.searchParams.set("profile", profileId);
  url.searchParams.delete("savedProfile");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function isValidHexColor(value?: string | null): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}
