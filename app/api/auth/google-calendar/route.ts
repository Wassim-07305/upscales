import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGoogleAuthUrl } from "@/lib/gcal/oauth";

function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/auth/google-calendar/callback`;
}

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Non configuré" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const url = generateGoogleAuthUrl(getRedirectUri());
  return NextResponse.redirect(url);
}

export async function DELETE() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Non configuré" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  await adminClient
    .from("google_calendar_tokens")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
