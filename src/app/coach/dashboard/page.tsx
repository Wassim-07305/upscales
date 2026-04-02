"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { CoachAlertsPanel } from "@/components/crm/coach-alerts-panel";
import { CoachUpcomingSessions } from "@/components/dashboard/coach-upcoming-sessions";
import { CoachInsightsCharts } from "@/components/dashboard/coach-insights-charts";
import { CoachStudentsList } from "@/components/dashboard/coach-students-list";
import { useStudents, getStudentDetail } from "@/hooks/use-students";
import { useCoachAlerts } from "@/hooks/use-coach-alerts";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  AlertTriangle,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

export default function CoachDashboardPage() {
  const { profile } = useAuth();
  const { students, isLoading: studentsLoading } = useStudents({ limit: 200 });
  const { isLoading: alertsLoading } = useCoachAlerts();

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const criticalCount = students.filter(
      (s) => getStudentDetail(s)?.flag === "red",
    ).length;
    const attentionCount = students.filter(
      (s) => getStudentDetail(s)?.flag === "yellow",
    ).length;
    const atRiskCount = students.filter(
      (s) => getStudentDetail(s)?.flag === "orange",
    ).length;

    return { totalStudents, criticalCount, attentionCount, atRiskCount };
  }, [students]);

  const isLoading = studentsLoading || alertsLoading;
  const firstName = profile?.full_name?.split(" ")[0] ?? "Coach";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Vue d&apos;ensemble de tes eleves et de ton activite
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-[14px] p-5 animate-pulse"
            >
              <div className="h-4 w-24 bg-zinc-100 rounded mb-4" />
              <div className="h-7 w-16 bg-zinc-100 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total eleves"
              value={stats.totalStudents}
              icon={Users}
            />
            <StatCard
              title="Critique"
              value={stats.criticalCount}
              icon={OctagonAlert}
              className={
                stats.criticalCount > 0 ? "border-lime-400/30 bg-lime-400/10" : ""
              }
            />
            <StatCard
              title="A risque"
              value={stats.atRiskCount}
              icon={AlertTriangle}
              className={
                stats.atRiskCount > 0
                  ? "border-orange-500/30 bg-orange-500/10"
                  : ""
              }
            />
            <StatCard
              title="Attention"
              value={stats.attentionCount}
              icon={TriangleAlert}
              className={
                stats.attentionCount > 0
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : ""
              }
            />
          </>
        )}
      </motion.div>

      {/* Sessions à venir */}
      <motion.div variants={staggerItem}>
        <CoachUpcomingSessions />
      </motion.div>

      {/* Graphiques insights */}
      <motion.div variants={staggerItem}>
        <CoachInsightsCharts />
      </motion.div>

      {/* Alertes */}
      <motion.div variants={staggerItem}>
        <CoachAlertsPanel />
      </motion.div>

      {/* Liste élèves fusionnée */}
      <motion.div variants={staggerItem}>
        <CoachStudentsList />
      </motion.div>
    </motion.div>
  );
}
