import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProgressDashboard } from "./ProgressDashboard";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: enrollments },
    { data: progress },
    { data: userXp },
    { data: userBadges },
    { data: certificates },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("formation_enrollments")
      .select("*, formation:formations(title, thumbnail_url)")
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("module_progress")
      .select("*, module:modules(title, duration_minutes)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("*, badge:badges(name, icon, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
    supabase
      .from("certificates")
      .select("id, certificate_number, issued_at, formation:formations(title)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  // Fetch module counts per formation
  const formationIds = enrollments?.map((e) => e.formation_id) || [];
  const { data: modules } =
    formationIds.length > 0
      ? await supabase
          .from("modules")
          .select("id, formation_id, duration_minutes")
          .in("formation_id", formationIds)
      : { data: [] as { id: string; formation_id: string; duration_minutes: number }[] };

  // Calculate XP rank
  let rank = 0;
  if (userXp) {
    const { count } = await supabase
      .from("user_xp")
      .select("user_id", { count: "exact", head: true })
      .gt("total_xp", userXp.total_xp);
    rank = (count ?? 0) + 1;
  }

  // Process formation progress
  const formationStats =
    enrollments?.map((enrollment) => {
      const formModules =
        modules?.filter((m) => m.formation_id === enrollment.formation_id) || [];
      const completedModules =
        progress?.filter(
          (p) => p.formation_id === enrollment.formation_id && p.completed
        ) || [];
      const totalDuration = formModules.reduce(
        (sum, m) => sum + (m.duration_minutes || 0),
        0
      );
      const completedDuration = completedModules.reduce((sum, p) => {
        const mod = formModules.find((m) => m.id === p.module_id);
        return sum + (mod?.duration_minutes || 0);
      }, 0);

      return {
        formationId: enrollment.formation_id,
        title: (enrollment.formation as unknown as { title: string })?.title || "Formation",
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        totalModules: formModules.length,
        completedModules: completedModules.length,
        percent:
          formModules.length > 0
            ? Math.round((completedModules.length / formModules.length) * 100)
            : 0,
        totalDuration,
        completedDuration,
      };
    }) || [];

  // Build weekly activity data from module_progress
  const XP_PER_MODULE = 25;
  const weeklyActivity: { semaine: string; xp: number; modules: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekModules =
      progress?.filter((p) => {
        if (!p.completed_at) return false;
        const d = new Date(p.completed_at);
        return d >= weekStart && d < weekEnd;
      }) || [];

    const label = `S${52 - i}`;
    weeklyActivity.push({
      semaine: label,
      xp: weekModules.length * XP_PER_MODULE,
      modules: weekModules.length,
    });
  }

  // Calculate streak (consecutive days with completed modules)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedDates = new Set(
    progress
      ?.filter((p) => p.completed && p.completed_at)
      .map((p) => {
        const d = new Date(p.completed_at!);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }) || []
  );

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    if (completedDates.has(checkDate.getTime())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Total learning time
  const totalLearningMinutes =
    progress
      ?.filter((p) => p.completed)
      .reduce((sum, p) => {
        const mod = p.module as unknown as { duration_minutes: number } | null;
        return sum + (mod?.duration_minutes || 0);
      }, 0) || 0;

  return (
    <ProgressDashboard
      profile={profile}
      formationStats={formationStats}
      totalXp={userXp?.total_xp || 0}
      level={userXp?.level || 1}
      rank={rank}
      badges={
        userBadges?.map((ub) => ({
          id: ub.id,
          name: (ub.badge as unknown as { name: string })?.name || "",
          description:
            (ub.badge as unknown as { description: string })?.description || "",
          earnedAt: ub.earned_at,
        })) || []
      }
      weeklyActivity={weeklyActivity}
      streak={streak}
      totalLearningMinutes={totalLearningMinutes}
      totalModulesCompleted={progress?.filter((p) => p.completed).length || 0}
      totalCertificates={certificates?.length || 0}
      certificates={
        certificates?.map((c) => ({
          id: c.id,
          number: c.certificate_number,
          issuedAt: c.issued_at,
          formation: (c.formation as unknown as { title: string })?.title || "",
        })) || []
      }
    />
  );
}
