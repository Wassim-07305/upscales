import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatLayout } from "./ChatLayout";
import { isMember } from "@/lib/utils/roles";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ dm?: string }>;
}) {
  const { dm: dmUserId } = await searchParams;
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

  // Fetch all users (for DM search + DM partner display)
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_online")
    .neq("id", user.id);

  return (
    <ChatLayout
      user={profile}
      allUsers={allProfiles || []}
      initialDmUserId={dmUserId || null}
    />
  );
}
