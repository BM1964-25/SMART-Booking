import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getEffectiveAppSettings } from "@/lib/app-settings";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type MicrosoftTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type MicrosoftUserInfo = {
  mail?: string | null;
  userPrincipalName?: string | null;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(`Microsoft Verbindung abgebrochen: ${error}`)}`, origin));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("smart_booking_microsoft_oauth_state")?.value;
  const supabase = createSupabaseAdmin();
  const { data: storedDbState } = state
    ? await supabase
        .from("oauth_states")
        .select("state,expires_at")
        .eq("provider", "microsoft")
        .eq("state", state)
        .maybeSingle<{ state: string; expires_at: string }>()
    : { data: null };

  if (!code || !state || ((storedState && state !== storedState) || !storedDbState || new Date(storedDbState.expires_at).getTime() < Date.now())) {
    return NextResponse.redirect(new URL("/admin/integrations?calendarTab=microsoft&error=Microsoft%20OAuth%20Sicherheitspr%C3%BCfung%20fehlgeschlagen.", origin));
  }

  cookieStore.delete("smart_booking_microsoft_oauth_state");
  await supabase.from("oauth_states").delete().eq("provider", "microsoft").eq("state", state);

  try {
    const settings = await getEffectiveAppSettings();

    if (!settings.microsoftClientId || !settings.microsoftClientSecret) {
      throw new Error("Microsoft OAuth Client ID und Client Secret fehlen.");
    }

    const redirectUri = new URL("/api/integrations/microsoft/callback", origin).toString();
    const tokenResponse = await exchangeCodeForToken({
      clientId: settings.microsoftClientId,
      clientSecret: settings.microsoftClientSecret,
      code,
      redirectUri
    });
    const accountEmail = await fetchMicrosoftAccountEmail(tokenResponse.access_token);
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString() : null;
    const { data: existing } = await supabase
      .from("calendar_oauth_connections")
      .select("refresh_token")
      .eq("provider", "microsoft")
      .maybeSingle<{ refresh_token: string | null }>();
    const { error: upsertError } = await supabase.from("calendar_oauth_connections").upsert(
      {
        provider: "microsoft",
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

    return NextResponse.redirect(new URL("/admin/integrations?calendarTab=microsoft&microsoftConnected=1", origin));
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : "Microsoft Verbindung konnte nicht gespeichert werden.";
    return NextResponse.redirect(new URL(`/admin/integrations?calendarTab=microsoft&error=${encodeURIComponent(message)}`, origin));
  }
}

async function exchangeCodeForToken(input: { clientId: string; clientSecret: string; code: string; redirectUri: string }) {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
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
    throw new Error(`Microsoft Token konnte nicht abgerufen werden (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as MicrosoftTokenResponse;
}

async function fetchMicrosoftAccountEmail(accessToken: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  const userInfo = (await response.json()) as MicrosoftUserInfo;
  return userInfo.mail || userInfo.userPrincipalName || null;
}
