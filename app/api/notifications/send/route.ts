import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser, sendPushToUsers } from "@/lib/push";
import { ADMIN_ROLES } from "@/lib/constants/navigation";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Only admin/moderator can send push notifications
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { user_ids, title, body, url, tag } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title et body requis" }, { status: 400 });
  }

  if (user_ids && Array.isArray(user_ids)) {
    await sendPushToUsers(user_ids, { title, body, url, tag });
  }

  return NextResponse.json({ success: true });
}
