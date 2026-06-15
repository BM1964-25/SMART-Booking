export const defaultContactIconOrder = [
  "email",
  "phone",
  "website",
  "linkedin",
  "xing",
  "x",
  "instagram",
  "facebook",
  "youtube",
  "spotify"
] as const;

export type ContactIconKey = (typeof defaultContactIconOrder)[number];

export const contactIconLabels: Record<ContactIconKey, string> = {
  email: "E-Mail",
  phone: "Telefon",
  website: "Website",
  linkedin: "LinkedIn",
  xing: "Xing",
  x: "X / Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  spotify: "Spotify"
};

export function normalizeContactIconOrder(value: unknown): ContactIconKey[] {
  const input = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? parseOrderString(value)
      : [];
  const valid = input.filter((item): item is ContactIconKey =>
    defaultContactIconOrder.includes(item as ContactIconKey)
  );
  const unique = Array.from(new Set(valid));
  const missing = defaultContactIconOrder.filter((item) => !unique.includes(item));

  return [...unique, ...missing];
}

function parseOrderString(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
