import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import { ChatLayout } from "./ChatLayout";
import { isMember, isModerator } from "@/lib/utils/roles";

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
    <>
      {isModerator(profile.role) && (
        <SubNav tabs={[
          { label: "Chat", href: "/chat" },
          { label: "Annonces", href: "/admin/broadcast" },
        ]} />
      )}
      <ChatLayout
        user={profile}
        allUsers={allProfiles || []}
        initialDmUserId={dmUserId || null}
      />
    </>
  );
}
