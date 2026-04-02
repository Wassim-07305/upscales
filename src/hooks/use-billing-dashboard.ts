"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import {
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  startOfYear,
  format,
  isWithinInterval,
  addMonths,
} from "date-fns";
import { fr } from "date-fns/locale";

// ─── Period types ──────────────────────────

export type PeriodKey =
  | "7d"
  | "14d"
  | "30d"
  | "this-month"
  | "last-month"
  | "3m"
  | "this-year"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "30d", label: "30 derniers jours" },
  { value: "7d", label: "7 derniers jours" },
  { value: "14d", label: "14 derniers jours" },
  { value: "this-month", label: "Ce mois-ci" },
  { value: "last-month", label: "Mois dernier" },
  { value: "3m", label: "3 derniers mois" },
  { value: "this-year", label: "Cette année" },
  { value: "custom", label: "Mois personnalisé" },
];

export function getDateRange(
  period: PeriodKey,
  customMonth?: number,
  customYear?: number,
): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "14d":
      return { from: subDays(now, 14), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "this-month":
      return { from: startOfMonth(now), to: now };
    case "last-month": {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    case "3m":
      return { from: subMonths(now, 3), to: now };
    case "this-year":
      return { from: startOfYear(now), to: now };
    case "custom": {
      const m = customMonth ?? now.getMonth();
      const y = customYear ?? now.getFullYear();
      const d = new Date(y, m, 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    }
  }
}

// ─── Data types ────────────────────────────

interface InvoiceRow {
  id: string;
  status: string;
  total: number;
  client_id: string;
  created_at: string;
  paid_at: string | null;
  due_date: string | null;
  client: { id: string; full_name: string } | null;
  contract: { id: string; title: string } | null;
}

interface StudentDetailRow {
  profile_id: string;
  acquisition_source: string | null;
}

interface UpsellOppRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface ContractRow {
  id: string;
  client_id: string;
  amount: number | null;
  status: string;
  title: string;
  client: { id: string; full_name: string } | null;
}

interface ScheduleRow {
  id: string;
  client_id: string;
  total_amount: number;
  installment_details: InstallmentDetail[];
  contract: { id: string; title: string } | null;
  client: { id: string; full_name: string } | null;
}

interface InstallmentDetail {
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  paid_at?: string;
  comment?: string;
}

// ─── LTV par client ────────────────────────

export interface ClientLTV {
  clientId: string;
  clientName: string;
  caTotal: number;
  sources: string[];
}

// ─── Chart data ────────────────────────────

export interface ChartMonth {
  month: string;
  facture: number;
  collecte: number;
}

// ─── Installment pour paiements à venir ────

export interface UpcomingInstallment {
  scheduleId: string;
  clientName: string;
  offerTitle: string;
  dueDate: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  comment?: string;
}

// ─── Forecast ──────────────────────────────

export interface ForecastMonth {
  month: string;
  count: number;
  total: number;
}

// ─── Payment detail row ────────────────────

export interface PaymentDetailRow {
  clientName: string;
  offerTitle: string;
  totalAmount: number;
  encaisse: number;
  restant: number;
  status: string;
}

// ─── Hook ──────────────────────────────────

export function useBillingDashboard(
  period: PeriodKey,
  customMonth?: number,
  customYear?: number,
) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const sb = supabase as any;

  const { from, to } = useMemo(
    () => getDateRange(period, customMonth, customYear),
    [period, customMonth, customYear],
  );

  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  return useQuery({
    queryKey: ["billing-dashboard", period, customMonth, customYear],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      // Fetch all data in parallel
      const [
        invoicesRes,
        allInvoicesRes,
        studentDetailsRes,
        upsellRes,
        schedulesRes,
        contractsRes,
      ] = await Promise.all([
        // Period invoices (non-draft, non-cancelled)
        sb
          .from("invoices")
          .select(
            "id, status, total, client_id, created_at, paid_at, due_date, client:profiles!invoices_client_id_fkey(id, full_name), contract:contracts(id, title)",
          )
          .not("status", "in", '("draft","cancelled")')
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .order("created_at", { ascending: false }),

        // All paid invoices (for LTV, all time)
        sb
          .from("invoices")
          .select(
            "id, status, total, client_id, created_at, paid_at, client:profiles!invoices_client_id_fkey(id, full_name)",
          )
          .eq("status", "paid"),

        // Student details (for acquisition source)
        sb.from("student_details").select("profile_id, acquisition_source"),

        // Upsell opportunities in period
        sb
          .from("upsell_opportunities")
          .select("id, amount, status, created_at")
          .eq("status", "accepted")
          .gte("created_at", fromISO)
          .lte("created_at", toISO),

        // Payment schedules
        sb
          .from("payment_schedules")
          .select(
            "id, client_id, total_amount, installment_details, contract:contracts(id, title), client:profiles!payment_schedules_client_id_fkey(id, full_name)",
          ),

        // All signed contracts (for LTV = montant contracté)
        sb
          .from("contracts")
          .select(
            "id, client_id, amount, status, title, client:profiles!contracts_client_id_fkey(id, full_name)",
          )
          .eq("status", "signed"),
      ]);

      const periodInvoices: InvoiceRow[] = invoicesRes.data ?? [];
      const allPaidInvoices: InvoiceRow[] = allInvoicesRes.data ?? [];
      const studentDetails: StudentDetailRow[] = studentDetailsRes.data ?? [];
      const upsellOpps: UpsellOppRow[] = upsellRes.data ?? [];
      const schedules: ScheduleRow[] = schedulesRes.data ?? [];
      const signedContracts: ContractRow[] = contractsRes.data ?? [];

      // ── 8 KPIs ──────────────────────────────

      const caPeriode = periodInvoices.reduce(
        (s, i) => s + Number(i.total ?? 0),
        0,
      );

      const paidInPeriod = periodInvoices.filter((i) => i.status === "paid");
      const encaisse = paidInPeriod.reduce(
        (s, i) => s + Number(i.total ?? 0),
        0,
      );

      const restant = caPeriode - encaisse;

      const panierMoyen =
        paidInPeriod.length > 0
          ? Math.round(encaisse / paidInPeriod.length)
          : 0;

      const overdueInvoices = periodInvoices.filter(
        (i) => i.status === "overdue",
      );
      const retardsCount = overdueInvoices.length;
      const retardsMontant = overdueInvoices.reduce(
        (s, i) => s + Number(i.total ?? 0),
        0,
      );

      const tauxRecouvrement =
        caPeriode > 0 ? Math.round((encaisse / caPeriode) * 100) : 0;

      // LTV = somme des factures payees par client
      const ltvByClientMap = new Map<string, { name: string; total: number }>();

      // D'abord les factures payees (source de verite)
      for (const inv of allPaidInvoices.filter((i) => i.status === "paid")) {
        const clientId = inv.client_id;
        if (!clientId) continue;
        const existing = ltvByClientMap.get(clientId) ?? {
          name: "",
          total: 0,
        };
        existing.total += Number(inv.total ?? 0);
        ltvByClientMap.set(clientId, existing);
      }

      // Fallback sur les contrats signes si pas de factures
      if (ltvByClientMap.size === 0) {
        for (const c of signedContracts) {
          if (!c.amount) continue;
          const existing = ltvByClientMap.get(c.client_id) ?? {
            name: c.client?.full_name ?? "—",
            total: 0,
          };
          existing.total += Number(c.amount);
          ltvByClientMap.set(c.client_id, existing);
        }
      }

      // Enrichir les noms depuis les contrats
      for (const c of signedContracts) {
        const entry = ltvByClientMap.get(c.client_id);
        if (entry && !entry.name) {
          entry.name = c.client?.full_name ?? "—";
        }
      }

      const ltvMoyenne =
        ltvByClientMap.size > 0
          ? Math.round(
              [...ltvByClientMap.values()].reduce((s, c) => s + c.total, 0) /
                ltvByClientMap.size,
            )
          : 0;

      const revenueUpsell = upsellOpps.reduce(
        (s, o) => s + Number(o.amount ?? 0),
        0,
      );

      // ── LTV par client ──────────────────────

      const sourceMap = new Map<string, string>();
      for (const sd of studentDetails) {
        if (sd.acquisition_source) {
          sourceMap.set(sd.profile_id, sd.acquisition_source);
        }
      }

      const ltvByClient: ClientLTV[] = [...ltvByClientMap.entries()]
        .map(([clientId, { name, total }]) => ({
          clientId,
          clientName: name,
          caTotal: total,
          sources: sourceMap.has(clientId) ? [sourceMap.get(clientId)!] : [],
        }))
        .sort((a, b) => b.caTotal - a.caTotal);

      // ── CA par source d'acquisition ─────────

      const caBySourceMap = new Map<string, number>();
      for (const ltv of ltvByClient) {
        const src = ltv.sources[0] ?? "non renseigne";
        caBySourceMap.set(src, (caBySourceMap.get(src) ?? 0) + ltv.caTotal);
      }
      const caBySource = [...caBySourceMap.entries()]
        .map(([source, ca]) => ({ source, ca }))
        .sort((a, b) => b.ca - a.ca);

      // ── CA facturé vs collecté (3 derniers mois) ──

      const now = new Date();
      const chartData: ChartMonth[] = [];
      for (let i = 2; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const label = format(monthDate, "MMM yyyy", { locale: fr });

        const facture = allPaidInvoices
          .concat(periodInvoices.filter((inv) => inv.status !== "paid"))
          .filter((inv) => {
            const d = new Date(inv.created_at);
            return isWithinInterval(d, { start: mStart, end: mEnd });
          })
          .reduce((s, i) => s + Number(i.total ?? 0), 0);

        const collecte = allPaidInvoices
          .filter((inv) => {
            const d = new Date(inv.paid_at ?? inv.created_at);
            return isWithinInterval(d, { start: mStart, end: mEnd });
          })
          .reduce((s, i) => s + Number(i.total ?? 0), 0);

        chartData.push({ month: label, facture, collecte });
      }

      // ── Détail des paiements ────────────────

      const paymentDetails: PaymentDetailRow[] = schedules.map((s) => {
        const installments = (s.installment_details ??
          []) as InstallmentDetail[];
        const totalPaid = installments
          .filter((inst) => inst.status === "paid")
          .reduce((sum, inst) => sum + Number(inst.amount ?? 0), 0);
        const totalDue = installments.reduce(
          (sum, inst) => sum + Number(inst.amount ?? 0),
          0,
        );
        const allPaid = installments.every((inst) => inst.status === "paid");
        const hasOverdue = installments.some(
          (inst) => inst.status === "overdue",
        );

        return {
          clientName: s.client?.full_name ?? "—",
          offerTitle: s.contract?.title ?? "—",
          totalAmount: totalDue,
          encaisse: totalPaid,
          restant: totalDue - totalPaid,
          status: allPaid ? "Payé" : hasOverdue ? "En retard" : "En cours",
        };
      });

      // ── Paiements à venir (mois courant) ────

      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const upcomingInstallments: UpcomingInstallment[] = [];

      for (const s of schedules) {
        const installments = (s.installment_details ??
          []) as InstallmentDetail[];
        for (const inst of installments) {
          if (!inst.due_date) continue;
          const d = new Date(inst.due_date);
          if (
            isWithinInterval(d, {
              start: currentMonthStart,
              end: currentMonthEnd,
            })
          ) {
            upcomingInstallments.push({
              scheduleId: s.id,
              clientName: s.client?.full_name ?? "—",
              offerTitle: s.contract?.title ?? "—",
              dueDate: inst.due_date,
              amount: Number(inst.amount ?? 0),
              status: inst.status,
              comment: inst.comment,
            });
          }
        }
      }

      // Monthly summary for upcoming
      const upcomingExpected = upcomingInstallments
        .filter((i) => i.status === "pending")
        .reduce((s, i) => s + i.amount, 0);
      const upcomingOverdue = upcomingInstallments
        .filter((i) => i.status === "overdue")
        .reduce((s, i) => s + i.amount, 0);
      const upcomingPaid = upcomingInstallments
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0);
      const upcomingExpectedCount = upcomingInstallments.filter(
        (i) => i.status === "pending",
      ).length;
      const upcomingOverdueCount = upcomingInstallments.filter(
        (i) => i.status === "overdue",
      ).length;
      const upcomingPaidCount = upcomingInstallments.filter(
        (i) => i.status === "paid",
      ).length;

      // ── Prévisionnel 6 mois ─────────────────

      const forecast: ForecastMonth[] = [];
      for (let i = 0; i < 6; i++) {
        const monthDate = addMonths(now, i);
        const mStart = startOfMonth(monthDate);
        const mEnd = endOfMonth(monthDate);
        const label = format(monthDate, "MMM yyyy", { locale: fr });
        let count = 0;
        let total = 0;

        for (const s of schedules) {
          const installments = (s.installment_details ??
            []) as InstallmentDetail[];
          for (const inst of installments) {
            if (!inst.due_date || inst.status === "paid") continue;
            const d = new Date(inst.due_date);
            if (isWithinInterval(d, { start: mStart, end: mEnd })) {
              count++;
              total += Number(inst.amount ?? 0);
            }
          }
        }

        forecast.push({ month: label, count, total });
      }

      return {
        // KPIs
        caPeriode,
        encaisse,
        restant,
        panierMoyen,
        retardsCount,
        retardsMontant,
        tauxRecouvrement,
        ltvMoyenne,
        revenueUpsell,
        // Details
        ltvByClient,
        caBySource,
        chartData,
        paymentDetails,
        upcomingInstallments,
        upcomingExpected,
        upcomingExpectedCount,
        upcomingOverdue,
        upcomingOverdueCount,
        upcomingPaid,
        upcomingPaidCount,
        forecast,
      };
    },
  });
}
