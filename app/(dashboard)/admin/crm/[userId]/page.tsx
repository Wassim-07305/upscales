import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { StudentDetail } from "./StudentDetail";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !isModerator(adminProfile.role)) redirect("/dashboard");

  // Fetch student profile
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!student) notFound();

  // Fetch enrollments with formation info
  const { data: enrollments } = await supabase
    .from("formation_enrollments")
    .select("*, formation:formations(title)")
    .eq("user_id", userId);

  // Fetch progress
  const { data: progress } = await supabase
    .from("module_progress")
    .select("*")
    .eq("user_id", userId);

  // Fetch modules for enrolled formations
  const formationIds = enrollments?.map((e) => e.formation_id) || [];
  const { data: modules } = formationIds.length > 0
    ? await supabase.from("modules").select("id, formation_id").in("formation_id", formationIds)
    : { data: [] };

  // Enrollment progress
  const enrollmentProgress = enrollments?.map((e) => {
    const fModules = modules?.filter((m) => m.formation_id === e.formation_id) || [];
    const completed = progress?.filter(
      (p) => p.formation_id === e.formation_id && p.completed
    ).length || 0;
    return {
      ...e,
      total_modules: fModules.length,
      completed_modules: completed,
      percent: fModules.length > 0 ? Math.round((completed / fModules.length) * 100) : 0,
    };
  }) || [];

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*, formation:formations(title)")
    .eq("user_id", userId);

  // Fetch CRM notes
  const { data: notes } = await supabase
    .from("crm_notes")
    .select("*, author:profiles(full_name)")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  // Fetch tags
  const { data: userTags } = await supabase
    .from("user_tags")
    .select("*, tag:tags(*)")
    .eq("user_id", userId);

  const { data: allTags } = await supabase.from("tags").select("*").order("name");

  // Activity stats
  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", userId);

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  return (
    <StudentDetail
      student={student}
      enrollments={enrollmentProgress}
      certificates={certificates || []}
      notes={notes || []}
      userTags={userTags?.map((ut) => ut.tag).filter(Boolean) || []}
      allTags={allTags || []}
      messageCount={messageCount || 0}
      postCount={postCount || 0}
      isAdmin={adminProfile.role === "admin"}
    />
  );
}
