import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatLayout } from "./ChatLayout";
import { isMember } from "@/lib/utils/roles";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !isMember(profile.role)) redirect("/dashboard");

  // Fetch channels where user is member
  const { data: memberChannels } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id);

  const memberChannelIds = memberChannels?.map((m) => m.channel_id) || [];

  // Fetch all public channels + channels user is member of
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("is_archived", false)
    .order("created_at");

  const publicChannels = channels?.filter((c) => c.type === "public") || [];
  const dmChannels = channels?.filter(
    (c) => c.type === "dm" && memberChannelIds.includes(c.id)
  ) || [];
  const privateChannels = channels?.filter(
    (c) => c.type === "private" && memberChannelIds.includes(c.id)
  ) || [];

  // Get all members for DMs
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_online")
    .neq("id", user.id);

  return (
    <ChatLayout
      user={profile}
      publicChannels={publicChannels}
      privateChannels={privateChannels}
      dmChannels={dmChannels}
      memberChannelIds={memberChannelIds}
      allUsers={allProfiles || []}
    />
  );
}
