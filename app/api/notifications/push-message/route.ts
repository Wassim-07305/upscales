import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { channel_id, channel_name, sender_name, preview } = await request.json();
  if (!channel_id) return NextResponse.json({ error: "channel_id requis" }, { status: 400 });

  // Get all members of the channel except the sender
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", channel_id)
    .neq("user_id", user.id);

  if (!members || members.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const userIds = members.map((m) => m.user_id);
  console.log("[Push-Message] Sending to", userIds.length, "users:", userIds);

  await sendPushToUsers(userIds, {
    title: `💬 ${sender_name || "Nouveau message"}`,
    body: channel_name?.startsWith("dm-") || channel_name?.includes("&")
      ? preview || "Nouveau message"
      : `#${channel_name}: ${preview || "Nouveau message"}`,
    url: "/chat",
    tag: `chat-${channel_id}`,
  });

  return NextResponse.json({ success: true, sent: userIds.length });
}
