import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MATIA_BOT_ID } from "@/components/messaging/matia-mention";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { channelId, content } = await request.json();
  if (!channelId || !content) {
    return NextResponse.json(
      { error: "Parametres manquants" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verifier qu'MatIA est membre du canal
  const { data: membership } = await admin
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("profile_id", MATIA_BOT_ID)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "MatIA n'est pas membre de ce canal" },
      { status: 403 },
    );
  }

  const { error } = await admin.from("messages").insert({
    channel_id: channelId,
    sender_id: MATIA_BOT_ID,
    content,
    content_type: "text",
    is_ai_generated: true,
    metadata: { bot: "matia" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
