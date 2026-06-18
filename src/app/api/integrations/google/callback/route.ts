import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleUserInfo = {
  email?: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(`Google Verbindung abgebrochen: ${error}`)}`, origin));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("smart_booking_google_oauth_state")?.value;
  const supabase = createSupabaseAdmin();
  const { data: storedDbState } = state
    ? await supabase
        .from("oauth_states")
        .select("state,expires_at")
        .eq("provider", "google")
        .eq("state", state)
        .maybeSingle<{ state: string; expires_at: string }>()
    : { data: null };

  if (!code || !state || ((storedState && state !== storedState) || !storedDbState || new Date(storedDbState.expires_at).getTime() < Date.now())) {
    return NextResponse.redirect(new URL("/admin/integrations?error=Google%20OAuth%20Sicherheitspr%C3%BCfung%20fehlgeschlagen.", origin));
  }

  cookieStore.delete("smart_booking_google_oauth_state");
  await supabase.from("oauth_states").delete().eq("provider", "google").eq("state", state);

  try {
    const settings = await getEffectiveAppSettings();

    if (!settings.googleClientId || !settings.googleClientSecret) {
      throw new Error("Google OAuth Client ID und Client Secret fehlen.");
    }

    const redirectUri = new URL("/api/integrations/google/callback", origin).toString();
    const tokenResponse = await exchangeCodeForToken({
      clientId: settings.googleClientId,
      clientSecret: settings.googleClientSecret,
      code,
      redirectUri
    });
    const accountEmail = await fetchGoogleAccountEmail(tokenResponse.access_token);
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : null;
    const { data: existing } = await supabase
      .from("calendar_oauth_connections")
      .select("refresh_token")
      .eq("provider", "google")
      .maybeSingle<{ refresh_token: string | null }>();
    const { error: upsertError } = await supabase.from("calendar_oauth_connections").upsert(
      {
        provider: "google",
        account_email: accountEmail,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || existing?.refresh_token || null,
        expires_at: expiresAt,
        scope: tokenResponse.scope || null,
        is_active: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider" }
    );

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.redirect(new URL("/admin/integrations?calendarTab=google&googleConnected=1", origin));
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : "Google Verbindung konnte nicht gespeichert werden.";
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(message)}`, origin));
  }
}

async function exchangeCodeForToken(input: { clientId: string; clientSecret: string; code: string; redirectUri: string }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Google Token konnte nicht abgerufen werden (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleAccountEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  const userInfo = (await response.json()) as GoogleUserInfo;
  return userInfo.email || null;
}
