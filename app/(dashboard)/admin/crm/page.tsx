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
  const [{ data: students }, { data: tags }, { data: userTags }, { data: enrollments }, { data: formations }, { data: coachClients }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tags").select("*").order("name"),
      supabase.from("user_tags").select("*, tag:tags(*)"),
      supabase.from("formation_enrollments").select("user_id"),
      supabase.from("formations").select("id, title").eq("status", "published").order("title"),
      supabase.from("coach_clients").select("client_id, phase, health_status"),
    ]);

  const studentsWithData = students?.map((s) => {
    const coach = coachClients?.find((c) => c.client_id === s.id);
    return {
      ...s,
      tags: userTags?.filter((ut) => ut.user_id === s.id).map((ut) => ut.tag).filter(Boolean) || [],
      enrollments_count: enrollments?.filter((e) => e.user_id === s.id).length || 0,
      coach_phase: coach?.phase || null,
      coach_health: coach?.health_status || null,
    };
  }) || [];

  return (
    <CRMClient
      initialStudents={studentsWithData}
      allTags={tags || []}
      allFormations={formations || []}
      currentUserRole={profile.role}
    />
  );
}
