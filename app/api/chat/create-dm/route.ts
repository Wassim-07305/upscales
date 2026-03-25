import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { otherUserId } = await request.json();
  if (!otherUserId) return NextResponse.json({ error: "otherUserId requis" }, { status: 400 });

  const admin = createAdminClient();

  // Check if DM already exists between these two users
  const { data: myMemberships } = await admin
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id);

  const myChannelIds = (myMemberships || []).map((m) => m.channel_id);

  if (myChannelIds.length > 0) {
    const { data: otherMemberships } = await admin
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", otherUserId)
      .in("channel_id", myChannelIds);

    const sharedIds = (otherMemberships || []).map((m) => m.channel_id);

    if (sharedIds.length > 0) {
      const { data: existingDM } = await admin
        .from("channels")
        .select("*")
        .eq("type", "dm")
        .in("id", sharedIds)
        .limit(1)
        .maybeSingle();

      if (existingDM) {
        return NextResponse.json({ channel: existingDM });
      }
    }
  }

  // Fetch both profile names
  const [myProfile, otherProfile] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin.from("profiles").select("full_name").eq("id", otherUserId).single(),
  ]);

  if (!otherProfile.data) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const dmName = `${myProfile.data?.full_name || "Moi"} & ${otherProfile.data.full_name}`;

  // Create channel
  const { data: newChannel, error: channelError } = await admin
    .from("channels")
    .insert({ name: dmName, type: "dm", created_by: user.id })
    .select()
    .single();

  if (channelError || !newChannel) {
    return NextResponse.json({ error: "Erreur création channel", details: channelError?.message }, { status: 500 });
  }

  // Add both members
  const { error: membersError } = await admin.from("channel_members").insert([
    { channel_id: newChannel.id, user_id: user.id },
    { channel_id: newChannel.id, user_id: otherUserId },
  ]);

  if (membersError) {
    // Rollback
    await admin.from("channels").delete().eq("id", newChannel.id);
    return NextResponse.json({ error: "Erreur ajout membres", details: membersError.message }, { status: 500 });
  }

  return NextResponse.json({ channel: newChannel });
}
