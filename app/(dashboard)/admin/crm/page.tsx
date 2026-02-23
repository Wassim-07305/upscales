import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { CRMClient } from "./CRMClient";

export default async function CRMPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  // Parallelize independent queries
  const [{ data: students }, { data: tags }, { data: userTags }, { data: enrollments }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tags").select("*").order("name"),
      supabase.from("user_tags").select("*, tag:tags(*)"),
      supabase.from("formation_enrollments").select("user_id"),
    ]);

  const studentsWithData = students?.map((s) => ({
    ...s,
    tags: userTags?.filter((ut) => ut.user_id === s.id).map((ut) => ut.tag).filter(Boolean) || [],
    enrollments_count: enrollments?.filter((e) => e.user_id === s.id).length || 0,
  })) || [];

  return (
    <CRMClient
      initialStudents={studentsWithData}
      allTags={tags || []}
      currentUserRole={profile.role}
    />
  );
}
