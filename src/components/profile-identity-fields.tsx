"use client";

import { useMemo, useState } from "react";

type ProfileIdentityFieldsProps = {
  defaultName: string;
  defaultSlug: string;
};

export function ProfileIdentityFields({ defaultName, defaultSlug }: ProfileIdentityFieldsProps) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug));
  const suggestedSlug = useMemo(() => slugify(name), [name]);

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Profilname</span>
        <input
          name="name"
          type="text"
          value={name}
          required
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);

            if (!slugTouched) {
              setSlug(slugify(nextName));
            }
          }}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <div className="grid gap-3 sm:col-span-2 lg:col-span-2 lg:grid-cols-2 lg:items-start">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Slug für Link</span>
          <input
            name="slug"
            type="text"
            value={slug}
            required
            onChange={(event) => {
              setSlug(slugify(event.target.value));
              setSlugTouched(true);
            }}
            onFocus={() => {
              if (!slug && suggestedSlug) {
                setSlug(suggestedSlug);
              }
            }}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 lg:min-h-[42px]">
          Wird beim neuen Profil automatisch aus dem Profilnamen erstellt, z. B.{" "}
          <span className="font-semibold text-slate-700">builtsmart-ai</span>. Nur Kleinbuchstaben, Zahlen und Bindestriche verwenden.
        </p>
      </div>
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
