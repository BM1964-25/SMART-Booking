"use client";

import { useEffect, useId, useState } from "react";

type ProfileImageEditorProps = {
  portraitUrl?: string | null;
  positionX: number;
  positionY: number;
  zoom: number;
  showPortrait: boolean;
};

export function ProfileImageEditor({ portraitUrl, positionX, positionY, zoom, showPortrait }: ProfileImageEditorProps) {
  const fileInputId = useId();
  const [previewUrl, setPreviewUrl] = useState(portraitUrl || "");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [currentX, setCurrentX] = useState(positionX);
  const [currentY, setCurrentY] = useState(positionY);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <fieldset className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:col-span-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">Profilbild</legend>
      <input type="hidden" name="portrait_url" value={portraitUrl || ""} />
      <div className="mt-2 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex flex-col items-center gap-3">
          {previewUrl ? (
            <div className="h-24 w-24 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${currentX}% ${currentY}%`,
                  transform: `scale(${currentZoom})`
                }}
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-400 ring-1 ring-slate-200">Kein Bild</div>
          )}
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="show_portrait" type="checkbox" defaultChecked={showPortrait} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Im Profil anzeigen
          </label>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col items-start gap-2">
              <input
                id={fileInputId}
                name="portrait_file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                  }

                  const nextUrl = URL.createObjectURL(file);
                  setObjectUrl(nextUrl);
                  setPreviewUrl(nextUrl);
                }}
              />
              <div className="flex w-full flex-wrap items-center gap-3">
                <label
                  htmlFor={fileInputId}
                  className="inline-flex cursor-pointer rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  Profilbild auswählen
                </label>
              </div>
              {portraitUrl ? (
                <label className="inline-flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200">
                  <input name="remove_portrait" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                  Bild entfernen
                </label>
              ) : null}
            </div>
            <p className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500 ring-1 ring-slate-200">
              Wählen Sie ein Portrait aus, passen Sie den runden Ausschnitt an und speichern Sie das Profil. „Bild entfernen“ löscht das aktuell gespeicherte Bild
              erst nach dem Speichern.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <RangeControl label="Horizontal" name="portrait_position_x" min={0} max={100} step={1} value={currentX} suffix="%" onChange={setCurrentX} />
            <RangeControl label="Vertikal" name="portrait_position_y" min={0} max={100} step={1} value={currentY} suffix="%" onChange={setCurrentY} />
            <RangeControl label="Zoom" name="portrait_zoom" min={1} max={1.8} step={0.05} value={currentZoom} suffix="x" onChange={setCurrentZoom} />
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function RangeControl({
  label,
  name,
  min,
  max,
  step,
  value,
  suffix,
  onChange
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-md bg-white px-3 py-2 ring-1 ring-slate-200">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        {label}
        <span className="text-xs font-semibold text-slate-500">
          {Number(value.toFixed(2))}
          {suffix}
        </span>
      </span>
      <input
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="mt-2 w-full accent-brand-600"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
