"use client";

import { useState, useMemo } from "react";
import { useStudents, getStudentDetail } from "@/hooks/use-students";
import type { StudentFlag, StudentPipelineStage } from "@/types/database";
import { useAllCheckins } from "@/hooks/use-checkins";
import { MOOD_CONFIG, ENERGY_CONFIG } from "@/types/coaching";
import type { Mood, WeeklyCheckin } from "@/types/coaching";
import { Flame } from "lucide-react";
import { getInitials, formatDate, cn } from "@/lib/utils";
import { computeStreak } from "@/lib/checkin-utils";
import {
  Search,
  MessageSquare,
  Phone,
  ChevronDown,
  ArrowUpDown,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Tag = "at_risk" | "new" | "standard" | "vip" | "churned";
type SortField = "health_score" | "last_engagement_at";

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
    label: "A risque",
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

const TAG_ORDER: Tag[] = ["at_risk", "new", "standard", "vip", "churned"];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "at_risk", label: "A risque" },
  { value: "new", label: "Nouveaux" },
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "churned", label: "Churned" },
];

export function CoachStudentsOverview() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("health_score");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const { students, isLoading } = useStudents({ limit: 100 });

  const { checkins } = useAllCheckins();

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

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.full_name.toLowerCase().includes(q));
    }

    // Tag filter
    if (tagFilter !== "all") {
      result = result.filter((s) => getStudentDetail(s)?.tag === tagFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aDetails = getStudentDetail(a);
      const bDetails = getStudentDetail(b);

      if (sortField === "health_score") {
        return (aDetails?.health_score ?? 0) - (bDetails?.health_score ?? 0);
      }

      const aDate = aDetails?.last_engagement_at ?? a.created_at;
      const bDate = bDetails?.last_engagement_at ?? b.created_at;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    // Tri par flag (rouge → orange → jaune → vert) pour mettre les prioritaires en haut
    const FLAG_ORDER_SORT: StudentFlag[] = ["red", "orange", "yellow", "green"];
    if (sortField === "health_score" && tagFilter === "all") {
      result.sort((a, b) => {
        const aFlag = (getStudentDetail(a)?.flag ?? "green") as StudentFlag;
        const bFlag = (getStudentDetail(b)?.flag ?? "green") as StudentFlag;
        return FLAG_ORDER_SORT.indexOf(aFlag) - FLAG_ORDER_SORT.indexOf(bFlag);
      });
    }

    return result;
  }, [students, search, tagFilter, sortField]);

  if (isLoading) {
    return (
      <div
        className="bg-surface rounded-xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-[13px] font-semibold text-foreground mb-4">
          Vue eleves
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 animate-shimmer rounded-lg" />
                <div className="h-2 w-full animate-shimmer rounded-lg" />
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
        <h3 className="text-[13px] font-semibold text-foreground">
          Vue eleves
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {filtered.length} eleve{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search + filters */}
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

        {/* Tag filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-muted/50 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          >
            {FILTER_OPTIONS.find((o) => o.value === tagFilter)?.label}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTagFilter(opt.value);
                    setShowFilterDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted transition-colors",
                    tagFilter === opt.value
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

        {/* Sort toggle */}
        <button
          onClick={() =>
            setSortField((f) =>
              f === "health_score" ? "last_engagement_at" : "health_score",
            )
          }
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-muted/50 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          title={
            sortField === "health_score"
              ? "Trier par score de sante"
              : "Trier par dernier engagement"
          }
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Student list */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">Aucun élève trouve</p>
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
            const lastCheckin = clientCheckins.reduce<
              WeeklyCheckin | undefined
            >(
              (best, c) => (!best || c.week_start > best.week_start ? c : best),
              undefined,
            );
            const lastMood = lastCheckin?.mood ?? undefined;
            const lastEnergy = lastCheckin?.energy ?? undefined;

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs text-primary font-medium shrink-0">
                  {student.avatar_url ? (
                    <Image
                      src={student.avatar_url}
                      alt={student.full_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(student.full_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {student.full_name}
                    </p>
                    {/* Flag */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
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
                  {/* Etape */}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {STAGE_LABELS[stage]}
                    {lastEngagement && (
                      <> · {formatDate(lastEngagement, "relative")}</>
                    )}
                  </p>
                </div>

                {/* Mood + energy + streak */}
                <div className="flex items-center gap-2 shrink-0">
                  {lastMood && (
                    <span
                      className="text-sm"
                      title={`Humeur : ${MOOD_CONFIG[lastMood]?.label}`}
                    >
                      {MOOD_CONFIG[lastMood]?.emoji}
                    </span>
                  )}
                  {lastEnergy && (
                    <span
                      className="text-sm"
                      title={`Énergie : ${ENERGY_CONFIG[lastEnergy]?.label}`}
                    >
                      {ENERGY_CONFIG[lastEnergy]?.emoji}
                    </span>
                  )}
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
                    className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
                    title="Envoyer un message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    href={`/coach/calls?student=${student.id}`}
                    className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
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
