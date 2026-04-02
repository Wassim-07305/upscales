"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Select } from "@/components/ui/select";
import {
  useRevenueStats,
  useStudentStats,
  useSalesStats,
  useEngagementStats,
  useCoachLeaderboard,
} from "@/hooks/use-admin-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { PeriodComparison } from "@/components/dashboard/period-comparison";
import { AiPeriodicReport } from "@/components/dashboard/ai-periodic-report";
import { AdminObjective } from "@/components/dashboard/admin-objective";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { TabsList, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { DashboardOverridesModal } from "@/components/dashboard/dashboard-overrides-modal";
import { useDashboardOverrides } from "@/hooks/use-dashboard-overrides";
import { formatCurrency, cn } from "@/lib/utils";
import {
  DollarSign,
  Users,
  UserPlus,
  AlertTriangle,
  GraduationCap,
  Target,
  Receipt,
  Percent,
  BarChart3,
  PieChart as PieChartIcon,
  Crown,
  FileText,
  Table,
  LayoutDashboard,
  Activity,
  Pencil,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

const CHANNEL_COLORS = [
  "#c6ff00",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#52525b",
  "#3f3f46",
];

const DASHBOARD_TABS = [
  {
    value: "overview",
    label: (
      <span className="flex items-center gap-1.5">
        <LayoutDashboard className="size-3.5" />
        Vue d&apos;ensemble
      </span>
    ),
  },
  {
    value: "activity",
    label: (
      <span className="flex items-center gap-1.5">
        <Activity className="size-3.5" />
        Activite
      </span>
    ),
  },
];

/* ─── Mini KPI (Row 2) ─── */
function MiniKPI({
  label,
  value,
  icon: Icon,
  color,
  accentBg,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor?: string;
  accentBg?: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-surface border border-border rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
            accentBg ?? "bg-muted",
          )}
        >
          <Icon className={cn("size-[16px]", color)} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            {label}
          </p>
          <p className="text-xl font-bold text-foreground tabular-nums leading-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Cash Card ─── */
function CashCard({
  label,
  value,
  icon: Icon,
  color,
  accentBg,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentBg?: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div
        className={cn(
          "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
          accentBg ?? "bg-muted",
        )}
      >
        <Icon className={cn("size-[16px]", color)} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
          {label}
        </p>
        <p className="text-base font-bold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function MiniStatSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
      <div className="h-4 w-20 bg-muted rounded-lg mb-2" />
      <div className="h-6 w-16 bg-muted rounded-lg" />
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  icon: Icon,
  label,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 text-muted-foreground/60" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {label}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent ml-2 min-w-[40px]" />
      </div>
      {extra}
    </div>
  );
}

/* ─── Chart Card Wrapper ─── */
function ChartCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-2xl p-6 transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Period options ─── */
const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "14d", label: "14 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "last_month", label: "Mois dernier" },
  { value: "3m", label: "3 derniers mois" },
  { value: "this_year", label: "Cette annee" },
];

function getPeriodDateFrom(period: string): string {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 86400000).toISOString();
    case "14d":
      return new Date(now.getTime() - 14 * 86400000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "this_month":
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case "last_month":
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    case "this_year":
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
  }
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "13px",
  boxShadow:
    "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.03)",
  padding: "10px 14px",
};

/* ═══════════════════════════════════════════ */
/*  Main Component                             */
/* ═══════════════════════════════════════════ */

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("30d");
  const [showOverrides, setShowOverrides] = useState(false);

  const dateFrom = useMemo(() => getPeriodDateFrom(period), [period]);

  const revenueQuery = useRevenueStats(dateFrom);
  const studentsQuery = useStudentStats(dateFrom);
  const salesQuery = useSalesStats(dateFrom);
  const engagementQuery = useEngagementStats(dateFrom);
  const coachesQuery = useCoachLeaderboard(dateFrom);
  const { overrides } = useDashboardOverrides();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Admin";

  // Valeurs avec overrides manuels (prioritaires si renseignees)
  const displayRevenue =
    overrides.dashboard_revenue ?? revenueQuery.data?.revenueThisMonth ?? 0;
  const displayCashInvoiced =
    overrides.dashboard_cash_invoiced ?? revenueQuery.data?.cashInvoiced ?? 0;
  const displayCashCollected =
    overrides.dashboard_cash_collected ?? revenueQuery.data?.cashCollected ?? 0;
  const displayLtv =
    overrides.dashboard_ltv ?? studentsQuery.data?.averageLtv ?? 0;
  const displayClosing =
    overrides.dashboard_closing_rate ?? salesQuery.data?.globalClosingRate ?? 0;
  const displayCompletion =
    overrides.dashboard_completion_rate ??
    engagementQuery.data?.formationCompletionRate ??
    0;

  const recoveryRate = displayCashInvoiced
    ? Math.round((displayCashCollected / displayCashInvoiced) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {getGreeting()}, {firstName}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground/70">
            Vue d&apos;ensemble de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverrides(true)}
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Modifier les donnees manuellement"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <Select
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            className="w-44 h-9 text-xs"
          />
          <ExportDropdown
            options={[
              {
                label: "Rapport PDF",
                icon: FileText,
                onClick: () => {
                  window.open(
                    "/api/admin/dashboard-export?format=pdf",
                    "_blank",
                  );
                },
              },
              {
                label: "Export CSV",
                icon: Table,
                onClick: () => {
                  window.open(
                    "/api/admin/dashboard-export?format=csv",
                    "_blank",
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {/* ─── KPI Cards — Row 1 ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {revenueQuery.isLoading || studentsQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-3 w-24 bg-muted rounded-lg mb-5" />
              <div className="h-8 w-20 bg-muted rounded-lg" />
            </div>
          ))
        ) : (
          <>
            <Link
              href="/admin/billing/ca"
              className="block hover:ring-2 hover:ring-primary/20 rounded-[14px] transition-shadow"
            >
              <StatCard
                title="CA période"
                value={formatCurrency(displayRevenue)}
                change={revenueQuery.data?.revenueChange ?? 0}
                changeLabel="vs période préc."
                icon={DollarSign}
                iconBg="bg-[#c6ff00]/10"
                iconColor="text-[#c6ff00]"
              />
            </Link>
            <StatCard
              title="Eleves actifs"
              value={studentsQuery.data?.totalStudents ?? 0}
              icon={Users}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Nouveaux"
              value={studentsQuery.data?.newStudentsThisMonth ?? 0}
              icon={UserPlus}
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Taux de recouvrement"
              value={`${recoveryRate}%`}
              subtitle={`${formatCurrency(displayCashCollected)} / ${formatCurrency(displayCashInvoiced)}`}
              icon={Percent}
              iconBg={
                recoveryRate >= 80 ? "bg-emerald-500/10" : "bg-amber-500/10"
              }
              iconColor={
                recoveryRate >= 80 ? "text-emerald-600" : "text-amber-600"
              }
            />
            <StatCard
              title="LTV moyen"
              value={formatCurrency(displayLtv)}
              icon={Receipt}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-600"
            />
          </>
        )}
      </div>

      {/* ─── KPI Cards — Row 2: Rates + Cash ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {studentsQuery.isLoading ||
        salesQuery.isLoading ||
        engagementQuery.isLoading ||
        revenueQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <MiniStatSkeleton key={i} />)
        ) : (
          <>
            <Link
              href="/admin/personnes"
              className="group relative overflow-hidden bg-surface border border-border rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                    studentsQuery.isError || coachesQuery.isError
                      ? "bg-lime-400/10"
                      : "bg-amber-500/10",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "size-[16px]",
                      studentsQuery.isError || coachesQuery.isError
                        ? "text-lime-400"
                        : "text-amber-600",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                    Alertes
                  </p>
                  {studentsQuery.isError || coachesQuery.isError ? (
                    <p className="text-xs text-lime-400 font-medium">
                      Erreur de chargement
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-bold tabular-nums leading-tight">
                      <span
                        className={cn(
                          "text-foreground",
                          (studentsQuery.data?.atRiskStudents ?? 0) > 0 &&
                            "text-amber-600",
                        )}
                      >
                        {studentsQuery.data?.atRiskStudents ?? 0} signale
                        {(studentsQuery.data?.atRiskStudents ?? 0) > 1
                          ? "s"
                          : ""}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span
                        className={cn(
                          "text-foreground",
                          (coachesQuery.data?.latePayments ?? 0) > 0 &&
                            "text-lime-400",
                        )}
                      >
                        {coachesQuery.data?.latePayments ?? 0} impaye
                        {(coachesQuery.data?.latePayments ?? 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
            <MiniKPI
              label="Taux closing"
              value={`${displayClosing}%`}
              icon={Target}
              color="text-[#c6ff00]"
              accentBg="bg-[#c6ff00]/8"
            />
            <MiniKPI
              label="Completion formations"
              value={`${displayCompletion}%`}
              icon={GraduationCap}
              color="text-amber-600"
              accentBg="bg-amber-500/10"
            />
            <MiniKPI
              label="Cash facture"
              value={formatCurrency(displayCashInvoiced)}
              icon={Receipt}
              color="text-[#c6ff00]"
              accentBg="bg-[#c6ff00]/8"
            />
            <MiniKPI
              label="Cash encaisse"
              value={formatCurrency(displayCashCollected)}
              icon={DollarSign}
              color="text-emerald-600"
              accentBg="bg-emerald-500/10"
            />
          </>
        )}
      </div>

      {/* ─── Objectif mensuel ─── */}
      <AdminObjective />

      {/* ─── Tabs ─── */}
      <TabsList
        tabs={DASHBOARD_TABS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* ═══ Tab: Vue d'ensemble ═══ */}
      <TabsContent value="overview" activeValue={activeTab}>
        <div className="space-y-4">
          {/* Leads chart + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeadsChart />
            <ConversionFunnel />
          </div>

          {/* Rapport IA */}
          <AiPeriodicReport />
        </div>
      </TabsContent>

      {/* ═══ Tab: Activite ═══ */}
      <TabsContent value="activity" activeValue={activeTab}>
        <div className="space-y-4">
          {/* Heatmap + Period Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityHeatmap />
            <PeriodComparison />
          </div>

          {/* Activity feed + Coach leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
            <ChartCard>
              <SectionHeader icon={Crown} label="Leaderboard coaches" />
              {coachesQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-zinc-50 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : !coachesQuery.data?.coachLeaderboard.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun coach
                </p>
              ) : (
                <div className="space-y-1">
                  {coachesQuery.data.coachLeaderboard.map((coach, i) => (
                    <div
                      key={coach.id ?? `coach-${i}`}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-zinc-50",
                        i === 0 && "bg-amber-50/50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs w-6 text-center font-mono tabular-nums font-bold rounded-lg py-0.5",
                          i === 0
                            ? "text-amber-700 bg-amber-100"
                            : i === 1
                              ? "text-zinc-500 bg-muted"
                              : i === 2
                                ? "text-orange-600 bg-orange-50"
                                : "text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      {coach.avatar ? (
                        <Image
                          src={coach.avatar}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="size-9 rounded-full bg-primary/5 flex items-center justify-center text-xs text-primary font-bold ring-2 ring-white shadow-sm">
                          {coach.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {coach.name}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              coach.score >= 70
                                ? "bg-emerald-100 text-emerald-700"
                                : coach.score >= 40
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-lime-100 text-lime-500",
                            )}
                          >
                            {coach.score}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70">
                          {coach.students} eleve
                          {coach.students !== 1 ? "s" : ""}
                          {coach.avgHealth > 0 &&
                            ` · ${coach.avgHealth}% sante`}
                          {coach.sessionsMonth > 0 &&
                            ` · ${coach.sessionsMonth} sessions`}
                          {coach.atRisk > 0 && (
                            <span className="text-lime-400">
                              {" "}
                              · {coach.atRisk} a risque
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      </TabsContent>

      <DashboardOverridesModal
        open={showOverrides}
        onClose={() => setShowOverrides(false)}
        currentValues={{
          dashboard_revenue: revenueQuery.data?.revenueThisMonth ?? 0,
          dashboard_cash_invoiced: revenueQuery.data?.cashInvoiced ?? 0,
          dashboard_cash_collected: revenueQuery.data?.cashCollected ?? 0,
          dashboard_ltv: studentsQuery.data?.averageLtv ?? 0,
          dashboard_closing_rate: salesQuery.data?.globalClosingRate ?? 0,
          dashboard_completion_rate:
            engagementQuery.data?.formationCompletionRate ?? 0,
        }}
      />
    </div>
  );
}
