"use client";

import { useMemo } from "react";
import { useStudents, getStudentDetail } from "@/hooks/use-students";
import { useAllCheckins } from "@/hooks/use-checkins";
import type { StudentFlag } from "@/types/database";
import type { Mood, WeeklyCheckin } from "@/types/coaching";
import { MOOD_CONFIG, ENERGY_CONFIG } from "@/types/coaching";
import { getInitials, cn } from "@/lib/utils";
import { getMonday, toWeekStart, computeStreak } from "@/lib/checkin-utils";
import { Flame, CalendarDays } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ── Utilitaires semaine ──────────────────────────────────────

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

// ── Config ───────────────────────────────────────────────────

const FLAG_DOT: Record<StudentFlag, string> = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-lime-400",
};

const FLAG_ORDER: StudentFlag[] = ["red", "orange", "yellow", "green"];

/** Couleur du dot selon le mood */
function moodDotColor(mood: Mood | null): string {
  if (!mood) return "bg-muted";
  if (mood >= 4) return "bg-emerald-500";
  if (mood === 3) return "bg-yellow-400";
  return "bg-lime-400";
}

// ── Composant ────────────────────────────────────────────────

export function CoachCheckinsGrid() {
  const { students, isLoading: studentsLoading } = useStudents({ limit: 100 });
  const { checkins, isLoading: checkinsLoading } = useAllCheckins();

  const weeks = useMemo(() => getLast4Weeks(), []);
  const currentWeek = weeks[3];

  /** Map client_id → WeeklyCheckin[] */
  const checkinsByClient = useMemo(() => {
    const map = new Map<string, WeeklyCheckin[]>();
    for (const c of checkins) {
      const list = map.get(c.client_id) ?? [];
      list.push(c);
      map.set(c.client_id, list);
    }
    return map;
  }, [checkins]);

  /** Élèves triés par flag (rouge → orange → jaune → vert) */
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aFlag = (getStudentDetail(a)?.flag ?? "green") as StudentFlag;
      const bFlag = (getStudentDetail(b)?.flag ?? "green") as StudentFlag;
      return FLAG_ORDER.indexOf(aFlag) - FLAG_ORDER.indexOf(bFlag);
    });
  }, [students]);

  if (studentsLoading || checkinsLoading) {
    return (
      <div
        className="bg-surface rounded-xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-[13px] font-semibold text-foreground mb-4">
          Check-ins de la semaine
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 h-3 bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">
            Check-ins de la semaine
          </h3>
        </div>
        {/* En-têtes des 4 semaines */}
        <div className="hidden sm:flex items-center gap-1 mr-12">
          {weeks.map((week, i) => (
            <div
              key={week}
              className={cn(
                "w-[52px] text-center text-[10px] font-medium",
                i === 3 ? "text-primary" : "text-muted-foreground/60",
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

      {/* Lignes élèves */}
      <div className="space-y-2">
        {sortedStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun élève assigné
          </p>
        ) : (
          sortedStudents.map((student) => {
            const details = getStudentDetail(student);
            const flag = (details?.flag ?? "green") as StudentFlag;
            const clientCheckins = checkinsByClient.get(student.id) ?? [];
            const streak = computeStreak(clientCheckins);

            const checkinByWeek = new Map<string, WeeklyCheckin>();
            for (const c of clientCheckins) {
              checkinByWeek.set(c.week_start, c);
            }

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted/20 transition-colors"
              >
                {/* Avatar + flag dot */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-[10px] text-primary font-medium">
                    {student.avatar_url ? (
                      <Image
                        src={student.avatar_url}
                        alt={student.full_name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(student.full_name)
                    )}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface",
                      FLAG_DOT[flag],
                    )}
                  />
                </div>

                {/* Nom */}
                <p className="text-[13px] font-medium text-foreground truncate flex-1 min-w-0">
                  {student.full_name}
                </p>

                {/* 4 colonnes semaines */}
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
                            ? `Mood: ${c.mood ?? "?"} / Energy: ${c.energy ?? "?"}`
                            : "Pas de check-in"
                        }
                      >
                        {isCurrentWeek ? (
                          c ? (
                            <div className="flex items-center gap-1">
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
                              En attente
                            </span>
                          )
                        ) : (
                          <span
                            className={cn(
                              "w-3 h-3 rounded-full",
                              c ? moodDotColor(c.mood ?? 3) : "bg-muted",
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Streak */}
                <div className="shrink-0 w-12 flex justify-end">
                  {streak >= 2 ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-orange-500">
                      <Flame className="w-3 h-3" />
                      {streak}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
