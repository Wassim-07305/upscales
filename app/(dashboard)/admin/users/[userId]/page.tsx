import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { UserDetailClient } from "./UserDetailClient";

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!currentProfile || !isModerator(currentProfile.role)) redirect("/dashboard");

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!targetProfile) notFound();

  // Fetch related data
  const [
    { data: enrollments },
    { data: certificates },
    { count: postCount },
    { data: userXp },
  ] = await Promise.all([
    supabase
      .from("formation_enrollments")
      .select("*, formation:formations(id, title)")
      .eq("user_id", userId),
    supabase
      .from("certificates")
      .select("*, formation:formations(title)")
      .eq("user_id", userId),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", userId)
      .single(),
  ]);

  return (
    <UserDetailClient
      profile={targetProfile}
      isAdmin={currentProfile.role === "admin"}
      enrollments={enrollments || []}
      certificates={certificates || []}
      postCount={postCount || 0}
      xp={userXp?.total_xp || 0}
      level={userXp?.level || 1}
    />
  );
}
