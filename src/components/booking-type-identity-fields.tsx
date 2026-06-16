"use client";

import { useMemo, useState } from "react";

type BookingTypeIdentityFieldsProps = {
  defaultName: string;
  defaultSlug: string;
};

export function BookingTypeIdentityFields({ defaultName, defaultSlug }: BookingTypeIdentityFieldsProps) {
  const [name, setName] = useState(defaultName);
  const suggestedSlug = useMemo(() => slugify(name), [name]);
  const slug = suggestedSlug || defaultSlug;

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Name</span>
        <input
          name="name"
          type="text"
          value={name}
          required
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Slug</span>
        <input type="hidden" name="slug" value={slug} />
        <input
          aria-label="Automatisch erzeugter Slug"
          type="text"
          value={slug}
          disabled
          className="mt-2 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
        />
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          Wird automatisch aus dem Namen erzeugt und dient als technischer Link-Bestandteil der Terminart.
        </span>
      </label>
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
