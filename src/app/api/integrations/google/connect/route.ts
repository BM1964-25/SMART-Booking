import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-api";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const scopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
];

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const settings = await getEffectiveAppSettings();
  const origin = request.nextUrl.origin;

  if (!settings.googleClientId || !settings.googleClientSecret) {
    return NextResponse.redirect(new URL("/admin/integrations?error=Google%20OAuth%20Client%20ID%20und%20Client%20Secret%20fehlen.", origin));
  }

  if (!settings.googleClientId.endsWith(".apps.googleusercontent.com") || settings.googleClientId.startsWith("http")) {
    return NextResponse.redirect(
      new URL(
        "/admin/integrations?error=Google%20OAuth%20Client%20ID%20ist%20ung%C3%BCltig.%20Bitte%20die%20Client-ID%20aus%20Google%20Cloud%20verwenden%2C%20nicht%20den%20Meet-Link.",
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
    provider: "google",
    expires_at: expiresAt
  });

  if (stateError) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(stateError.message)}`, origin));
  }

  const cookieStore = await cookies();
  cookieStore.set("smart_booking_google_oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });

  const redirectUri = new URL("/api/integrations/google/callback", origin).toString();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", settings.googleClientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}
