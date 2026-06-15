"use client";

type PalettePreset = {
  name: string;
  description: string;
  primary: string;
  profileCard: string;
  bookingCard: string;
};

const palettes: PalettePreset[] = [
  {
    name: "Business Blau",
    description: "Klar, neutral und nah am SMART-Booking-Standard.",
    primary: "#527DF6",
    profileCard: "#F8FAFC",
    bookingCard: "#FFFFFF"
  },
  {
    name: "Premium Teal",
    description: "Ruhiger, hochwertiger Auftritt mit etwas mehr Eigenständigkeit.",
    primary: "#0F766E",
    profileCard: "#F0FDFA",
    bookingCard: "#FFFFFF"
  },
  {
    name: "Executive Indigo",
    description: "Etwas markanter, seriös und gut für hochwertige Beratungsprofile.",
    primary: "#4338CA",
    profileCard: "#EEF2FF",
    bookingCard: "#FFFFFF"
  }
];

export function ColorPalettePresets() {
  function applyPalette(palette: PalettePreset) {
    setColorInput("primary_color", palette.primary);
    setColorInput("profile_card_bg_color", palette.profileCard);
    setColorInput("booking_card_bg_color", palette.bookingCard);
  }

  return (
    <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">Farbpaletten</legend>
      <p className="text-sm text-slate-600">
        Wählen Sie einen abgestimmten Vorschlag oder passen Sie die Farben darunter individuell an. Gespeichert wird erst mit „Profil speichern“.
      </p>
      <div className="mt-3 grid gap-3">
        {palettes.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => applyPalette(palette)}
            className="rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <span className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <span>
                <span className="text-sm font-semibold text-slate-950">{palette.name}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{palette.description}</span>
              </span>
              <span className="flex flex-wrap gap-1.5 lg:justify-end">
                <ColorSwatch color={palette.primary} label="Primärfarbe" />
                <ColorSwatch color={palette.profileCard} label="Profilkarte" />
                <ColorSwatch color={palette.bookingCard} label="Terminkarten" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function setColorInput(name: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);

  if (!input) {
    return;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
