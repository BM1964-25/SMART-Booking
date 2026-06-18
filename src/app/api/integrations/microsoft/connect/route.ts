import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { requireAdminApi } from "@/lib/auth-api";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const scopes = ["offline_access", "User.Read", "Calendars.ReadWrite"];

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const settings = await getEffectiveAppSettings();
  const origin = request.nextUrl.origin;

  if (!settings.microsoftClientId || !settings.microsoftClientSecret) {
    return NextResponse.redirect(new URL("/admin/integrations?calendarTab=microsoft&error=Microsoft%20OAuth%20Client%20ID%20und%20Client%20Secret%20fehlen.", origin));
  }

  if (settings.microsoftClientId.startsWith("http")) {
    return NextResponse.redirect(
      new URL(
        "/admin/integrations?calendarTab=microsoft&error=Microsoft%20OAuth%20Client%20ID%20ist%20ung%C3%BCltig.%20Bitte%20die%20Application%20Client%20ID%20aus%20Azure%20verwenden%2C%20nicht%20einen%20Teams-Link.",
        origin
      )
    );
  }

  const state = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdmin();
  await supabase.from("oauth_states").delete().lt("expires_at", new Date().toISOString());
  const { error: stateError } = await supabase.from("oauth_states").insert({
    state,
    provider: "microsoft",
    expires_at: expiresAt
  });

  if (stateError) {
    return NextResponse.redirect(new URL(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(stateError.message)}`, origin));
  }

  const cookieStore = await cookies();
  cookieStore.set("smart_booking_microsoft_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });

  const redirectUri = new URL("/api/integrations/microsoft/callback", origin).toString();
  const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  authUrl.searchParams.set("client_id", settings.microsoftClientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}
