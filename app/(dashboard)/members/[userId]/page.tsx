import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/dates";
import { Trophy, Zap, BookOpen, Award, Calendar } from "lucide-react";
import Link from "next/link";

export default async function MemberProfilePage({
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

  // Récupérer le profil du membre
  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, role, created_at, is_online")
    .eq("id", userId)
    .single();

  if (!member) notFound();

  // Requêtes parallèles
  const [
    { data: userXp },
    { data: userBadges },
    { data: enrollments },
    { data: certificates },
    { data: moduleProgress },
    { count: postCount },
  ] = await Promise.all([
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("user_badges")
      .select("*, badge:badges(name, icon, description)")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false }),
    supabase
      .from("formation_enrollments")
      .select("*, formation:formations(id, title, thumbnail_url)")
      .eq("user_id", userId),
    supabase
      .from("certificates")
      .select("*, formation:formations(title)")
      .eq("user_id", userId),
    supabase
      .from("module_progress")
      .select("formation_id, completed")
      .eq("user_id", userId)
      .eq("completed", true),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId),
  ]);

  // Calculer les formations complétées
  const completedFormations = enrollments?.filter((e) => e.completed_at) || [];
  const inProgressFormations = enrollments?.filter((e) => !e.completed_at) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête profil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(member.full_name || "")}
                </AvatarFallback>
              </Avatar>
              {member.is_online && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-neon border-2 border-card" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{member.full_name}</h1>
              {member.bio && (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {member.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center sm:justify-start">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Membre depuis {formatDate(member.created_at)}
                </Badge>
                {member.is_online && (
                  <Badge variant="outline" className="text-xs bg-neon/20 text-neon border-neon/30">
                    En ligne
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{userXp?.total_xp || 0}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-5 w-5 text-[#FFB800] mx-auto mb-1" />
            <p className="text-2xl font-bold">Niv. {userXp?.level || 1}</p>
            <p className="text-xs text-muted-foreground">Niveau</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-5 w-5 text-neon mx-auto mb-1" />
            <p className="text-2xl font-bold">{certificates?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Certificats</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-5 w-5 text-turquoise mx-auto mb-1" />
            <p className="text-2xl font-bold">{postCount || 0}</p>
            <p className="text-xs text-muted-foreground">Publications</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Badges ({userBadges?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!userBadges || userBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun badge obtenu</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userBadges.map((ub) => {
                  const badge = ub.badge as unknown as {
                    name: string;
                    icon: string;
                    description: string;
                  } | null;
                  return (
                    <div
                      key={ub.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Trophy className="h-4 w-4 text-neon" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {badge?.name || "Badge"}
                        </p>
                        {badge?.description && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {badge.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formations complétées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Formations ({completedFormations.length} terminée{completedFormations.length > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedFormations.length === 0 && inProgressFormations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune formation suivie
              </p>
            ) : (
              <>
                {completedFormations.map((e) => (
                  <Link
                    key={e.id}
                    href={`/formations/${e.formation_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-neon/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-neon" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {(e.formation as unknown as { title: string })?.title}
                      </p>
                      <p className="text-[10px] text-neon">Terminée</p>
                    </div>
                  </Link>
                ))}
                {inProgressFormations.slice(0, 3).map((e) => {
                  const completed = moduleProgress?.filter(
                    (p) => p.formation_id === e.formation_id
                  ).length || 0;
                  return (
                    <Link
                      key={e.id}
                      href={`/formations/${e.formation_id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {(e.formation as unknown as { title: string })?.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {completed} module{completed > 1 ? "s" : ""} complété{completed > 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
