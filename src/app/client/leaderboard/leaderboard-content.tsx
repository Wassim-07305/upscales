"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import {
  useLeaderboard,
  type LeaderboardPeriod,
} from "@/hooks/use-leaderboard";
import { useXp } from "@/hooks/use-xp";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/useRole";
import { useCompetitions } from "@/hooks/use-competitions";
import { useTeams, useMyTeam } from "@/hooks/use-teams";
import {
  Crown,
  Medal,
  Award,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Users,
  Plus,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompetitionCard } from "@/components/gamification/competition-card";
import { CompetitionLeaderboard } from "@/components/gamification/competition-leaderboard";
import { TeamCard } from "@/components/gamification/team-card";
import { CreateCompetitionModal } from "@/components/gamification/create-competition-modal";
import type { Competition } from "@/types/gamification";

type MainTab = "classement" | "competitions" | "équipes";

const PODIUM_CONFIG = [
  {
    position: 1,
    icon: Crown,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  {
    position: 2,
    icon: Medal,
    color: "text-zinc-400",
    bg: "bg-zinc-400/10",
    ring: "ring-zinc-400/30",
  },
  {
    position: 3,
    icon: Award,
    color: "text-amber-700",
    bg: "bg-amber-700/10",
    ring: "ring-amber-700/30",
  },
];

const MAIN_TABS: { value: MainTab; label: string; icon: typeof Trophy }[] = [
  { value: "classement", label: "Classement", icon: Crown },
  { value: "competitions", label: "Competitions", icon: Trophy },
  { value: "équipes", label: "Équipes", icon: Users },
];

function RankChangeIndicator({ change }: { change: number | undefined }) {
  if (change === undefined) return null;
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
        <ArrowUp className="w-3 h-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-lime-400">
        <ArrowDown className="w-3 h-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] text-muted-foreground">
      <Minus className="w-3 h-3" />
    </span>
  );
}

// ─── Individual Leaderboard Tab ─────────────────────────────
function IndividualLeaderboard() {
  const { entries, isLoading, rankChanges } = useLeaderboard("all");
  const { summary } = useXp();
  const { user } = useAuth();

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* My position card */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="bg-surface border border-primary/20 rounded-[14px] p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Ta position</p>
              <p className="text-xs text-muted-foreground">
                {summary.totalXp} XP • Niveau {summary.level.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground">
              #{summary.rank || "\u2014"}
            </p>
            <p className="text-xs text-muted-foreground">
              sur {entries.length} freelances
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted/50 animate-pulse rounded-[14px]"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="bg-surface border border-border rounded-[14px] p-12 text-center"
        >
          <Crown className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Le classement est vide pour le moment
          </p>
        </motion.div>
      ) : (
        <>
          {/* Podium (top 3) */}
          {top3.length > 0 && (
            <motion.div
              variants={fadeInUp}
              transition={defaultTransition}
              className="grid grid-cols-3 gap-3"
            >
              {[top3[1], top3[0], top3[2]].map((entry, visualIndex) => {
                if (!entry) return <div key={visualIndex} />;
                const podium = PODIUM_CONFIG.find(
                  (p) => p.position === entry.rank,
                );
                const Icon = podium?.icon ?? Medal;
                const isMe = entry.profile_id === user?.id;

                return (
                  <div
                    key={entry.profile_id}
                    className={`bg-surface border border-border rounded-[14px] p-4 text-center ${
                      entry.rank === 1 ? "border-amber-500/30" : ""
                    } ${isMe ? "border-primary/30" : ""}`}
                  >
                    <Icon
                      className={`w-6 h-6 mx-auto mb-2 ${podium?.color ?? "text-muted-foreground"}`}
                    />
                    <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center text-sm font-medium text-foreground">
                      {entry.avatar_url ? (
                        <Image
                          src={entry.avatar_url}
                          alt={entry.full_name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        (entry.full_name?.charAt(0)?.toUpperCase() ?? "?")
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isMe ? "text-primary" : "text-foreground",
                        )}
                      >
                        {isMe ? "Toi" : entry.full_name}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {entry.total_xp}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      XP
                    </p>
                    {entry.badge_count > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {entry.badge_count} badges
                      </p>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <motion.div
              variants={fadeInUp}
              transition={defaultTransition}
              className="bg-surface border border-border rounded-[14px] divide-y divide-border/50"
            >
              {rest.map((entry) => {
                const isMe = entry.profile_id === user?.id;

                return (
                  <div
                    key={entry.profile_id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      isMe ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-muted-foreground w-8 text-center">
                      #{entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                      {entry.avatar_url ? (
                        <Image
                          src={entry.avatar_url}
                          alt={entry.full_name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        (entry.full_name?.charAt(0)?.toUpperCase() ?? "?")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isMe ? "text-primary" : "text-foreground",
                          )}
                        >
                          {isMe ? "Toi" : entry.full_name}
                        </p>
                      </div>
                      {entry.badge_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {entry.badge_count} badges
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-foreground">
                        {entry.total_xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Competitions Tab ───────────────────────────────────────
function CompetitionsTab() {
  const { isAdmin } = useRole();
  const { data: competitions = [], isLoading } = useCompetitions();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);

  const activeComps = competitions.filter(
    (c: Competition) => c.status === "active",
  );
  const upcomingComps = competitions.filter(
    (c: Competition) => c.status === "upcoming",
  );
  const completedComps = competitions.filter(
    (c: Competition) => c.status === "completed",
  );

  if (selectedCompetition) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCompetition(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            &larr; Retour aux competitions
          </button>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {selectedCompetition.title}
          </h2>
          {selectedCompetition.description && (
            <p className="text-sm text-muted-foreground">
              {selectedCompetition.description}
            </p>
          )}
        </div>
        <CompetitionLeaderboard
          competitionId={selectedCompetition.id}
          isTeamCompetition={selectedCompetition.type === "team_vs_team"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin create button */}
      {isAdmin && (
        <motion.div variants={fadeInUp} transition={defaultTransition}>
          <button
            onClick={() => setShowCreate(true)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
              "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            <Plus className="w-4 h-4" />
            Nouvelle competition
          </button>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-muted/50 animate-pulse rounded-[14px]"
            />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="bg-surface border border-border rounded-[14px] p-12 text-center"
        >
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            Aucune competition
          </p>
          <p className="text-sm text-muted-foreground">
            Les competitions entre équipes apparaitront ici. Restez a l'affut !
          </p>
        </motion.div>
      ) : (
        <>
          {/* Active competitions */}
          {activeComps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  En cours
                </h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                  {activeComps.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeComps.map((comp: Competition) => (
                  <CompetitionCard
                    key={comp.id}
                    competition={comp}
                    onClick={() => setSelectedCompetition(comp)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingComps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />A venir
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingComps.map((comp: Competition) => (
                  <CompetitionCard
                    key={comp.id}
                    competition={comp}
                    onClick={() => setSelectedCompetition(comp)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedComps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Terminées
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {completedComps.map((comp: Competition) => (
                  <CompetitionCard
                    key={comp.id}
                    competition={comp}
                    onClick={() => setSelectedCompetition(comp)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CreateCompetitionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}

// ─── Teams Tab ──────────────────────────────────────────────
function TeamsTab() {
  const { data: teams = [], isLoading } = useTeams();
  const { data: myTeam } = useMyTeam();

  return (
    <div className="space-y-6">
      {/* My team highlight */}
      {myTeam && (
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="bg-surface border border-primary/20 rounded-[14px] p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{myTeam.avatar_emoji ?? "🔥"}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ton équipe
              </p>
              <p className="text-base font-bold text-foreground">
                {myTeam.name}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/50 animate-pulse rounded-[14px]"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="bg-surface border border-border rounded-[14px] p-12 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            Aucune équipe
          </p>
          <p className="text-sm text-muted-foreground">
            Les équipes seront creees par les administrateurs pour les
            competitions.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team: import("@/types/gamification").Team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────
export default function LeaderboardContent() {
  return (
    <div className="space-y-6">
      <IndividualLeaderboard />
    </div>
  );
}
