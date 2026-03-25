import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { SubNav } from "@/components/layout/sub-nav";

export default async function AnalyticsPage() {
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

  // Dates utiles
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
  const eightWeeksAgo = new Date(
    now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Requetes paralleles
  const [
    { data: formations },
    { data: enrollments },
    { data: certificates },
    { data: quizAttempts },
    { data: moduleProgressData },
    { data: activeUsersData },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("formations")
      .select("id, title")
      .eq("status", "published"),
    supabase
      .from("formation_enrollments")
      .select("formation_id, enrolled_at"),
    supabase.from("certificates").select("formation_id, user_id"),
    supabase
      .from("quiz_attempts")
      .select("quiz_id, score, user_id, completed_at, quiz:quizzes!inner(module:modules!inner(formation_id))"),
    supabase
      .from("module_progress")
      .select("user_id, module_id, completed, formation_id")
      .eq("completed", true),
    supabase
      .from("profiles")
      .select("id, last_seen_at")
      .gte("last_seen_at", eightWeeksAgo),
    supabase
      .from("profiles")
      .select("id, full_name"),
  ]);

  // 1. Taux de completion par formation
  const completionRates = (formations || []).map((f) => {
    const enrollCount = enrollments?.filter(
      (e) => e.formation_id === f.id
    ).length || 0;
    const certCount = certificates?.filter(
      (c) => c.formation_id === f.id
    ).length || 0;
    const rate = enrollCount > 0 ? Math.round((certCount / enrollCount) * 100) : 0;
    return {
      formation: f.title.length > 20 ? f.title.slice(0, 20) + "..." : f.title,
      taux: rate,
      inscrits: enrollCount,
      certifies: certCount,
    };
  }).filter((f) => f.inscrits > 0);

  // 2. Tendance des inscriptions (12 mois)
  const enrollmentTrend: { mois: string; inscriptions: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mois = date.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    const count =
      enrollments?.filter(
        (e) => e.enrolled_at >= monthStart && e.enrolled_at <= monthEnd
      ).length || 0;
    enrollmentTrend.push({ mois, inscriptions: count });
  }

  // 3. Performance des quiz par formation
  const quizPerformance = (formations || [])
    .map((f) => {
      const attempts = (quizAttempts || []).filter((a) => {
        const quiz = a.quiz as unknown as { module: { formation_id: string } } | null;
        return quiz?.module?.formation_id === f.id;
      });
      if (attempts.length === 0) return null;
      const avgScore = Math.round(
        attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
      );
      return {
        formation:
          f.title.length > 20 ? f.title.slice(0, 20) + "..." : f.title,
        scoreMoyen: avgScore,
        tentatives: attempts.length,
      };
    })
    .filter(Boolean) as { formation: string; scoreMoyen: number; tentatives: number }[];

  // 4. Engagement hebdomadaire (8 semaines)
  const weeklyEngagement: { semaine: string; utilisateurs: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count =
      activeUsersData?.filter((u) => {
        if (!u.last_seen_at) return false;
        const seen = new Date(u.last_seen_at);
        return seen >= weekStart && seen < weekEnd;
      }).length || 0;
    weeklyEngagement.push({
      semaine: `S-${i}`,
      utilisateurs: count,
    });
  }

  // 5. Top eleves (modules completes)
  const userModuleCounts: Record<string, number> = {};
  (moduleProgressData || []).forEach((mp) => {
    userModuleCounts[mp.user_id] = (userModuleCounts[mp.user_id] || 0) + 1;
  });
  const topStudents = Object.entries(userModuleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([userId, count]) => {
      const p = profiles?.find((pr) => pr.id === userId);
      return {
        nom: p?.full_name || "Utilisateur inconnu",
        modulesCompletes: count,
      };
    });

  // 6. Popularite des formations
  const formationPopularity = (formations || [])
    .map((f) => ({
      formation: f.title.length > 25 ? f.title.slice(0, 25) + "..." : f.title,
      inscriptions: enrollments?.filter((e) => e.formation_id === f.id).length || 0,
    }))
    .sort((a, b) => b.inscriptions - a.inscriptions);

  return (
    <div className="space-y-6">
      <SubNav tabs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Analytics", href: "/admin/analytics" },
      ]} />
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Statistiques detaillees de la plateforme
        </p>
      </div>

      <AnalyticsCharts
        completionRates={completionRates}
        enrollmentTrend={enrollmentTrend}
        quizPerformance={quizPerformance}
        weeklyEngagement={weeklyEngagement}
        topStudents={topStudents}
        formationPopularity={formationPopularity}
      />
    </div>
  );
}
