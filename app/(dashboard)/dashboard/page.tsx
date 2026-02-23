import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CalendarDays, MessageCircle, Award } from "lucide-react";
import Link from "next/link";
import { formatDate, timeAgo, formatDuration } from "@/lib/utils/dates";
import { isAdmin } from "@/lib/utils/roles";

export default async function DashboardPage() {
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

  if (!profile) redirect("/login");

  // Redirect admin to admin dashboard
  if (isAdmin(profile.role)) {
    // Still show member dashboard but with admin link
  }

  // Fetch user's enrollments with formation details
  const { data: enrollments } = await supabase
    .from("formation_enrollments")
    .select("*, formation:formations(*)")
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });

  // Fetch progress for all enrolled formations
  const { data: progress } = await supabase
    .from("module_progress")
    .select("*")
    .eq("user_id", user.id);

  // Fetch module counts per formation
  const formationIds = enrollments?.map((e) => e.formation_id) || [];
  const { data: modules } = formationIds.length > 0
    ? await supabase
        .from("modules")
        .select("id, formation_id")
        .in("formation_id", formationIds)
    : { data: [] };

  // Upcoming sessions
  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select("*, host:profiles(full_name)")
    .eq("status", "scheduled")
    .gte("start_time", new Date().toISOString())
    .order("start_time")
    .limit(3);

  // Recent notifications
  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Certificates count
  const { count: certCount } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Calculate progress per formation
  const formationProgress = enrollments?.map((enrollment) => {
    const formModules = modules?.filter((m) => m.formation_id === enrollment.formation_id) || [];
    const completedModules = progress?.filter(
      (p) => p.formation_id === enrollment.formation_id && p.completed
    ) || [];
    const percent = formModules.length > 0
      ? Math.round((completedModules.length / formModules.length) * 100)
      : 0;
    return { ...enrollment, percent, totalModules: formModules.length, completedModules: completedModules.length };
  }) || [];

  const firstName = profile.full_name?.split(" ")[0] || "vous";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {firstName} !</h1>
        <p className="text-muted-foreground">Voici un résumé de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Formations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Award className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certCount || 0}</p>
                <p className="text-xs text-muted-foreground">Certificats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Sessions à venir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <MessageCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentNotifs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Notifs non lues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formations en cours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes formations en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formationProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune formation en cours.{" "}
                <Link href="/formations" className="text-primary hover:underline">
                  Découvrir les formations
                </Link>
              </p>
            ) : (
              formationProgress.slice(0, 4).map((fp) => (
                <Link
                  key={fp.id}
                  href={`/formations/${fp.formation_id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {(fp as any).formation?.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{fp.percent}%</span>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochaines sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingSessions || upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune session planifiée</p>
            ) : (
              upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href="/calendar"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
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
