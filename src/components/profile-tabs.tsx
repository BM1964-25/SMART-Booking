"use client";

import { Children, ReactNode, useState } from "react";

type ProfileTab = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export function ProfileTabs({ profiles, children }: { profiles: ProfileTab[]; children: ReactNode }) {
  const panels = Children.toArray(children);
  const [activeId, setActiveId] = useState(profiles[0]?.id || "");
  const activeIndex = Math.max(
    0,
    profiles.findIndex((profile) => profile.id === activeId)
  );

  if (profiles.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Noch kein Profil angelegt. Öffnen Sie unten „Neues Profil anlegen“, um das erste Profil zu erstellen.
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {profiles.map((profile) => {
          const selected = profile.id === profiles[activeIndex]?.id;

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setActiveId(profile.id)}
              className={`relative -mb-px inline-flex items-center gap-2 rounded-t-md border px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-slate-200 border-b-white bg-white text-brand-700"
                  : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              <span>{profile.name}</span>
              <span className={`h-2 w-2 rounded-full ${profile.isActive ? "bg-emerald-500" : "bg-slate-300"}`} aria-label={profile.isActive ? "Aktiv" : "Inaktiv"} />
            </button>
          );
        })}
      </div>
      <div className="pt-5">{panels[activeIndex]}</div>
    </section>
  );
}
