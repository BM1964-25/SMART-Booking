import { getEnv } from "@/lib/env";

export const meetingLocationValues = ["phone", "zoom", "teams", "google_meet", "onsite", "individual"] as const;

export type MeetingLocation = (typeof meetingLocationValues)[number];

export type MeetingLocationDetails = {
  label: string;
  description: string;
  link?: string;
  linkLabel?: string;
};

export const meetingLocationOptions: { value: MeetingLocation; label: string; description: string }[] = [
  { value: "phone", label: "Telefon", description: "Sie werden angerufen." },
  { value: "zoom", label: "Zoom", description: "Online-Termin per Zoom." },
  { value: "teams", label: "Microsoft Teams", description: "Online-Termin per Teams." },
  { value: "google_meet", label: "Google Meet", description: "Online-Termin per Meet." },
  { value: "onsite", label: "Ortstermin", description: "Persönlicher Termin vor Ort." },
  { value: "individual", label: "Individuell", description: "Details werden abgestimmt." }
];

export function getMeetingLocationLabel(value?: string | null) {
  return meetingLocationOptions.find((option) => option.value === value)?.label || "Telefon";
}

export function getMeetingLocationDetails(value?: string | null, phone?: string | null): MeetingLocationDetails {
  const env = getEnv();
  const label = getMeetingLocationLabel(value);

  switch (value) {
    case "zoom":
      return {
        label,
        description: env.ZOOM_MEETING_URL ? "Der Zoom-Link ist unten hinterlegt." : "Der Zoom-Link wird separat bereitgestellt.",
        link: env.ZOOM_MEETING_URL,
        linkLabel: "Zoom-Link öffnen"
      };
    case "teams":
      return {
        label,
        description: env.TEAMS_MEETING_URL ? "Der Teams-Link ist unten hinterlegt." : "Der Teams-Link wird separat bereitgestellt.",
        link: env.TEAMS_MEETING_URL,
        linkLabel: "Teams-Link öffnen"
      };
    case "google_meet":
      return {
        label,
        description: env.GOOGLE_MEET_URL ? "Der Google-Meet-Link ist unten hinterlegt." : "Der Google-Meet-Link wird separat bereitgestellt.",
        link: env.GOOGLE_MEET_URL,
        linkLabel: "Google Meet öffnen"
      };
    case "onsite":
      return {
        label,
        description: env.ONSITE_MEETING_URL ? "Die Adresse ist unten verlinkt." : "Die Adresse wird separat abgestimmt.",
        link: env.ONSITE_MEETING_URL,
        linkLabel: "Ort öffnen"
      };
    case "individual":
      return {
        label,
        description: "Die genaue Durchführung wird individuell abgestimmt."
      };
    case "phone":
    default:
      return {
        label: "Telefon",
        description: phone ? "Telefonnummer ist unten hinterlegt." : "Die Telefonnummer wird bei Bedarf separat abgestimmt.",
        link: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined,
        linkLabel: "Telefonnummer anrufen"
      };
  }
}

export function getMeetingLocationCalendarLines(value?: string | null, phone?: string | null) {
  const details = getMeetingLocationDetails(value, phone);

  return [
    `Terminort: ${details.label}`,
    `Hinweis: ${details.description}`,
    details.link ? `Link: ${details.link}` : null
  ].filter(Boolean) as string[];
}
