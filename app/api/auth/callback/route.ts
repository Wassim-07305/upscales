import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/email-service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fire-and-forget welcome email for new users
      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.email) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, created_at")
            .eq("id", user.id)
            .single();
          // Only send welcome email if account was created in the last 60 seconds
          const isNew = profile?.created_at &&
            Date.now() - new Date(profile.created_at).getTime() < 60_000;
          if (isNew) {
            await sendWelcomeEmail(user.email, profile?.full_name || "");
          }
        } catch (e) {
          console.error("[Welcome email]", e);
        }
      })();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
