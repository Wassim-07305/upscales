import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CalendarDays, MessageCircle, Award, Zap, Trophy, Play, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils/dates";
import { WelcomeConfetti } from "./WelcomeConfetti";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Parallel fetch all data at once
  const [
    { data: profile },
    { data: enrollments },
    { data: progress },
    { data: upcomingSessions },
    { count: certCount },
    { data: recentNotifs },
    { data: userXp },
    { data: userBadges },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("formation_enrollments")
      .select("*, formation:formations(*)")
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false }),
    supabase.from("module_progress").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("*, host:profiles(full_name)")
      .eq("status", "scheduled")
      .gte("start_time", new Date().toISOString())
      .order("start_time")
      .limit(3),
    supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("*, badge:badges(name, icon, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(5),
  ]);

  if (!profile) redirect("/login");

  // Fetch module counts (depends on enrollments)
  const formationIds = enrollments?.map((e) => e.formation_id) || [];
  const { data: modules } =
    formationIds.length > 0
      ? await supabase
          .from("modules")
          .select("id, formation_id")
          .in("formation_id", formationIds)
      : { data: [] as { id: string; formation_id: string }[] };

  // Calculate progress per formation
  const formationProgress =
    enrollments?.map((enrollment) => {
      const formModules =
        modules?.filter((m) => m.formation_id === enrollment.formation_id) ||
        [];
      const completedModules =
        progress?.filter(
          (p) => p.formation_id === enrollment.formation_id && p.completed
        ) || [];
      const percent =
        formModules.length > 0
          ? Math.round((completedModules.length / formModules.length) * 100)
          : 0;
      return {
        ...enrollment,
        percent,
        totalModules: formModules.length,
        completedModules: completedModules.length,
      };
    }) || [];

  // Trouver le dernier module consulté pour "Reprendre"
  const lastProgress = progress?.find((p) => !p.completed) || progress?.[0];
  const lastFormation = lastProgress
    ? enrollments?.find((e) => e.formation_id === lastProgress.formation_id)
    : null;
  const lastModuleId = lastProgress?.module_id;
  const lastFormationId = lastProgress?.formation_id;
  const lastFormationTitle = lastFormation
    ? (lastFormation as { formation?: { title: string } }).formation?.title
    : null;

  // Trouver le prochain module non complété
  const nextUncompletedModule = lastFormationId
    ? modules?.find(
        (m) =>
          m.formation_id === lastFormationId &&
          !progress?.find((p) => p.module_id === m.id && p.completed)
      )
    : null;

  const continueModuleId = nextUncompletedModule?.id || lastModuleId;

  // Calculate streak (consecutive days with completed modules)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedDates = new Set(
    progress
      ?.filter((p) => p.completed && p.completed_at)
      .map((p) => {
        const d = new Date(p.completed_at);
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

  const totalModulesCompleted = progress?.filter((p) => p.completed).length || 0;

  const firstName = profile.full_name?.split(" ")[0] || "vous";

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <WelcomeConfetti />
      </Suspense>
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold">Bonjour, {firstName} !</h1>
        <p className="text-muted-foreground mt-1">
          Voici un résumé de votre activité
        </p>
      </div>

      {/* Reprendre la dernière formation */}
      {continueModuleId && lastFormationId && lastFormationTitle && (
        <Link href={`/formations/${lastFormationId}/${continueModuleId}`}>
          <Card className="animate-fade-up delay-1 hover:border-primary/30 transition-colors cursor-pointer bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reprendre où vous en étiez</p>
                    <p className="font-medium">{lastFormationTitle}</p>
                  </div>
                </div>
                <Button size="sm" variant="default">
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* XP Banner */}
      {(userXp || userBadges?.length) ? (
        <Link href="/leaderboard">
          <Card className="animate-fade-up delay-1 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{userXp?.total_xp || 0} XP</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        Niveau {userXp?.level || 1}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {userBadges?.length || 0} badge{(userBadges?.length || 0) > 1 ? "s" : ""} obtenu{(userBadges?.length || 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {userBadges?.slice(0, 3).map((ub) => (
                    <div key={ub.id} className="p-1.5 rounded-lg bg-muted/50" title={(ub.badge as unknown as { name: string })?.name}>
                      <Trophy className="h-4 w-4 text-neon" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {/* Streak */}
      {streak > 0 && (
        <Link href="/progress">
          <Card className="animate-fade-up delay-1 hover:border-[#FF6B35]/30 transition-colors cursor-pointer bg-gradient-to-r from-[#FF6B35]/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#FF6B35]/10">
                    <Flame className="h-5 w-5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{streak} jour{streak > 1 ? "s" : ""}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Série d&apos;apprentissage en cours · {totalModulesCompleted} module{totalModulesCompleted > 1 ? "s" : ""} terminé{totalModulesCompleted > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="animate-fade-up delay-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 icon-halo">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold stat-value">
                  {enrollments?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Formations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up delay-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neon/10 icon-halo">
                <Award className="h-5 w-5 text-neon" />
              </div>
              <div>
                <p className="text-2xl font-bold stat-value">{certCount || 0}</p>
                <p className="text-xs text-muted-foreground">Certificats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up delay-3">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-turquoise/10 icon-halo">
                <CalendarDays className="h-5 w-5 text-turquoise" />
              </div>
              <div>
                <p className="text-2xl font-bold stat-value">
                  {upcomingSessions?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sessions à venir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up delay-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFB800]/10 icon-halo">
                <MessageCircle className="h-5 w-5 text-[#FFB800]" />
              </div>
              <div>
                <p className="text-2xl font-bold stat-value">
                  {recentNotifs?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Notifs non lues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formations en cours */}
        <Card className="animate-fade-up delay-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Mes formations en cours
            </CardTitle>
            {formationProgress.length > 0 && (
              <Link
                href="/formations"
                className="text-xs text-primary hover:underline"
              >
                Voir tout ({formationProgress.length})
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {formationProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune formation en cours.{" "}
                <Link
                  href="/formations"
                  className="text-primary hover:underline"
                >
                  Découvrir les formations
                </Link>
              </p>
            ) : (
              formationProgress.slice(0, 6).map((fp) => (
                <Link
                  key={fp.id}
                  href={`/formations/${fp.formation_id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {(fp as any).formation?.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {fp.percent}%
                    </span>
                  </div>
                  <Progress value={fp.percent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {fp.completedModules}/{fp.totalModules} modules
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Prochaines sessions */}
        <Card className="animate-fade-up delay-6">
          <CardHeader>
            <CardTitle className="text-base">Prochaines sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingSessions || upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune session planifiée
              </p>
            ) : (
              upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href="/calendar"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200"
                >
                  <div
                    className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.start_time)}
                    </p>
                    {session.host && (
                      <p className="text-xs text-muted-foreground">
                        Par {(session.host as any).full_name}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
