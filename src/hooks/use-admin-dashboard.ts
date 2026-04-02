"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";

export interface AdminDashboardData {
  // Revenue
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChange: number;
  cashCollected: number;
  cashInvoiced: number;
  averageLtv: number;
  revenueByQuarter: { quarter: string; revenue: number }[];
  revenueByMonth: { month: string; label: string; revenue: number }[];
  revenueByChannel: { channel: string; revenue: number; percent: number }[];

  // Students
  totalStudents: number;
  newStudentsThisMonth: number;
  churnedStudents: number;
  retentionRate: number;
  churnRate: number;

  // Sales
  globalClosingRate: number;
  contactsByStage: Record<string, number>;

  // Formations
  formationCompletionRate: number;

  // Engagement
  weeklyCheckins: number;

  // Alerts
  inactiveStudents: number;
  latePayments: number;
  atRiskStudents: number;

  // Leaderboard
  coachLeaderboard: {
    name: string;
    avatar: string | null;
    students: number;
    avgHealth: number;
  }[];
}

// ── Row types ──────────────────────────────────────

interface RevenueByMonthRow {
  month: string;
  label: string;
  revenue: number;
  collected: number;
}

interface RevenueByQuarterRow {
  quarter: string;
  revenue: number;
}

interface InvoiceTotalRow {
  total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface RevenueByChannelRow {
  channel: string;
  revenue: number;
}

interface CoachLeaderboardRow {
  id: string;
  name: string;
  avatar: string | null;
  students: number;
  avg_health: number;
  sessions_month: number;
  at_risk: number;
  score: number;
}

/* ─────────────────────────────────────────────
   Hook 1 — Revenue data
───────────────────────────────────────────── */
export function useRevenueStats(dateFrom?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-revenue", dateFrom],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const defaultFrom = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      ).toISOString();
      const invoiceDateFrom = dateFrom ?? defaultFrom;

      // Calculer le mois precedent pour la comparaison
      const fromDate = new Date(invoiceDateFrom);
      const now = new Date();
      const periodMs = now.getTime() - fromDate.getTime();
      const previousFrom = new Date(
        fromDate.getTime() - periodMs,
      ).toISOString();

      const [quarterlyRes, periodInvoicesRes, previousInvoicesRes] =
        await Promise.all([
          supabase
            .from("revenue_by_quarter")
            .select("*")
            .returns<RevenueByQuarterRow[]>(),
          // Toutes factures de la periode (excl. draft/cancelled)
          supabase
            .from("invoices")
            .select("total, status, created_at, paid_at")
            .not("status", "in", '("draft","cancelled")')
            .gte("created_at", invoiceDateFrom)
            .returns<InvoiceTotalRow[]>(),
          // Factures payees de la periode precedente (pour comparaison)
          supabase
            .from("invoices")
            .select("total, status, paid_at")
            .not("status", "in", '("draft","cancelled")')
            .gte("created_at", previousFrom)
            .lt("created_at", invoiceDateFrom)
            .returns<InvoiceTotalRow[]>(),
        ]);

      if (quarterlyRes.error) throw quarterlyRes.error;
      if (periodInvoicesRes.error) throw periodInvoicesRes.error;
      if (previousInvoicesRes.error) throw previousInvoicesRes.error;

      const periodInvoices = periodInvoicesRes.data ?? [];
      const previousInvoices = previousInvoicesRes.data ?? [];

      // CA periode = total factures emises (non-draft, non-cancelled) sur la periode
      const revenueThisMonth = periodInvoices.reduce(
        (sum, i) => sum + Number(i.total),
        0,
      );

      // CA periode precedente
      const revenueLastMonth = previousInvoices.reduce(
        (sum, i) => sum + Number(i.total),
        0,
      );

      // Variation en %
      const revenueChange =
        revenueLastMonth > 0
          ? Math.round(
              ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100,
            )
          : revenueThisMonth > 0
            ? 100
            : 0;

      // Cash collected = factures payees sur la periode (par paid_at)
      const paidInPeriod = periodInvoices.filter(
        (i) =>
          i.status === "paid" && i.paid_at && new Date(i.paid_at) >= fromDate,
      );
      const cashCollected = paidInPeriod.reduce(
        (sum, i) => sum + Number(i.total),
        0,
      );

      // Cash invoiced = CA periode (toutes factures emises)
      const cashInvoiced = revenueThisMonth;

      // Revenue by month — 2 courbes : facture (toutes) + encaisse (paid)
      const invoicedByMonth = new Map<string, number>();
      const collectedByMonth = new Map<string, number>();
      for (const inv of periodInvoices) {
        const d = new Date(inv.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        invoicedByMonth.set(
          key,
          (invoicedByMonth.get(key) ?? 0) + Number(inv.total),
        );
        if (inv.status === "paid") {
          collectedByMonth.set(
            key,
            (collectedByMonth.get(key) ?? 0) + Number(inv.total),
          );
        }
      }
      const monthsDiff = Math.max(
        1,
        (now.getFullYear() - fromDate.getFullYear()) * 12 +
          now.getMonth() -
          fromDate.getMonth(),
      );
      const revenueByMonth: RevenueByMonthRow[] = [];
      for (let i = Math.min(monthsDiff, 12); i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        if (d < fromDate) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        revenueByMonth.push({
          month: key,
          label: d.toLocaleDateString("fr-FR", { month: "short" }),
          revenue: invoicedByMonth.get(key) ?? 0,
          collected: collectedByMonth.get(key) ?? 0,
        });
      }

      // Revenue by quarter
      const revenueByQuarter = (quarterlyRes.data ?? []).map((row) => ({
        quarter: row.quarter,
        revenue: Number(row.revenue ?? 0),
      }));

      return {
        revenueThisMonth,
        revenueLastMonth,
        revenueChange,
        cashCollected,
        cashInvoiced,
        revenueByMonth,
        revenueByQuarter,
      };
    },
  });
}

/* ─────────────────────────────────────────────
   Hook 2 — Student stats (with date filter)
───────────────────────────────────────────── */
export function useStudentStats(dateFrom?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-students", dateFrom],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [
        totalStudentsRes,
        newStudentsRes,
        atRiskRes,
        contractsRes,
        studentDetailsRes,
        paidInvoicesRes,
      ] = await Promise.all([
        // Total eleves actifs (clients non-archives)
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "client")
          .or("is_archived.is.null,is_archived.eq.false"),
        // Nouveaux sur la periode
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "client")
          .or("is_archived.is.null,is_archived.eq.false")
          .gte(
            "created_at",
            dateFrom ??
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
              ).toISOString(),
          ),
        // A risque (flag orange ou red)
        supabase
          .from("student_details")
          .select("id", { count: "exact", head: true })
          .in("flag", ["orange", "red"]),
        // Contrats signes (pour LTV = montant contracte)
        supabase
          .from("contracts")
          .select("client_id, amount")
          .eq("status", "signed")
          .returns<{ client_id: string; amount: number | null }[]>(),
        // Student details (pour acquisition source → CA par canal)
        supabase
          .from("student_details")
          .select("profile_id, acquisition_source")
          .returns<
            { profile_id: string; acquisition_source: string | null }[]
          >(),
        // Factures payees (pour LTV = somme des factures par client)
        supabase
          .from("invoices")
          .select("client_id, total")
          .eq("status", "paid")
          .returns<{ client_id: string; total: number }[]>(),
      ]);

      if (totalStudentsRes.error) throw totalStudentsRes.error;
      if (newStudentsRes.error) throw newStudentsRes.error;
      if (atRiskRes.error) throw atRiskRes.error;
      if (contractsRes.error) throw contractsRes.error;
      if (studentDetailsRes.error) throw studentDetailsRes.error;
      if (paidInvoicesRes.error) throw paidInvoicesRes.error;

      const totalStudents = totalStudentsRes.count ?? 0;
      const newStudents = newStudentsRes.count ?? 0;
      const atRiskStudents = atRiskRes.count ?? 0;

      // LTV moyen = somme des factures payees par client
      const ltvByClient = new Map<string, number>();
      for (const inv of paidInvoicesRes.data ?? []) {
        if (!inv.total) continue;
        const prev = ltvByClient.get(inv.client_id) ?? 0;
        ltvByClient.set(inv.client_id, prev + Number(inv.total));
      }
      // Fallback sur les contrats si pas de factures
      if (ltvByClient.size === 0) {
        for (const c of contractsRes.data ?? []) {
          if (!c.amount) continue;
          const prev = ltvByClient.get(c.client_id) ?? 0;
          ltvByClient.set(c.client_id, prev + Number(c.amount));
        }
      }
      const ltvValues = Array.from(ltvByClient.values());
      const averageLtv =
        ltvValues.length > 0
          ? Math.round(ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length)
          : 0;

      // Retention
      const churnedStudents = 0;
      const retentionRate =
        totalStudents > 0
          ? Math.round(
              ((totalStudents - churnedStudents) / totalStudents) * 100,
            )
          : 100;

      // CA par canal = montant contracte par source d'acquisition
      const sourceMap = new Map<string, string>();
      for (const sd of studentDetailsRes.data ?? []) {
        if (sd.acquisition_source) {
          sourceMap.set(sd.profile_id, sd.acquisition_source);
        }
      }
      const caByChannel = new Map<string, number>();
      for (const [clientId, total] of ltvByClient) {
        const src = sourceMap.get(clientId) ?? "autre";
        caByChannel.set(src, (caByChannel.get(src) ?? 0) + total);
      }
      const totalChannelRevenue = [...caByChannel.values()].reduce(
        (s, v) => s + v,
        0,
      );
      const revenueByChannel = [...caByChannel.entries()]
        .map(([channel, revenue]) => ({
          channel: channel.charAt(0).toUpperCase() + channel.slice(1),
          revenue,
          percent:
            totalChannelRevenue > 0
              ? Math.round((revenue / totalChannelRevenue) * 100)
              : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        totalStudents,
        newStudentsThisMonth: newStudents,
        churnedStudents,
        retentionRate,
        churnRate: 100 - retentionRate,
        atRiskStudents,
        inactiveStudents: 0,
        averageLtv,
        revenueByChannel,
      };
    },
  });
}

/* ─────────────────────────────────────────────
   Hook 3 — Sales pipeline (with date filter)
───────────────────────────────────────────── */
export function useSalesStats(dateFrom?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-sales", dateFrom],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Contacts par stage (pour le funnel)
      let contactsQuery = supabase.from("crm_contacts").select("stage");
      if (dateFrom) {
        contactsQuery = contactsQuery.gte("created_at", dateFrom);
      }
      const { data: contactsData, error: contactsError } =
        await contactsQuery.returns<{ stage: string }[]>();
      if (contactsError) throw contactsError;

      const contactsByStage: Record<string, number> = {};
      for (const row of contactsData ?? []) {
        contactsByStage[row.stage] = (contactsByStage[row.stage] ?? 0) + 1;
      }

      // Taux de closing base sur les closer_calls admin uniquement (pas ceux des clients)
      let callsQuery = supabase
        .from("closer_calls")
        .select("status")
        .is("client_id", null);
      if (dateFrom) {
        callsQuery = callsQuery.gte("created_at", dateFrom);
      }
      const { data: callsData, error: callsError } =
        await callsQuery.returns<{ status: string }[]>();
      if (callsError) throw callsError;

      const closedCalls =
        callsData?.filter((c) => c.status === "close").length ?? 0;
      const perdus = callsData?.filter((c) => c.status === "perdu").length ?? 0;
      const nonQualifies =
        callsData?.filter((c) => c.status === "non_qualifie").length ?? 0;
      // Appels realises = close + perdu + non_qualifie (meme calcul que la page Appels)
      const realises = closedCalls + perdus + nonQualifies;
      const globalClosingRate =
        realises > 0 ? Math.round((closedCalls / realises) * 100 * 10) / 10 : 0;

      return { globalClosingRate, contactsByStage };
    },
  });
}

/* ─────────────────────────────────────────────
   Hook 4 — Engagement (with date filter)
───────────────────────────────────────────── */
export function useEngagementStats(dateFrom?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-engagement", dateFrom],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Recuperer : total lecons, completions par etudiant, total etudiants, checkins
      const [lessonsRes, progressRes, studentsRes, checkinsRes] =
        await Promise.all([
          supabase.from("lessons").select("id", { count: "exact", head: true }),
          supabase
            .from("lesson_progress")
            .select("student_id, status")
            .eq("status", "completed"),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .in("role", ["client", "prospect"]),
          supabase
            .from("daily_checkins")
            .select("id", { count: "exact", head: true })
            .gte(
              "created_at",
              dateFrom ??
                new Date(new Date().getTime() - 7 * 86400000).toISOString(),
            ),
        ]);

      if (lessonsRes.error) throw lessonsRes.error;
      if (progressRes.error) throw progressRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (checkinsRes.error) throw checkinsRes.error;

      const totalLessons = lessonsRes.count ?? 0;
      const totalStudents = studentsRes.count ?? 0;

      // Calcul du taux moyen de completion par etudiant
      let formationCompletionRate = 0;
      if (totalLessons > 0 && totalStudents > 0) {
        const completions = progressRes.data ?? [];
        // Grouper par etudiant
        const byStudent = new Map<string, number>();
        for (const row of completions) {
          const sid = (row as { student_id: string }).student_id;
          byStudent.set(sid, (byStudent.get(sid) ?? 0) + 1);
        }
        // Moyenne : somme des taux individuels / nombre total d'etudiants
        let sumRates = 0;
        for (const count of byStudent.values()) {
          sumRates += count / totalLessons;
        }
        // Les etudiants sans completion comptent comme 0%
        formationCompletionRate = Math.round((sumRates / totalStudents) * 100);
      }

      return {
        formationCompletionRate,
        weeklyCheckins: checkinsRes.count ?? 0,
      };
    },
  });
}

/* ─────────────────────────────────────────────
   Hook 5 — Coach leaderboard + alerts
───────────────────────────────────────────── */
export function useCoachLeaderboard(dateFrom?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-coaches", dateFrom],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [coachesRes, latePaymentsRes] = await Promise.all([
        supabase
          .from("coach_leaderboard")
          .select("*")
          .returns<CoachLeaderboardRow[]>(),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "overdue"),
      ]);

      if (coachesRes.error) throw coachesRes.error;
      if (latePaymentsRes.error) throw latePaymentsRes.error;

      const coachLeaderboard = (coachesRes.data ?? [])
        .map((coach) => ({
          id: coach.id,
          name: coach.name,
          avatar: coach.avatar,
          students: coach.students ?? 0,
          avgHealth: coach.avg_health ?? 0,
          sessionsMonth: coach.sessions_month ?? 0,
          atRisk: coach.at_risk ?? 0,
          score: coach.score ?? 0,
        }))
        .sort((a, b) => b.score - a.score || b.students - a.students);

      return {
        coachLeaderboard,
        latePayments: latePaymentsRes.count ?? 0,
      };
    },
  });
}

/* ─────────────────────────────────────────────
   Backward-compatible aggregate hook
───────────────────────────────────────────── */
export function useAdminDashboard() {
  const revenue = useRevenueStats();
  const students = useStudentStats();
  const sales = useSalesStats();
  const engagement = useEngagementStats();
  const coaches = useCoachLeaderboard();

  const isLoading =
    revenue.isLoading ||
    students.isLoading ||
    sales.isLoading ||
    engagement.isLoading ||
    coaches.isLoading;

  const data =
    revenue.data &&
    students.data &&
    sales.data &&
    engagement.data &&
    coaches.data
      ? {
          ...revenue.data,
          ...students.data,
          ...sales.data,
          ...engagement.data,
          ...coaches.data,
        }
      : undefined;

  return {
    data,
    isLoading,
    revenue,
    students,
    sales,
    engagement,
    coaches,
  };
}
