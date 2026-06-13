import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { testZoomMeetingLink } from "@/lib/meeting-links";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const meetingUrl = await testZoomMeetingLink();
    return NextResponse.json({ ok: true, meetingUrl });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Zoom-Test fehlgeschlagen."
      },
      { status: 500 }
    );
  }
}
