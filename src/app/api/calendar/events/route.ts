import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { getEvents } from "@/lib/calendar/caldav";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  try {
    const events = await getEvents(from ? new Date(from) : new Date(), to ? new Date(to) : addDays(new Date(), 14));
    return NextResponse.json({
      events: events.map((event) => ({
        uid: event.uid,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        summary: event.summary
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kalendertermine konnten nicht geladen werden." }, { status: 500 });
  }
}
