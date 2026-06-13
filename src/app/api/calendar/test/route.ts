import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { listCalendars } from "@/lib/calendar/caldav";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const calendars = await listCalendars();
    return NextResponse.json({
      ok: true,
      calendars: calendars.map((calendar) => ({
        displayName: calendar.displayName,
        url: calendar.url
      }))
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Kalender konnte nicht verbunden werden." }, { status: 500 });
  }
}
