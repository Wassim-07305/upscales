"use client";

import { useState, useMemo } from "react";
import { useStudents, getStudentDetail } from "@/hooks/use-students";
import { useAllCheckins } from "@/hooks/use-checkins";
import type { StudentFlag, StudentPipelineStage } from "@/types/database";
import type { Mood, WeeklyCheckin } from "@/types/coaching";
import { MOOD_CONFIG, ENERGY_CONFIG } from "@/types/coaching";
import { getInitials, formatDate, cn } from "@/lib/utils";
import { toWeekStart, computeStreak } from "@/lib/checkin-utils";
import {
  Search,
  MessageSquare,
  Phone,
  ChevronDown,
  ArrowUpDown,
  Users,
  Flame,
  CalendarDays,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ── Config ───────────────────────────────────────────────────

const FLAG_CONFIG: Record<
  StudentFlag,
  { label: string; dotColor: string; badgeColor: string }
> = {
  green: {
    label: "Bonne voie",
    dotColor: "bg-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
  },
  yellow: {
    label: "Attention",
    dotColor: "bg-yellow-400",
    badgeColor: "bg-yellow-400/10 text-yellow-600",
  },
  orange: {
    label: "À risque",
    dotColor: "bg-orange-500",
    badgeColor: "bg-orange-500/10 text-orange-600",
  },
  red: {
    label: "Critique",
    dotColor: "bg-lime-400",
    badgeColor: "bg-lime-400/10 text-lime-400",
  },
};

const STAGE_LABELS: Record<StudentPipelineStage, string> = {
  onboarding: "Onboarding",
  learning: "Apprentissage",
  practicing: "Pratique",
  launching: "Lancement",
  scaling: "Scaling",
  autonomous: "Autonome",
};

const FLAG_ORDER: StudentFlag[] = ["red", "orange", "yellow", "green"];

type SortField = "health_score" | "last_engagement_at";

type FlagFilter = "all" | StudentFlag;

const FILTER_OPTIONS: { value: FlagFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "red", label: "Critique" },
  { value: "orange", label: "À risque" },
  { value: "yellow", label: "Attention" },
  { value: "green", label: "Bonne voie" },
];

/** Retourne les 4 derniers lundis (du plus ancien au plus récent) */
function getLast4Weeks(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(toWeekStart(d));
  }
  return weeks;
}

/** Couleur du dot selon le mood */
function moodDotColor(mood: Mood | null): string {
  if (!mood) return "bg-muted";
  if (mood >= 4) return "bg-emerald-500";
  if (mood === 3) return "bg-yellow-400";
  return "bg-lime-400";
}

// ── Composant ────────────────────────────────────────────────

export function CoachStudentsList() {
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [sortField, setSortField] = useState<SortField>("health_score");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const { students, isLoading: studentsLoading } = useStudents({ limit: 200 });
  const { checkins, isLoading: checkinsLoading } = useAllCheckins();

  const weeks = useMemo(() => getLast4Weeks(), []);
  const currentWeek = weeks[3];

  const checkinsByClient = useMemo(() => {
    const map = new Map<string, WeeklyCheckin[]>();
    for (const c of checkins) {
      const list = map.get(c.client_id) ?? [];
      list.push(c);
      map.set(c.client_id, list);
    }
    return map;
  }, [checkins]);

  const filtered = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.full_name.toLowerCase().includes(q));
    }

    if (flagFilter !== "all") {
      result = result.filter(
        (s) => (getStudentDetail(s)?.flag ?? "green") === flagFilter,
      );
    }

    result.sort((a, b) => {
      const aDetails = getStudentDetail(a);
      const bDetails = getStudentDetail(b);

      if (sortField === "health_score") {
        // Tri par flag prioritaire
        const aFlag = (aDetails?.flag ?? "green") as StudentFlag;
        const bFlag = (bDetails?.flag ?? "green") as StudentFlag;
        return FLAG_ORDER.indexOf(aFlag) - FLAG_ORDER.indexOf(bFlag);
      }

      const aDate = aDetails?.last_engagement_at ?? a.created_at;
      const bDate = bDetails?.last_engagement_at ?? b.created_at;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    return result;
  }, [students, search, flagFilter, sortField]);

  const isLoading = studentsLoading || checkinsLoading;

  if (isLoading) {
    return (
      <div
        className="bg-surface rounded-xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                <div className="h-2 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="hidden sm:flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="w-6 h-6 rounded-full bg-muted animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-xl p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">
            Suivi élèves
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filtered.length} élève{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Recherche + filtres */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Filtre flag */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-muted/50 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          >
            {FILTER_OPTIONS.find((o) => o.value === flagFilter)?.label}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFlagFilter(opt.value);
                    setShowFilterDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted transition-colors",
                    flagFilter === opt.value
                      ? "text-primary font-medium"
                      : "text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tri */}
        <button
          onClick={() =>
            setSortField((f) =>
              f === "health_score" ? "last_engagement_at" : "health_score",
            )
          }
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-muted/50 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          title={
            sortField === "health_score"
              ? "Tri actuel : priorité (crit → vert)"
              : "Tri actuel : dernier engagement"
          }
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* En-têtes colonnes semaines (desktop) */}
      <div className="hidden sm:flex items-center gap-3 px-2 mb-1">
        <div className="w-9 shrink-0" />
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1 mr-14">
          {weeks.map((week, i) => (
            <div
              key={week}
              className={cn(
                "text-center text-[10px] font-medium",
                i === 3
                  ? "w-[52px] text-primary"
                  : "w-6 text-muted-foreground/50",
              )}
            >
              {i === 3
                ? "Cette sem."
                : format(new Date(week + "T12:00:00"), "d MMM", {
                    locale: fr,
                  })}
            </div>
          ))}
        </div>
      </div>

      {/* Liste élèves */}
      <div className="space-y-1 max-h-[540px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">Aucun élève trouvé</p>
          </div>
        ) : (
          filtered.map((student) => {
            const details = getStudentDetail(student);
            const flag = (details?.flag ?? "green") as StudentFlag;
            const stage = (details?.pipeline_stage ??
              "onboarding") as StudentPipelineStage;
            const lastEngagement = details?.last_engagement_at;
            const flagConfig = FLAG_CONFIG[flag];

            const clientCheckins = checkinsByClient.get(student.id) ?? [];
            const streak = computeStreak(clientCheckins);

            const checkinByWeek = new Map<string, WeeklyCheckin>();
            for (const c of clientCheckins) {
              checkinByWeek.set(c.week_start, c);
            }

            const currentCheckin = checkinByWeek.get(currentWeek);

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                {/* Avatar + flag dot */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-[11px] text-primary font-medium">
                    {student.avatar_url ? (
                      <Image
                        src={student.avatar_url}
                        alt={student.full_name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(student.full_name)
                    )}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface",
                      flagConfig.dotColor,
                    )}
                  />
                </div>

                {/* Nom + étape */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {student.full_name}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                        flagConfig.badgeColor,
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          flagConfig.dotColor,
                        )}
                      />
                      {flagConfig.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {STAGE_LABELS[stage]}
                    {lastEngagement && (
                      <> · {formatDate(lastEngagement, "relative")}</>
                    )}
                  </p>
                </div>

                {/* 4 semaines de check-ins (desktop) */}
                <div className="hidden sm:flex items-center gap-1">
                  {weeks.map((week, i) => {
                    const c = checkinByWeek.get(week);
                    const isCurrentWeek = i === 3;

                    return (
                      <div
                        key={week}
                        className={cn(
                          "flex items-center justify-center transition-all",
                          isCurrentWeek
                            ? "w-[52px] h-7 rounded-lg"
                            : "w-6 h-6 rounded-full",
                          isCurrentWeek &&
                            !c &&
                            "bg-muted/40 border border-dashed border-border",
                        )}
                        title={
                          c
                            ? `Mood: ${c.mood ?? "?"} / Énergie: ${c.energy ?? "?"}`
                            : "Pas de check-in"
                        }
                      >
                        {isCurrentWeek ? (
                          c ? (
                            <div className="flex items-center gap-0.5">
                              <span className="text-sm">
                                {c.mood
                                  ? MOOD_CONFIG[c.mood as Mood]?.emoji
                                  : "—"}
                              </span>
                              <span className="text-sm">
                                {c.energy ? ENERGY_CONFIG[c.energy]?.emoji : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">
                              —
                            </span>
                          )
                        ) : (
                          <span
                            className={cn(
                              "w-3 h-3 rounded-full",
                              c
                                ? moodDotColor((c.mood as Mood) ?? null)
                                : "bg-muted",
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Streak */}
                <div className="shrink-0 w-10 flex justify-end">
                  {streak >= 2 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-500">
                      <Flame className="w-3 h-3" />
                      {streak}
                    </span>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Link
                    href={`/coach/messaging?student=${student.id}`}
                    className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
                    title="Envoyer un message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    href={`/coach/calls?student=${student.id}`}
                    className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
                    title="Planifier un appel"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
