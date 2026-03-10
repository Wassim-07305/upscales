"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Zap,
  Trophy,
  Flame,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Star,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile } from "@/lib/types/database";
import Link from "next/link";

const TOOLTIP_STYLE = {
  backgroundColor: "#222222",
  border: "1px solid #2A2A2A",
  borderRadius: "8px",
  fontSize: "12px",
};

interface FormationStat {
  formationId: string;
  title: string;
  enrolledAt: string;
  completedAt: string | null;
  totalModules: number;
  completedModules: number;
  percent: number;
  totalDuration: number;
  completedDuration: number;
}

interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

interface CertificateInfo {
  id: string;
  number: string;
  issuedAt: string;
  formation: string;
}

interface ProgressDashboardProps {
  profile: Profile;
  formationStats: FormationStat[];
  totalXp: number;
  level: number;
  rank: number;
  badges: BadgeInfo[];
  weeklyActivity: { semaine: string; xp: number; modules: number }[];
  streak: number;
  totalLearningMinutes: number;
  totalModulesCompleted: number;
  totalCertificates: number;
  certificates: CertificateInfo[];
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "Maitre";
  if (level >= 7) return "Expert";
  if (level >= 5) return "Avance";
  if (level >= 3) return "Intermediaire";
  return "Debutant";
}

function formatLearningTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function ProgressDashboard({
  formationStats,
  totalXp,
  level,
  rank,
  badges,
  weeklyActivity,
  streak,
  totalLearningMinutes,
  totalModulesCompleted,
  totalCertificates,
  certificates,
}: ProgressDashboardProps) {
  const xpForNextLevel = Math.pow(level + 1, 2) * 100;
  const xpProgress = Math.min(100, (totalXp / xpForNextLevel) * 100);
  const inProgressFormations = formationStats.filter(
    (f) => !f.completedAt && f.percent > 0
  );
  const completedFormations = formationStats.filter((f) => f.completedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ma progression</h1>
        <p className="text-muted-foreground">
          Suivez votre parcours d&apos;apprentissage
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="animate-fade-up">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalXp.toLocaleString("fr-FR")}</p>
                <p className="text-xs text-muted-foreground">XP total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up delay-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">
                  Jour{streak > 1 ? "s" : ""} de suite
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up delay-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-turquoise/10">
                <Clock className="h-5 w-5 text-turquoise" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatLearningTime(totalLearningMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">Temps d&apos;etude</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up delay-3">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neon/10">
                <BookOpen className="h-5 w-5 text-neon" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalModulesCompleted}</p>
                <p className="text-xs text-muted-foreground">Modules termines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level + Rank card */}
      <Card className="animate-fade-up delay-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                  {level}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    Niveau {level} — {getLevelLabel(level)}
                  </h3>
                </div>
                <Progress value={xpProgress} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground">
                  {totalXp.toLocaleString("fr-FR")} /{" "}
                  {xpForNextLevel.toLocaleString("fr-FR")} XP pour le niveau{" "}
                  {level + 1}
                </p>
              </div>
            </div>
            <Link href="/leaderboard">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <Trophy className="h-5 w-5 text-[#FFB800]" />
                <div>
                  <p className="text-sm font-medium">Rang #{rank || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Voir le classement
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly activity chart */}
        <Card className="animate-fade-up delay-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Activite hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF00" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C6FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis
                  dataKey="semaine"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    value ?? 0,
                    name === "xp" ? "XP gagne" : "Modules",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#C6FF00"
                  fill="url(#xpGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Modules per week */}
        <Card className="animate-fade-up delay-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-turquoise" />
              Modules par semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis
                  dataKey="semaine"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number | undefined) => [value ?? 0, "Modules completes"]}
                />
                <Bar dataKey="modules" fill="#7FFFD4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Formations in progress */}
      {inProgressFormations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formations en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressFormations.map((f) => (
              <Link
                key={f.formationId}
                href={`/formations/${f.formationId}`}
                className="block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {f.title}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {f.percent}%
                  </span>
                </div>
                <Progress value={f.percent} className="h-2" />
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {f.completedModules}/{f.totalModules} modules
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLearningTime(f.completedDuration)} /{" "}
                    {formatLearningTime(f.totalDuration)}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed formations */}
      {completedFormations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-neon" />
              Formations terminees ({completedFormations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedFormations.map((f) => (
              <div
                key={f.formationId}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.totalModules} modules — {formatLearningTime(f.totalDuration)}
                  </p>
                </div>
                <Badge variant="outline" className="bg-neon/20 text-neon text-xs">
                  Termine
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#FFB800]" />
              Badges obtenus ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 rounded-xl border border-border bg-muted/30 text-center"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-[#FFB800]/20 flex items-center justify-center mb-2">
                    <Trophy className="h-5 w-5 text-[#FFB800]" />
                  </div>
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Certificats ({certificates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificates.map((cert) => (
              <Link
                key={cert.id}
                href="/certificates"
                className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{cert.formation}</p>
                  <p className="text-xs text-muted-foreground">
                    N° {cert.number}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Certifie
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {formationStats.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              Aucune formation en cours.
            </p>
            <Link
              href="/formations"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Decouvrir les formations
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
