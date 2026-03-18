import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeGoogleCode } from "@/lib/gcal/oauth";

function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/auth/google-calendar/callback`;
}

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Non configuré" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin/settings?gcal=error`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const tokens = await exchangeGoogleCode(code, getRedirectUri());
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${appUrl}/admin/settings?gcal=error`);
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const adminClient = createAdminClient();

    await adminClient.from("google_calendar_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(`${appUrl}/admin/settings?gcal=success`);
  } catch {
    return NextResponse.redirect(`${appUrl}/admin/settings?gcal=error`);
  }
}
