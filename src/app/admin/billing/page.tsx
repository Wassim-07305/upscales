"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { useContracts } from "@/hooks/use-contracts";
import { useInvoices } from "@/hooks/use-invoices";
import {
  usePaymentReminders,
  REMINDER_LABELS,
} from "@/hooks/use-payment-reminders";
import {
  CreditCard,
  FileText,
  Receipt,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
  Bell,
  MailCheck,
  Table,
  DollarSign,
  Users,
  Settings,
  Save,
  Loader2,
  Plus,
  TrendingUp,
  Target,
  Percent,
  Heart,
  Zap,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { CommissionTable } from "@/components/billing/commission-table";
import { useCommissions } from "@/hooks/use-commissions";
import {
  useCommissionRules,
  type CommissionRule,
} from "@/hooks/use-commission-rules";
import { PageTransition } from "@/components/ui/page-transition";
import { RelanceSequencesView } from "@/components/crm/relance-sequences-view";
import { UpsellRulesManager } from "@/components/admin/upsell-rules-manager";
import { UpsellDashboard } from "@/components/upsell/upsell-dashboard";
import {
  useBillingDashboard,
  PERIOD_OPTIONS,
  type PeriodKey,
} from "@/hooks/use-billing-dashboard";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ContractsPage = dynamic(
  () => import("@/app/admin/billing/contracts/page"),
  { ssr: false },
);

const InvoicesPage = dynamic(
  () => import("@/app/admin/billing/invoices/page"),
  { ssr: false },
);

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSupabase } from "@/hooks/use-supabase";
import { useEffect } from "react";

function formatEUR(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const PIE_COLORS = [
  "#c6ff00",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#52525b",
  "#3f3f46",
];

// ─── Source labels ──────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  referral: "Recommandation",
  ads: "Publicité",
  autre: "Autre",
  "non renseigne": "Non renseigné",
};

// ─── Main Page ─────────────────────────────

type BillingTab =
  | "revenus"
  | "paiements"
  | "contrats"
  | "factures"
  | "commissions"
  | "upsell";

const BILLING_TABS: { key: BillingTab; label: string }[] = [
  { key: "revenus", label: "Revenus" },
  { key: "paiements", label: "Paiements" },
  { key: "contrats", label: "Contrats" },
  { key: "factures", label: "Factures" },
  { key: "commissions", label: "Commissions" },
  { key: "upsell", label: "Upsell" },
];

export default function BillingOverviewPage() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<BillingTab>("revenus");
  const [chartMode, setChartMode] = useState<"bar" | "area">("bar");
  const [sourceMode, setSourceMode] = useState<"bar" | "pie">("bar");

  const { data, isLoading: dashLoading } = useBillingDashboard(
    period,
    customMonth,
    customYear,
  );

  const { contracts, isLoading: contractsLoading } = useContracts({ limit: 5 });
  const { invoices, isLoading: invoicesLoading } = useInvoices({ limit: 5 });
  const { pendingReminders, upcomingReminders, markAsSent } =
    usePaymentReminders();

  const isLoading = dashLoading || contractsLoading || invoicesLoading;

  // Month options for custom period
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2026, i, 1), "MMMM", { locale: fr }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - 2 + i;
    return { value: y, label: String(y) };
  });

  return (
    <PageTransition>
      <motion.div
        key={activeTab}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-[family-name:var(--font-heading)] font-bold text-foreground tracking-tight">
              Finances
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
              Vue d&apos;ensemble des revenus, paiements et encaissements
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Period filter */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="h-9 px-3 rounded-xl border border-border bg-surface text-sm font-medium text-foreground cursor-pointer"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Custom month/year selectors */}
            {period === "custom" && (
              <>
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-border bg-surface text-sm text-foreground cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-border bg-surface text-sm text-foreground cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </>
            )}

            <ExportDropdown
              disabled={isLoading}
              options={[
                {
                  label: "Rapport PDF",
                  icon: FileText,
                  onClick: () => {
                    exportToPDF({
                      title: "Rapport Finances",
                      subtitle: "Vue d'ensemble",
                      sections: [
                        {
                          title: "KPIs",
                          rows: [
                            {
                              label: "CA période",
                              value: formatEUR(data?.caPeriode ?? 0),
                            },
                            {
                              label: "Encaissé",
                              value: formatEUR(data?.encaisse ?? 0),
                            },
                            {
                              label: "Restant",
                              value: formatEUR(data?.restant ?? 0),
                            },
                            {
                              label: "Taux recouvrement",
                              value: `${data?.tauxRecouvrement ?? 0}%`,
                            },
                          ],
                        },
                      ],
                    });
                  },
                },
                {
                  label: "Factures CSV",
                  icon: Table,
                  onClick: () => {
                    exportToCSV(
                      invoices.map((inv) => ({
                        numéro: inv.invoice_number,
                        client: inv.client?.full_name ?? "",
                        total: inv.total,
                        statut: inv.status,
                        echeance: inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString("fr-FR")
                          : "",
                        paye_le: inv.paid_at
                          ? new Date(inv.paid_at).toLocaleDateString("fr-FR")
                          : "",
                      })),
                      [
                        { key: "numéro", label: "Numéro" },
                        { key: "client", label: "Client" },
                        { key: "total", label: "Total (EUR)" },
                        { key: "statut", label: "Statut" },
                        { key: "echeance", label: "Echeance" },
                        { key: "paye_le", label: "Paye le" },
                      ],
                      "factures-export",
                    );
                  },
                },
              ]}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeInUp} transition={defaultTransition}>
          <div className="flex items-center gap-0 border-b border-border">
            {BILLING_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "h-10 px-4 text-sm font-medium transition-all relative",
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══ Tab: Revenus ═══ */}
        {activeTab === "revenus" && (
          <>
            {/* 8 KPI Cards */}
            <motion.div
              variants={fadeInUp}
              transition={defaultTransition}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <KpiCard
                icon={TrendingUp}
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10 ring-blue-500/20"
                label="CA période"
                value={formatEUR(data?.caPeriode ?? 0)}
                loading={dashLoading}
              />
              <KpiCard
                icon={CheckCircle}
                iconColor="text-emerald-500"
                iconBg="bg-emerald-500/10 ring-emerald-500/20"
                label="Encaissé"
                value={formatEUR(data?.encaisse ?? 0)}
                loading={dashLoading}
              />
              <KpiCard
                icon={Clock}
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10 ring-amber-500/20"
                label="Restant"
                value={formatEUR(data?.restant ?? 0)}
                loading={dashLoading}
              />
              <KpiCard
                icon={Target}
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10 ring-purple-500/20"
                label="Panier moyen"
                value={formatEUR(data?.panierMoyen ?? 0)}
                loading={dashLoading}
              />
              <KpiCard
                icon={AlertTriangle}
                iconColor="text-lime-400"
                iconBg="bg-lime-400/10 ring-lime-400/20"
                label="En retard"
                value={String(data?.retardsCount ?? 0)}
                subtitle={
                  data?.retardsMontant
                    ? formatEUR(data.retardsMontant)
                    : undefined
                }
                loading={dashLoading}
              />
              <KpiCard
                icon={Percent}
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10 ring-indigo-500/20"
                label="Recouvrement"
                value={`${data?.tauxRecouvrement ?? 0}%`}
                subtitle={`${formatEUR(data?.encaisse ?? 0)} / ${formatEUR(data?.caPeriode ?? 0)}`}
                loading={dashLoading}
              />
              <KpiCard
                icon={Heart}
                iconColor="text-pink-500"
                iconBg="bg-pink-500/10 ring-pink-500/20"
                label="LTV moyenne"
                value={formatEUR(data?.ltvMoyenne ?? 0)}
                subtitle="Valeur vie client (tous clients)"
                loading={dashLoading}
              />
              <KpiCard
                icon={Zap}
                iconColor="text-orange-500"
                iconBg="bg-orange-500/10 ring-orange-500/20"
                label="Revenu Upsell"
                value={formatEUR(data?.revenueUpsell ?? 0)}
                subtitle="CA des ventes additionnelles"
                loading={dashLoading}
              />
            </motion.div>

            {/* LTV par client */}
            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Détail LTV par client
                  </h3>
                </div>
                {dashLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : (data?.ltvByClient ?? []).length === 0 ? (
                  <EmptyState icon={Users} text="Aucun client avec CA" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs">
                          <th className="text-left px-5 py-2.5 font-medium">
                            Client
                          </th>
                          <th className="text-right px-5 py-2.5 font-medium">
                            CA total
                          </th>
                          <th className="text-left px-5 py-2.5 font-medium">
                            Sources
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.ltvByClient ?? []).map((c) => (
                          <tr
                            key={c.clientId}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium text-foreground">
                              {c.clientName}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-foreground tabular-nums">
                              {formatEUR(c.caTotal)}
                            </td>
                            <td className="px-5 py-3">
                              {c.sources.length > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {SOURCE_LABELS[c.sources[0]] ?? c.sources[0]}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* CA facturé vs collecté + CA par source — même ligne */}
            <motion.div
              variants={fadeInUp}
              transition={defaultTransition}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {/* CA par source d'acquisition (1/3) */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    CA par source
                  </h3>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() => setSourceMode("bar")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        sourceMode === "bar"
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Barres
                    </button>
                    <button
                      onClick={() => setSourceMode("pie")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        sourceMode === "pie"
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Fromage
                    </button>
                  </div>
                </div>
                {dashLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : (data?.caBySource ?? []).length === 0 ? (
                  <EmptyState icon={TrendingUp} text="Aucune donnée" />
                ) : sourceMode === "bar" ? (
                  <div className="space-y-2">
                    {(data?.caBySource ?? []).map((s) => {
                      const maxCa = Math.max(
                        ...(data?.caBySource ?? []).map((x) => x.ca),
                        1,
                      );
                      return (
                        <div key={s.source} className="flex items-center gap-3">
                          <span className="text-xs text-foreground w-28 shrink-0 truncate">
                            {SOURCE_LABELS[s.source] ?? s.source}
                          </span>
                          <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/20 rounded-full flex items-center px-2"
                              style={{
                                width: `${Math.max((s.ca / maxCa) * 100, 8)}%`,
                              }}
                            >
                              <span className="text-[10px] font-mono font-bold text-foreground whitespace-nowrap">
                                {formatEUR(s.ca)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="w-48 h-48 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(data?.caBySource ?? []).map((s) => ({
                              name: SOURCE_LABELS[s.source] ?? s.source,
                              value: s.ca,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                          >
                            {(data?.caBySource ?? []).map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: unknown) =>
                              formatEUR(Number(value))
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(data?.caBySource ?? []).map((s, i) => {
                        const total = (data?.caBySource ?? []).reduce(
                          (sum, x) => sum + x.ca,
                          0,
                        );
                        const pct =
                          total > 0 ? Math.round((s.ca / total) * 100) : 0;
                        return (
                          <div
                            key={s.source}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="size-2.5 rounded-full ring-2 ring-white shadow-sm"
                                style={{
                                  backgroundColor:
                                    PIE_COLORS[i % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-foreground font-medium">
                                {SOURCE_LABELS[s.source] ?? s.source}
                              </span>
                            </div>
                            <span className="font-mono text-muted-foreground tabular-nums font-semibold">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* CA facturé vs Cash collecté (2/3) */}
              <div className="bg-surface border border-border rounded-xl p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    CA facturé vs Cash collecté
                  </h3>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() => setChartMode("bar")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        chartMode === "bar"
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Barres
                    </button>
                    <button
                      onClick={() => setChartMode("area")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        chartMode === "area"
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Graphique
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  {dashLoading ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Chargement...
                    </div>
                  ) : chartMode === "bar" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.chartData ?? []}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                          }
                        />
                        <Tooltip
                          formatter={(value: unknown) =>
                            formatEUR(Number(value))
                          }
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Legend />
                        <Bar
                          dataKey="facture"
                          name="CA facturé"
                          fill="#c6ff00"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="collecte"
                          name="Cash collecté"
                          fill="#c6ff0066"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.chartData ?? []}>
                        <defs>
                          <linearGradient
                            id="gradFacture"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#c6ff00"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="100%"
                              stopColor="#c6ff00"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="gradCollecte"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#059669"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="100%"
                              stopColor="#059669"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#a1a1aa", fontSize: 11 }}
                          tickFormatter={(v: number) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                          }
                          width={40}
                        />
                        <Tooltip
                          formatter={(value: unknown, name: unknown) => [
                            formatEUR(Number(value)),
                            name === "facture" ? "CA facturé" : "Cash collecté",
                          ]}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="facture"
                          name="facture"
                          stroke="#c6ff00"
                          strokeWidth={2.5}
                          fill="url(#gradFacture)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: "#c6ff00",
                            stroke: "#fff",
                            strokeWidth: 2.5,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="collecte"
                          name="collecte"
                          stroke="#059669"
                          strokeWidth={2}
                          fill="url(#gradCollecte)"
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: "#059669",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {chartMode === "area" && (
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-[#c6ff00]" />
                      <span className="text-[11px] text-muted-foreground">
                        CA facturé
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-emerald-600" />
                      <span className="text-[11px] text-muted-foreground">
                        Cash collecté
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* ═══ Tab: Paiements ═══ */}
        {activeTab === "paiements" && (
          <>
            {/* Détail des paiements & encaissements */}
            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Détail des paiements & encaissements
                  </h3>
                </div>
                {dashLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : (data?.paymentDetails ?? []).length === 0 ? (
                  <EmptyState icon={Receipt} text="Aucun échéancier" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs">
                          <th className="text-left px-5 py-2.5 font-medium">
                            Client
                          </th>
                          <th className="text-left px-5 py-2.5 font-medium">
                            Offre
                          </th>
                          <th className="text-right px-5 py-2.5 font-medium">
                            Montant total
                          </th>
                          <th className="text-right px-5 py-2.5 font-medium">
                            Encaissé
                          </th>
                          <th className="text-right px-5 py-2.5 font-medium">
                            Restant
                          </th>
                          <th className="text-left px-5 py-2.5 font-medium">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.paymentDetails ?? []).map((p, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium text-foreground">
                              {p.clientName}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {p.offerTitle}
                            </td>
                            <td className="px-5 py-3 text-right font-mono tabular-nums">
                              {formatEUR(p.totalAmount)}
                            </td>
                            <td className="px-5 py-3 text-right font-mono tabular-nums text-emerald-600">
                              {formatEUR(p.encaisse)}
                            </td>
                            <td className="px-5 py-3 text-right font-mono tabular-nums text-amber-600">
                              {formatEUR(p.restant)}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={cn(
                                  "text-[11px] font-medium px-2 py-0.5 rounded-sm",
                                  p.status === "Payé"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : p.status === "En retard"
                                      ? "bg-lime-400/10 text-lime-400"
                                      : "bg-amber-500/10 text-amber-600",
                                )}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Paiements à venir */}
            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Paiements à venir —{" "}
                  {format(new Date(), "MMMM yyyy", { locale: fr })}
                </h3>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Attendu ce mois
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatEUR(data?.upcomingExpected ?? 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {data?.upcomingExpectedCount ?? 0} échéance(s)
                    </p>
                  </div>
                  <div className="bg-lime-400/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-lime-400 mb-1">En retard</p>
                    <p className="text-xl font-bold text-lime-400">
                      {formatEUR(data?.upcomingOverdue ?? 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {data?.upcomingOverdueCount ?? 0} échéance(s)
                    </p>
                  </div>
                  <div className="bg-emerald-500/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-emerald-600 mb-1">
                      Déjà payé ce mois
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatEUR(data?.upcomingPaid ?? 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {data?.upcomingPaidCount ?? 0} paiement(s)
                    </p>
                  </div>
                </div>

                {/* Installments table */}
                {(data?.upcomingInstallments ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune échéance pour ce mois
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">
                            Client
                          </th>
                          <th className="text-left px-4 py-2 font-medium">
                            Offre
                          </th>
                          <th className="text-left px-4 py-2 font-medium">
                            Date échéance
                          </th>
                          <th className="text-right px-4 py-2 font-medium">
                            Montant
                          </th>
                          <th className="text-left px-4 py-2 font-medium">
                            Statut
                          </th>
                          <th className="text-left px-4 py-2 font-medium">
                            Commentaire
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.upcomingInstallments ?? []).map((inst, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              {inst.clientName}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {inst.offerTitle}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {new Date(inst.dueDate).toLocaleDateString(
                                "fr-FR",
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                              {formatEUR(inst.amount)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={cn(
                                  "text-[11px] font-medium px-2 py-0.5 rounded-sm",
                                  inst.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : inst.status === "overdue"
                                      ? "bg-lime-400/10 text-lime-400"
                                      : "bg-amber-500/10 text-amber-600",
                                )}
                              >
                                {inst.status === "paid"
                                  ? "Payé"
                                  : inst.status === "overdue"
                                    ? "En retard"
                                    : "En attente"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">
                              {inst.comment ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Prévisionnel 6 mois */}
            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Prévisionnel des 6 prochains mois
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(data?.forecast ?? []).map((f) => (
                    <div
                      key={f.month}
                      className="bg-muted/30 rounded-xl p-4 text-center"
                    >
                      <p className="text-xs font-medium text-foreground capitalize mb-1">
                        {f.month}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.count} échéance(s) à venir
                      </p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {formatEUR(f.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ═══ Tab: Contrats ═══ */}
        {activeTab === "contrats" && <ContractsPage />}

        {/* ═══ Tab: Factures ═══ */}
        {activeTab === "factures" && <InvoicesPage />}

        {/* ═══ Tab: Commissions ═══ */}
        {activeTab === "commissions" && (
          <>
            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <PendingCommissions />
            </motion.div>

            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <CommissionTable />
            </motion.div>

            <motion.div variants={fadeInUp} transition={defaultTransition}>
              <CommissionRulesConfig />
            </motion.div>
          </>
        )}

        {/* ═══ Tab: Upsell ═══ */}
        {activeTab === "upsell" && (
          <motion.div
            variants={fadeInUp}
            transition={defaultTransition}
            className="bg-surface border border-border rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              En cours de travaux
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              La section Upsell est en cours de developpement. Elle sera
              disponible prochainement.
            </p>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  );
}

// ─── Reusable components ───────────────────

function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  loading,
}: {
  icon: typeof CreditCard;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center ring-1",
            iconBg,
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {loading ? "..." : value}
      </p>
      <p className="text-xs text-muted-foreground/80 mt-1">{label}</p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof Receipt;
  text: string;
}) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto opacity-20 mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Pending Commissions ───────────────────

function PendingCommissions() {
  const { commissions, summaries, markAsPaid } = useCommissions({
    status: "pending",
  });

  if (commissions.length === 0) return null;

  const totalPending = commissions.reduce(
    (s, c) => s + (c.commission_amount ?? c.amount ?? 0),
    0,
  );

  return (
    <div className="bg-surface border border-amber-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-500" />A payer (
          {commissions.length})
        </h2>
        <span className="text-sm font-bold text-amber-600">
          {formatEUR(totalPending)}
        </span>
      </div>

      <div className="space-y-2">
        {summaries
          .filter((s) => s.remaining > 0)
          .map((summary) => {
            const pending = commissions.filter(
              (c) => c.contractor_id === summary.contractor_id,
            );
            return (
              <div
                key={summary.contractor_id}
                className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg border border-amber-500/10"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {summary.contractor_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pending.length} commission{pending.length > 1 ? "s" : ""}{" "}
                    en attente
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-600">
                    {formatEUR(summary.remaining)}
                  </span>
                  <button
                    onClick={() => {
                      pending.forEach((c) => markAsPaid.mutate(c.id));
                    }}
                    disabled={markAsPaid.isPending}
                    className="h-8 px-3 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Payer
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Commission Rules Config ───────────────

function CommissionRulesConfig() {
  const { rules, isLoading, upsertRule } = useCommissionRules();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
  const [editSplitFirst, setEditSplitFirst] = useState("");
  const [editSplitSecond, setEditSplitSecond] = useState("");
  const [showAddSetter, setShowAddSetter] = useState(false);
  const [newSetterId, setNewSetterId] = useState("");
  const [newRate, setNewRate] = useState("5");
  const [newSplitFirst, setNewSplitFirst] = useState("70");
  const [newSplitSecond, setNewSplitSecond] = useState("30");
  const supabase = useSupabase();
  const [setters, setSetters] = useState<{ id: string; full_name: string }[]>(
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "setter")
      .order("full_name")
      .then(({ data }: { data: { id: string; full_name: string }[] | null }) =>
        setSetters(data ?? []),
      );
  }, [supabase]);

  const startEdit = (rule: CommissionRule) => {
    setEditingId(rule.id);
    setEditRate(String(rule.rate));
    setEditSplitFirst(String(rule.split_first));
    setEditSplitSecond(String(rule.split_second));
  };

  const saveEdit = (setterId: string) => {
    const first = Number(editSplitFirst) || 70;
    const second = Number(editSplitSecond) || 30;
    upsertRule.mutate(
      {
        setter_id: setterId,
        rate: Number(editRate) || 5,
        split_first: first,
        split_second: second,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  const handleAddSetter = () => {
    if (!newSetterId) return;
    const first = Number(newSplitFirst) || 70;
    const second = Number(newSplitSecond) || 30;
    upsertRule.mutate(
      {
        setter_id: newSetterId,
        rate: Number(newRate) || 5,
        split_first: first,
        split_second: second,
      },
      {
        onSuccess: () => {
          setShowAddSetter(false);
          setNewSetterId("");
          setNewRate("5");
          setNewSplitFirst("70");
          setNewSplitSecond("30");
        },
      },
    );
  };

  const existingSetterIds = new Set(rules.map((r) => r.setter_id));
  const availableSetters = setters.filter((s) => !existingSetterIds.has(s.id));

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Regles de commission (setters)
        </h2>
        {availableSetters.length > 0 && (
          <button
            onClick={() => setShowAddSetter(!showAddSetter)}
            className="text-xs text-primary hover:underline"
          >
            + Ajouter un setter
          </button>
        )}
      </div>

      {showAddSetter && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border space-y-3">
          <select
            value={newSetterId}
            onChange={(e) => setNewSetterId(e.target.value)}
            className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm"
          >
            <option value="">Sélectionner un setter</option>
            {availableSetters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">
                Taux %
              </label>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full h-8 px-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">
                1er versement %
              </label>
              <input
                type="number"
                value={newSplitFirst}
                onChange={(e) => setNewSplitFirst(e.target.value)}
                className="w-full h-8 px-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">
                2eme versement %
              </label>
              <input
                type="number"
                value={newSplitSecond}
                onChange={(e) => setNewSplitSecond(e.target.value)}
                className="w-full h-8 px-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSetter}
              disabled={!newSetterId || upsertRule.isPending}
              className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {upsertRule.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Ajouter
            </button>
            <button
              onClick={() => setShowAddSetter(false)}
              className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Aucune regle configuree. Les commissions par defaut seront de 5% avec
          split 70/30.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {rule.setter?.full_name ?? "Setter"}
                  </p>
                  {editingId === rule.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        className="w-14 h-6 px-1.5 bg-muted border border-border rounded text-xs"
                        placeholder="Taux"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        %
                      </span>
                      <input
                        type="number"
                        value={editSplitFirst}
                        onChange={(e) => setEditSplitFirst(e.target.value)}
                        className="w-12 h-6 px-1.5 bg-muted border border-border rounded text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        /
                      </span>
                      <input
                        type="number"
                        value={editSplitSecond}
                        onChange={(e) => setEditSplitSecond(e.target.value)}
                        className="w-12 h-6 px-1.5 bg-muted border border-border rounded text-xs"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {rule.rate}% — Split {rule.split_first}/
                      {rule.split_second}
                    </p>
                  )}
                </div>
              </div>
              {editingId === rule.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => saveEdit(rule.setter_id)}
                    disabled={upsertRule.isPending}
                    className="h-7 px-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                  >
                    {upsertRule.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Sauver"
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(rule)}
                  className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  Modifier
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
