import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { listGoogleCalendars } from "@/lib/calendar/google";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const calendars = await listGoogleCalendars();
    return NextResponse.json({ ok: true, calendars });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Google Kalender konnten nicht geladen werden."
      },
      { status: 500 }
    );
  }
}
