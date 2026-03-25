import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("profiles")
    .update({ is_online: false })
    .eq("is_online", true)
    .lt("last_seen_at", twoMinutesAgo)
    .select("id");

  return NextResponse.json({
    cleaned: data?.length || 0,
    error: error?.message || null,
  });
}
