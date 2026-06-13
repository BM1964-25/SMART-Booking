import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { sendEmailTest } from "@/lib/email";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    await sendEmailTest();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "E-Mail-Test fehlgeschlagen."
      },
      { status: 500 }
    );
  }
}
