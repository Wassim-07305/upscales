import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Zap, Crown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "Maître";
  if (level >= 7) return "Expert";
  if (level >= 5) return "Avancé";
  if (level >= 3) return "Intermédiaire";
  return "Débutant";
}

function getRankIcon(rank: number) {
  if (rank === 1)
    return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-300" />;
  if (rank === 3)
    return <Medal className="h-5 w-5 text-amber-600" />;
  return null;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "border-yellow-400/50 bg-yellow-400/5";
  if (rank === 2) return "border-gray-300/30 bg-gray-300/5";
  if (rank === 3) return "border-amber-600/30 bg-amber-600/5";
  return "";
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupérer le classement top 20
  const { data: leaderboard } = await supabase
    .from("user_xp")
    .select("user_id, total_xp, level, profiles(full_name, avatar_url)")
    .order("total_xp", { ascending: false })
    .limit(20);

  // Récupérer les stats du user courant
  const { data: currentUserXp } = await supabase
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", user.id)
    .single();

  // Calculer le rang du user courant
  let currentRank = 0;
  if (currentUserXp) {
    const { count } = await supabase
      .from("user_xp")
      .select("user_id", { count: "exact", head: true })
      .gt("total_xp", currentUserXp.total_xp);
    currentRank = (count ?? 0) + 1;
  }

  // Récupérer le profil du user courant
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const xpForNextLevel = currentUserXp
    ? Math.pow((currentUserXp.level + 1), 2) * 100
    : 100;
  const xpProgress = currentUserXp
    ? Math.min(100, (currentUserXp.total_xp / xpForNextLevel) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          Classement
        </h1>
        <p className="text-muted-foreground">
          Les apprenants les plus engagés de la plateforme
        </p>
      </div>

      {/* Carte du user courant */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 text-primary font-bold text-lg flex-shrink-0">
              {currentProfile?.avatar_url ? (
                <Image
                  src={currentProfile.avatar_url}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                getInitials(currentProfile?.full_name ?? null)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {currentProfile?.full_name ?? "Vous"}
                </h3>
                <Badge variant="outline" className="text-primary border-primary/30">
                  Niveau {currentUserXp?.level ?? 1}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  Rang #{currentRank || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  {currentUserXp?.total_xp ?? 0} XP
                </span>
                <span className="text-xs">
                  {getLevelLabel(currentUserXp?.level ?? 1)}
                </span>
              </div>
              {/* Barre de progression vers le niveau suivant */}
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentUserXp?.total_xp ?? 0} / {xpForNextLevel} XP pour le
                  niveau {(currentUserXp?.level ?? 1) + 1}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau du classement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 20</CardTitle>
        </CardHeader>
        <CardContent>
          {!leaderboard || leaderboard.length === 0 ? (
            <div className="py-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Aucun classement disponible pour le moment
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Complétez des modules pour gagner de l&apos;XP !
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const profile = entry.profiles as unknown as {
                  full_name: string | null;
                  avatar_url: string | null;
                } | null;
                const isCurrentUser = entry.user_id === user.id;
                const maxXp = leaderboard[0]?.total_xp || 1;
                const barWidth = Math.max(
                  5,
                  (entry.total_xp / maxXp) * 100
                );

                return (
                  <Link
                    key={entry.user_id}
                    href={`/members/${entry.user_id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent/50",
                      getRankStyle(rank),
                      isCurrentUser && "ring-1 ring-primary/40 bg-primary/5"
                    )}
                  >
                    {/* Rang */}
                    <div className="flex items-center justify-center w-8 flex-shrink-0">
                      {getRankIcon(rank) ?? (
                        <span className="text-sm font-medium text-muted-foreground">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-sm font-medium flex-shrink-0">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(profile?.full_name ?? null)
                      )}
                    </div>

                    {/* Nom + niveau */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {profile?.full_name ?? "Utilisateur"}
                          {isCurrentUser && (
                            <span className="text-xs text-primary ml-1">
                              (vous)
                            </span>
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          Niv. {entry.level}
                        </Badge>
                      </div>
                      {/* Barre XP */}
                      <div className="mt-1">
                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              rank === 1
                                ? "bg-yellow-400"
                                : rank === 2
                                  ? "bg-gray-300"
                                  : rank === 3
                                    ? "bg-amber-600"
                                    : "bg-primary/60"
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 text-sm font-medium flex-shrink-0">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      {entry.total_xp.toLocaleString("fr-FR")}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

