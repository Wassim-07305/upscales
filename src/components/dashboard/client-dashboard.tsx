"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useXp } from "@/hooks/use-xp";
import { useCourses, useLessonProgress } from "@/hooks/use-courses";
import { useSetterActivities } from "@/hooks/use-setter-crm";
import { useCloserCalls } from "@/hooks/use-closer-calls";
import { useRoutePrefix } from "@/hooks/use-route-prefix";
import { useNextClientCall } from "@/hooks/use-calls";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { StatCard } from "@/components/dashboard/stat-card";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Star,
  MessageSquare,
  PhoneCall,
  Download,
  Target,
  Pencil,
  Check,
  CalendarClock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Period options ---

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours", days: 7 },
  { value: "14d", label: "14 derniers jours", days: 14 },
  { value: "30d", label: "30 derniers jours", days: 30 },
  { value: "90d", label: "3 derniers mois", days: 90 },
] as const;

type PeriodKey = (typeof PERIOD_OPTIONS)[number]["value"];

function getPeriodStartDate(period: PeriodKey): Date {
  const opt = PERIOD_OPTIONS.find((o) => o.value === period)!;
  const d = new Date();
  d.setDate(d.getDate() - opt.days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// --- Greeting helper ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

// --- Objectives localStorage helpers ---

const OBJECTIVES_KEY = "upscale-client-objectives";

interface ClientObjectives {
  dmsTarget: number;
  appelsTarget: number;
}

function loadObjectives(): ClientObjectives {
  const defaults = { dmsTarget: 100, appelsTarget: 30 };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(OBJECTIVES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(
      "Objectifs corrompus dans localStorage, reinitialisation:",
      err,
    );
    localStorage.removeItem(OBJECTIVES_KEY);
  }
  return defaults;
}

function saveObjectives(obj: ClientObjectives) {
  try {
    localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(obj));
  } catch (err) {
    console.error("Impossible de sauvegarder les objectifs:", err);
  }
}

// --- Main component ---

export function ClientDashboard() {
  const { profile } = useAuth();
  const prefix = useRoutePrefix();
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const [period, setPeriod] = useState<PeriodKey>("30d");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header + period selector + export */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground font-[family-name:var(--font-heading)]">
            {getGreeting()} {firstName} !
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d&apos;ensemble de ton activite
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <PeriodSelect value={period} onChange={setPeriod} />
          <ExportButton period={period} />
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={staggerItem}>
        <TopStatsSection period={period} />
      </motion.div>

      {/* Objectifs mensuels */}
      <motion.div variants={staggerItem}>
        <ObjectivesSection period={period} />
      </motion.div>

      {/* Premiers pas */}
      <motion.div variants={staggerItem}>
        <OnboardingChecklist />
      </motion.div>

      {/* Prochain call + Formation en cours */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <UpcomingCallWidget />
        <CourseProgressWidget prefix={prefix} />
      </motion.div>

      {/* Graphiques */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <ActivityBarChart />
        <InsightsDonutChart />
      </motion.div>
    </motion.div>
  );
}

// ===================================================================
// PERIOD SELECT
// ===================================================================

function PeriodSelect({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PERIOD_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
      >
        {current.label}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  opt.value === value
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===================================================================
// EXPORT BUTTON
// ===================================================================

function ExportButton({ period }: { period: PeriodKey }) {
  const [open, setOpen] = useState(false);

  const handleExport = useCallback(
    (format: "csv" | "pdf") => {
      setOpen(false);
      const periodLabel =
        PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

      if (format === "csv") {
        // Simple CSV export du dashboard
        const rows = [
          ["Metrique", "Valeur", "Periode"],
          ["Periode", periodLabel, ""],
          ["Export genere le", new Date().toLocaleDateString("fr-FR"), ""],
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dashboard-${period}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [period],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Exporter
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => handleExport("csv")}
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ===================================================================
// TOP STATS SECTION
// ===================================================================

function TopStatsSection({ period }: { period: PeriodKey }) {
  const { user } = useAuth();
  const clientId = user?.id;
  const { summary } = useXp();
  const { data: courses } = useCourses("published");
  const { data: lessonProgress } = useLessonProgress();
  const { activities } = useSetterActivities(
    clientId ? { clientId } : undefined,
  );
  const { closerCalls } = useCloserCalls(clientId);

  const periodStart = useMemo(() => getPeriodStartDate(period), [period]);

  // Formations completees
  const completedFormations = useMemo(() => {
    if (!courses || !lessonProgress) return 0;
    let count = 0;
    for (const course of courses) {
      const totalLessons =
        course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ??
        0;
      if (totalLessons === 0) continue;
      const completedLessons =
        course.modules?.reduce((acc, m) => {
          return (
            acc +
            (m.lessons?.filter((l) =>
              lessonProgress.some(
                (p) => p.lesson_id === l.id && p.status === "completed",
              ),
            ).length ?? 0)
          );
        }, 0) ?? 0;
      if (completedLessons >= totalLessons) count++;
    }
    return count;
  }, [courses, lessonProgress]);

  // DMs sur la periode
  const dmsPeriod = useMemo(() => {
    return activities
      .filter((a) => new Date(a.date) >= periodStart)
      .reduce((sum, a) => sum + (a.dms_sent ?? 0), 0);
  }, [activities, periodStart]);

  // Appels realises sur la periode
  const appelsRealises = useMemo(() => {
    return closerCalls.filter(
      (c) =>
        new Date(c.date) >= periodStart &&
        (c.status === "close" ||
          c.status === "perdu" ||
          c.status === "non_qualifie"),
    ).length;
  }, [closerCalls, periodStart]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Niveau"
        value={`${summary.level.level}`}
        subtitle={`${summary.level.name} · ${summary.totalXp} XP`}
        icon={Star}
        iconBg="bg-primary/8"
        iconColor="text-primary"
      />
      <StatCard
        title="Formations terminees"
        value={completedFormations}
        subtitle={`sur ${courses?.length ?? 0} disponible${(courses?.length ?? 0) !== 1 ? "s" : ""}`}
        icon={GraduationCap}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-600"
      />
      <StatCard
        title="DMs envoyes"
        value={dmsPeriod}
        subtitle="sur la periode"
        icon={MessageSquare}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-600"
      />
      <StatCard
        title="Appels realises"
        value={appelsRealises}
        subtitle="sur la periode"
        icon={PhoneCall}
        iconBg="bg-violet-500/10"
        iconColor="text-violet-600"
      />
    </div>
  );
}

// ===================================================================
// OBJECTIVES SECTION — barres de progression editables
// ===================================================================

function ObjectivesSection({ period }: { period: PeriodKey }) {
  const { user } = useAuth();
  const clientId = user?.id;
  const { activities } = useSetterActivities(
    clientId ? { clientId } : undefined,
  );
  const { closerCalls } = useCloserCalls(clientId);

  const [objectives, setObjectives] =
    useState<ClientObjectives>(loadObjectives);
  const [editingDms, setEditingDms] = useState(false);
  const [editingAppels, setEditingAppels] = useState(false);
  const [dmsInput, setDmsInput] = useState(String(objectives.dmsTarget));
  const [appelsInput, setAppelsInput] = useState(
    String(objectives.appelsTarget),
  );

  // Reload from localStorage on mount
  useEffect(() => {
    const obj = loadObjectives();
    setObjectives(obj);
    setDmsInput(String(obj.dmsTarget));
    setAppelsInput(String(obj.appelsTarget));
  }, []);

  // DMs ce mois-ci
  const dmsThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return activities
      .filter((a) => new Date(a.date) >= monthStart)
      .reduce((sum, a) => sum + (a.dms_sent ?? 0), 0);
  }, [activities]);

  // Appels realises ce mois-ci
  const appelsThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return closerCalls.filter(
      (c) =>
        new Date(c.date) >= monthStart &&
        (c.status === "close" ||
          c.status === "perdu" ||
          c.status === "non_qualifie"),
    ).length;
  }, [closerCalls]);

  const saveDmsTarget = () => {
    const val = Math.max(1, Number(dmsInput) || 1);
    const updated = { ...objectives, dmsTarget: val };
    setObjectives(updated);
    saveObjectives(updated);
    setDmsInput(String(val));
    setEditingDms(false);
  };

  const saveAppelsTarget = () => {
    const val = Math.max(1, Number(appelsInput) || 1);
    const updated = { ...objectives, appelsTarget: val };
    setObjectives(updated);
    saveObjectives(updated);
    setAppelsInput(String(val));
    setEditingAppels(false);
  };

  const dmsPercent = Math.min(
    100,
    Math.round((dmsThisMonth / objectives.dmsTarget) * 100),
  );
  const appelsPercent = Math.min(
    100,
    Math.round((appelsThisMonth / objectives.appelsTarget) * 100),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Objectif DMs */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="size-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Objectif mensuel DMs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                dmsPercent >= 100
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-primary/10 text-primary",
              )}
            >
              {dmsPercent}%
            </span>
            {editingDms ? (
              <button
                onClick={saveDmsTarget}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Check className="size-3.5 text-emerald-600" />
              </button>
            ) : (
              <button
                onClick={() => setEditingDms(true)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="h-2.5 bg-blue-500/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${dmsPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">
              {dmsThisMonth}
            </span>
            <span className="text-sm text-muted-foreground">
              /{" "}
              {editingDms ? (
                <input
                  type="number"
                  value={dmsInput}
                  onChange={(e) => setDmsInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveDmsTarget()}
                  className="w-16 h-6 px-1.5 text-sm border border-border rounded-md bg-surface text-foreground inline-block"
                  autoFocus
                  min={1}
                />
              ) : (
                objectives.dmsTarget
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Reste {Math.max(0, objectives.dmsTarget - dmsThisMonth)}
          </span>
        </div>
      </div>

      {/* Objectif Appels */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <PhoneCall className="size-3.5 text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Objectif mensuel appels
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                appelsPercent >= 100
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-primary/10 text-primary",
              )}
            >
              {appelsPercent}%
            </span>
            {editingAppels ? (
              <button
                onClick={saveAppelsTarget}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Check className="size-3.5 text-emerald-600" />
              </button>
            ) : (
              <button
                onClick={() => setEditingAppels(true)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="h-2.5 bg-violet-500/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${appelsPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">
              {appelsThisMonth}
            </span>
            <span className="text-sm text-muted-foreground">
              /{" "}
              {editingAppels ? (
                <input
                  type="number"
                  value={appelsInput}
                  onChange={(e) => setAppelsInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveAppelsTarget()}
                  className="w-16 h-6 px-1.5 text-sm border border-border rounded-md bg-surface text-foreground inline-block"
                  autoFocus
                  min={1}
                />
              ) : (
                objectives.appelsTarget
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Reste {Math.max(0, objectives.appelsTarget - appelsThisMonth)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// UPCOMING CALL WIDGET
// ===================================================================

function UpcomingCallWidget() {
  const { data: call, isLoading } = useNextClientCall();

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <CalendarClock className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Prochain call
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Aucun call planifié</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Contacte ton coach pour en programmer un
        </p>
      </div>
    );
  }

  const callDate = parseISO(call.date);
  const dateLabel = format(callDate, "EEEE d MMMM", { locale: fr });
  const [hours, minutes] = call.time.split(":");
  const timeLabel = `${hours}h${minutes === "00" ? "" : minutes}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <CalendarClock className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Prochain call
          </span>
        </div>
        {call.link && (
          <a
            href={call.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Rejoindre
          </a>
        )}
      </div>
      <p className="text-sm font-medium text-foreground capitalize">
        {call.title}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {dateLabel} · {timeLabel}
        {call.duration_minutes && (
          <span className="text-xs"> · {call.duration_minutes} min</span>
        )}
      </p>
    </div>
  );
}

// ===================================================================
// COURSE PROGRESS WIDGET
// ===================================================================

function CourseProgressWidget({ prefix }: { prefix: string }) {
  const { data: courses } = useCourses("published");
  const { data: lessonProgress } = useLessonProgress();

  const result = useMemo(() => {
    if (!courses || !lessonProgress) return null;

    const completedIds = new Set(
      lessonProgress
        .filter((p) => p.status === "completed")
        .map((p) => p.lesson_id),
    );

    // Formation en cours : au moins 1 leçon complétée, pas toutes
    let targetCourse = courses.find((course) => {
      const allLessons = course.modules?.flatMap((m) => m.lessons ?? []) ?? [];
      if (allLessons.length === 0) return false;
      const completedCount = allLessons.filter((l) =>
        completedIds.has(l.id),
      ).length;
      return completedCount > 0 && completedCount < allLessons.length;
    });

    // Fallback : première formation avec au moins une leçon non complétée
    if (!targetCourse) {
      targetCourse = courses.find((course) => {
        const allLessons =
          course.modules?.flatMap((m) => m.lessons ?? []) ?? [];
        return allLessons.some((l) => !completedIds.has(l.id));
      });
    }

    if (!targetCourse) return null;

    const allLessons =
      targetCourse.modules?.flatMap((m) => m.lessons ?? []) ?? [];
    const completedCount = allLessons.filter((l) =>
      completedIds.has(l.id),
    ).length;
    const total = allLessons.length;
    const progressPercent =
      total > 0 ? Math.round((completedCount / total) * 100) : 0;

    let nextLesson: { id: string; title: string } | null = null;
    let currentModule: { title: string } | null = null;

    for (const mod of targetCourse.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        if (!completedIds.has(lesson.id)) {
          nextLesson = lesson;
          currentModule = mod;
          break;
        }
      }
      if (nextLesson) break;
    }

    return {
      course: targetCourse,
      nextLesson,
      currentModule,
      completedCount,
      total,
      progressPercent,
    };
  }, [courses, lessonProgress]);

  if (!result) {
    if (courses && courses.length > 0 && lessonProgress) {
      return (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center">
              <BookOpen className="size-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Formation en cours
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Bravo, toutes tes formations sont terminées !
          </p>
        </div>
      );
    }
    return null;
  }

  const {
    course,
    nextLesson,
    currentModule,
    completedCount,
    total,
    progressPercent,
  } = result;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <BookOpen className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {course.title}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground shrink-0 ml-2">
          {completedCount}/{total} leçons
        </span>
      </div>

      <div className="h-1.5 bg-primary/8 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {currentModule && (
        <p className="text-xs text-muted-foreground mb-0.5">
          {currentModule.title}
        </p>
      )}
      {nextLesson && (
        <p className="text-sm font-medium text-foreground truncate">
          {nextLesson.title}
        </p>
      )}

      <Link
        href={
          nextLesson
            ? `${prefix}/school/${course.id}/${nextLesson.id}`
            : `${prefix}/school`
        }
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary hover:underline"
      >
        Reprendre
        <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}

// ===================================================================
// ACTIVITY BAR CHART
// ===================================================================

type ActivityView = "dms" | "relances" | "appels";

const ACTIVITY_VIEWS: { key: ActivityView; label: string }[] = [
  { key: "dms", label: "DMs" },
  { key: "relances", label: "Relances" },
  { key: "appels", label: "Appels bookés" },
];

function ActivityBarChart() {
  const { user } = useAuth();
  const { activities } = useSetterActivities(
    user?.id ? { clientId: user.id } : undefined,
  );
  const [view, setView] = useState<ActivityView>("dms");

  const data = useMemo(() => {
    if (!activities) return [];

    // Construire les 8 dernières semaines
    const weeks: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7 - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const label = `S${format(start, "d/M", { locale: fr })}`;
      weeks.push({ label, start, end });
    }

    return weeks.map(({ label, start, end }) => {
      const weekActivities = activities.filter((a) => {
        const d = new Date(a.date);
        return d >= start && d <= end;
      });
      const value = weekActivities.reduce((sum, a) => {
        if (view === "dms") return sum + (a.dms_sent ?? 0);
        if (view === "relances") return sum + (a.followups_sent ?? 0);
        return sum + (a.calls_booked ?? 0);
      }, 0);
      return { label, value };
    });
  }, [activities, view]);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">
          Activité hebdomadaire
        </span>
        <div className="flex items-center gap-1">
          {ACTIVITY_VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg transition-colors",
                view === v.key
                  ? "bg-primary text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={18}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={24}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===================================================================
// INSIGHTS DONUT CHART
// ===================================================================

type InsightView = "formations" | "appels";

const INSIGHT_VIEWS: { key: InsightView; label: string }[] = [
  { key: "formations", label: "Formations" },
  { key: "appels", label: "Appels closing" },
];

const DONUT_COLORS = ["#22c55e", "#f59e0b", "#e5e7eb"];
const CALL_STATUS_COLORS: Record<string, string> = {
  close: "#22c55e",
  non_qualifie: "#f59e0b",
  no_show: "#c6ff00",
  perdu: "#6b7280",
  pending: "#e5e7eb",
};
const CALL_STATUS_LABELS: Record<string, string> = {
  close: "Closé",
  non_qualifie: "Non qualifié",
  no_show: "No-show",
  perdu: "Perdu",
  pending: "En attente",
};

function InsightsDonutChart() {
  const { user } = useAuth();
  const { data: courses } = useCourses("published");
  const { data: lessonProgress } = useLessonProgress();
  const { closerCalls } = useCloserCalls(user?.id);
  const [view, setView] = useState<InsightView>("formations");

  const formationsData = useMemo(() => {
    if (!courses || !lessonProgress) return [];
    const completedIds = new Set(
      lessonProgress
        .filter((p) => p.status === "completed")
        .map((p) => p.lesson_id),
    );
    let completed = 0,
      inProgress = 0,
      notStarted = 0;
    for (const course of courses) {
      const lessons = course.modules?.flatMap((m) => m.lessons ?? []) ?? [];
      if (lessons.length === 0) continue;
      const done = lessons.filter((l) => completedIds.has(l.id)).length;
      if (done === lessons.length) completed++;
      else if (done > 0) inProgress++;
      else notStarted++;
    }
    return [
      { name: "Terminées", value: completed, color: DONUT_COLORS[0] },
      { name: "En cours", value: inProgress, color: DONUT_COLORS[1] },
      { name: "Non commencées", value: notStarted, color: DONUT_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [courses, lessonProgress]);

  const appelsData = useMemo(() => {
    if (!closerCalls) return [];
    const counts: Record<string, number> = {};
    for (const call of closerCalls) {
      const s = call.status ?? "pending";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts).map(([status, value]) => ({
      name: CALL_STATUS_LABELS[status] ?? status,
      value,
      color: CALL_STATUS_COLORS[status] ?? "#e5e7eb",
    }));
  }, [closerCalls]);

  const chartData = view === "formations" ? formationsData : appelsData;
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">
          Répartition
        </span>
        <div className="flex items-center gap-1">
          {INSIGHT_VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg transition-colors",
                view === v.key
                  ? "bg-primary text-white font-semibold"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Aucune donnée</p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <PieChart width={140} height={140}>
              <Pie
                data={chartData}
                cx={65}
                cy={65}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground">{total}</span>
              <span className="text-[10px] text-muted-foreground">total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {chartData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="size-2.5 rounded-full shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {entry.name}
                </span>
                <span className="text-xs font-semibold text-foreground shrink-0">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
