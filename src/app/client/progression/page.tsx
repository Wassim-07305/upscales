"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useXp, useXpConfig } from "@/hooks/use-xp";
import { useBadges } from "@/hooks/use-badges";
import { useCertificates } from "@/hooks/use-certificates";
import { useCoachingGoals } from "@/hooks/use-coaching-goals";
import { RARITY_CONFIG } from "@/types/gamification";
import type { Badge, BadgeRarity, XpConfig } from "@/types/gamification";
import type { CoachingGoal } from "@/types/coaching";
import type { Certificate } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  Star,
  Lock,
  Award,
  Medal,
  Target,
  Calendar,
  CheckCircle,
  Sprout,
  Zap,
  Crown,
  Sparkles,
  Smile,
  BookOpen,
  GraduationCap,
  Trophy,
  Flame,
  Wallet,
  PenLine,
  CalendarCheck,
  ClipboardCheck,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// ─── Mapper string icon → composant Lucide ─────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  seedling: Sprout,
  sprout: Sprout,
  zap: Zap,
  award: Award,
  crown: Crown,
  gem: Sparkles,
  baby: Smile,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  flame: Flame,
  star: Star,
  target: Target,
  banknote: Wallet,
  medal: Medal,
};

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Star;
  return ICON_MAP[name] ?? Star;
}

// ─── HELPERS ─────────────────────────

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── TABS ─────────────────────────

type Tab = "progression" | "gagner-xp";

const TABS: { id: Tab; label: string }[] = [
  { id: "progression", label: "Ma progression" },
  { id: "gagner-xp", label: "Gagner de l'XP" },
];

// ─── LEVEL CARD ─────────────────────────

function LevelCard({
  summary,
}: {
  summary: ReturnType<typeof useXp>["summary"];
}) {
  const LevelIcon = getIcon(summary.level.icon);
  const levelColor = summary.level.color ?? "#c6ff00";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${levelColor}08, ${levelColor}15)`,
        }}
      >
        <div
          className="size-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: levelColor + "20" }}
        >
          <LevelIcon className="size-7" style={{ color: levelColor }} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {summary.level.level}
            </span>
            <span className="text-base font-medium text-muted-foreground">
              {summary.level.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.totalXp.toLocaleString("fr-FR")} XP au total
          </p>
        </div>
      </div>

      {summary.nextLevel && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{summary.totalXp.toLocaleString("fr-FR")} XP</span>
            <span className="font-semibold text-foreground">
              {summary.progressToNext}%
            </span>
            <span>{summary.nextLevel.min_xp.toLocaleString("fr-FR")} XP</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: levelColor }}
              initial={{ width: 0 }}
              animate={{ width: `${summary.progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Encore{" "}
            <span className="font-medium text-foreground">
              {(summary.nextLevel.min_xp - summary.totalXp).toLocaleString(
                "fr-FR",
              )}{" "}
              XP
            </span>{" "}
            pour atteindre{" "}
            <span className="font-medium">{summary.nextLevel.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── BADGES SECTION ─────────────────────────

function BadgesSection({
  allBadges,
  earnedBadgeIds,
  certificates,
}: {
  allBadges: Badge[];
  earnedBadgeIds: Set<string>;
  certificates: Certificate[];
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Medal className="w-5 h-5 text-muted-foreground" />
        Badges & Certificats
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="bg-surface border border-amber-200 rounded-xl p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2.5">
              <GraduationCap className="size-6 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-foreground truncate">
              {cert.course_title}
            </p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 inline-block bg-amber-500/10 text-amber-600">
              Certificat
            </span>
          </div>
        ))}

        {allBadges.map((badge) => {
          const earned = earnedBadgeIds.has(badge.id);
          const rarityConfig = RARITY_CONFIG[badge.rarity as BadgeRarity];
          const BadgeIcon = getIcon(badge.icon);

          return (
            <div
              key={badge.id}
              className={cn(
                "bg-surface border rounded-xl p-4 text-center transition-all relative",
                earned
                  ? "border-border hover:shadow-md hover:-translate-y-0.5"
                  : "border-border/50 opacity-50",
              )}
            >
              <div
                className={cn(
                  "size-12 rounded-xl flex items-center justify-center mx-auto mb-2.5",
                  earned ? "bg-primary/10" : "bg-muted",
                )}
              >
                <BadgeIcon
                  className={cn(
                    "size-6",
                    earned ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <p className="text-xs font-medium text-foreground truncate">
                {badge.name}
              </p>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 inline-block",
                  earned
                    ? cn(rarityConfig.color, rarityConfig.bg)
                    : "bg-muted text-muted-foreground",
                )}
              >
                {rarityConfig.label}
              </span>
              {!earned && (
                <div className="absolute top-2.5 right-2.5">
                  <Lock className="size-3.5 text-muted-foreground/50" />
                </div>
              )}
            </div>
          );
        })}

        {allBadges.length === 0 && certificates.length === 0 && (
          <div className="col-span-full bg-surface border border-border rounded-xl p-8 text-center">
            <Medal className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucun badge disponible pour le moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── XP ACTIONS ─────────────────────────

const ACTION_META: Record<
  string,
  { label: string; icon: LucideIcon; description: string }
> = {
  complete_course: {
    label: "Terminer une formation",
    icon: GraduationCap,
    description: "Complete 100% des lecons d'une formation",
  },
  complete_lesson: {
    label: "Terminer une lecon",
    icon: BookOpen,
    description: "Termine une lecon dans une formation",
  },
  complete_onboarding: {
    label: "Completer l'onboarding",
    icon: Trophy,
    description: "Termine toutes les etapes d'accueil",
  },
  weekly_checkin: {
    label: "Bilan hebdomadaire",
    icon: ClipboardCheck,
    description: "Remplis ton bilan de la semaine",
  },
  post_feed: {
    label: "Publier dans le feed",
    icon: MessageSquare,
    description: "Partage un post dans la communaute",
  },
  daily_checkin: {
    label: "Check-in quotidien",
    icon: CalendarCheck,
    description: "Fais ton check-in du jour",
  },
  journal_entry: {
    label: "Ecrire dans le journal",
    icon: PenLine,
    description: "Redige une entree dans ton journal",
  },
  earn_badge: {
    label: "Obtenir un badge",
    icon: Award,
    description: "Debloque un nouveau badge",
  },
};

function XpActionsSection({
  config,
  allBadges,
}: {
  config: XpConfig[];
  allBadges: Badge[];
}) {
  const activeConfig = config.filter((c) => c.is_active);
  const sorted = [...activeConfig].sort((a, b) => b.xp_amount - a.xp_amount);

  const badgesWithXp = allBadges
    .filter((b) => b.xp_reward > 0)
    .sort((a, b) => b.xp_reward - a.xp_reward);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-muted-foreground" />
            Actions
          </h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {sorted.map((item) => {
              const meta = ACTION_META[item.action];
              const Icon = meta?.icon ?? Star;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {meta?.label ?? item.action}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {meta?.description ?? item.description}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    +{item.xp_amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {badgesWithXp.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-muted-foreground" />
              Bonus par badge
            </h2>
            <div className="bg-surface border border-border rounded-xl divide-y divide-border">
              {badgesWithXp.map((badge) => {
                const BadgeIcon = getIcon(badge.icon);
                const rarityConfig = RARITY_CONFIG[badge.rarity as BadgeRarity];
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={cn(
                        "size-9 rounded-lg flex items-center justify-center shrink-0",
                        rarityConfig.bg,
                      )}
                    >
                      <BadgeIcon className={cn("size-4", rarityConfig.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {badge.name}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-medium",
                          rarityConfig.color,
                        )}
                      >
                        {rarityConfig.label}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                      +{badge.xp_reward}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Bonus de regularite (streaks)
        </h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5">
            <p className="text-sm text-muted-foreground">
              Un <span className="font-medium text-foreground">streak</span>,
              c&apos;est le nombre de jours consecutifs ou tu ecris dans ton
              journal. Plus tu es regulier, plus tu gagnes de bonus.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-surface px-5 py-4 text-center">
              <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Flame className="size-4 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-orange-500">+50 XP</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                7 jours d&apos;affilee
              </p>
            </div>
            <div className="bg-surface px-5 py-4 text-center">
              <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Crown className="size-4 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-orange-500">+200 XP</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                30 jours d&apos;affilee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GOALS SECTION ─────────────────────────

function GoalsSection({
  goals,
  toggleMilestone,
}: {
  goals: CoachingGoal[];
  toggleMilestone: ReturnType<typeof useCoachingGoals>["toggleMilestone"];
}) {
  if (goals.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-muted-foreground" />
        Objectifs actifs
      </h2>

      <div className="space-y-3">
        {goals.map((goal) => {
          const progress = goal.target_value
            ? Math.min(
                Math.round(
                  (Number(goal.current_value) / Number(goal.target_value)) *
                    100,
                ),
                100,
              )
            : 0;

          const daysLeft = getDaysRemaining(goal.deadline);
          const isOverdue = daysLeft !== null && daysLeft < 0;
          const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

          const progressColor = isOverdue
            ? "bg-lime-400"
            : progress >= 75
              ? "bg-emerald-500"
              : progress >= 50
                ? "bg-primary"
                : "bg-amber-500";

          return (
            <div
              key={goal.id}
              className="bg-surface border border-border rounded-xl p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                {goal.deadline && (
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ml-3 shrink-0",
                      isOverdue
                        ? "bg-lime-400/10 text-lime-400"
                        : isUrgent
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    {formatDate(goal.deadline)}
                  </span>
                )}
              </div>

              {goal.target_value ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      {Number(goal.current_value).toLocaleString("fr-FR")} /{" "}
                      {Number(goal.target_value).toLocaleString("fr-FR")}
                      {goal.unit ? ` ${goal.unit}` : ""}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        progress >= 75 ? "text-emerald-600" : "text-foreground",
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", progressColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Objectif qualitatif
                  </span>
                </div>
              )}

              {goal.milestones && goal.milestones.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border space-y-1">
                  {goal.milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() =>
                        toggleMilestone.mutate({
                          goalId: goal.id,
                          milestoneId: milestone.id,
                        })
                      }
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div
                        className={cn(
                          "size-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          milestone.completed
                            ? "bg-primary border-primary"
                            : "border-zinc-300 group-hover:border-primary/50",
                        )}
                      >
                        {milestone.completed && (
                          <CheckCircle className="size-3 text-white" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm flex-1",
                          milestone.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {milestone.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ─────────────────────────

export default function ProgressionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("progression");
  const { summary, isLoading: xpLoading } = useXp();
  const { allBadges, earnedBadgeIds, isLoading: badgesLoading } = useBadges();
  const { data: certificates, isLoading: certsLoading } = useCertificates();
  const { config: xpConfig, isLoading: configLoading } = useXpConfig();
  const {
    activeGoals,
    isLoading: goalsLoading,
    toggleMilestone,
  } = useCoachingGoals();

  const isLoading =
    xpLoading || badgesLoading || certsLoading || goalsLoading || configLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Ma Progression
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Niveau, badges et objectifs
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted/50 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Ma Progression
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Niveau, badges et objectifs
        </p>
      </div>

      <div className="flex items-center gap-0 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-10 px-4 text-sm font-medium transition-all relative",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "progression" ? (
          <motion.div
            key="progression"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8 }}
            className="space-y-8"
          >
            <motion.div variants={staggerItem}>
              <LevelCard summary={summary} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <BadgesSection
                allBadges={allBadges}
                earnedBadgeIds={earnedBadgeIds}
                certificates={certificates ?? []}
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <GoalsSection
                goals={activeGoals}
                toggleMilestone={toggleMilestone}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="gagner-xp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <XpActionsSection config={xpConfig} allBadges={allBadges} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
