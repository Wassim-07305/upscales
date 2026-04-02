"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import {
  useSetterLeads,
  usePipelineColumns,
  useSetterStats,
} from "@/hooks/use-setter-crm";
import { useCloserCalls } from "@/hooks/use-closer-calls";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { cn } from "@/lib/utils";
import {
  Target,
  MessageSquare,
  Link2,
  PhoneCall,
  Send,
  RefreshCw,
  Phone,
  UserCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

export default function SalesDashboardPage() {
  const { profile, isCloser } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

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
          Suivi de tes performances
        </p>
      </motion.div>

      {/* KPI Cards — different par role */}
      <motion.div variants={staggerItem}>
        {isCloser ? <CloserKpis /> : <SetterKpis />}
      </motion.div>

      {/* Charts : Appels closing par semaine + Funnel de conversion */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <LeadsChart />
        <ConversionFunnel />
      </motion.div>
    </motion.div>
  );
}

// ─── Setter KPIs ─────────

function SetterKpis() {
  const { columns } = usePipelineColumns();
  const { leads } = useSetterLeads();
  const { data: setterStats } = useSetterStats();

  const crmStats = useMemo(() => {
    if (!columns?.length) return { total: 0, lienRate: 0, callRate: 0 };

    const countByColumn: Record<string, number> = {};
    for (const lead of leads) {
      const colId = lead.column_id ?? "unknown";
      countByColumn[colId] = (countByColumn[colId] ?? 0) + 1;
    }

    const total = leads.length;
    const sorted = [...(columns ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    const discussionCol = sorted[0];
    const relanceCol = sorted[1];
    const lienCol = sorted[2];
    const callCol = sorted[3];

    const inLien = countByColumn[lienCol?.id] ?? 0;
    const inCall = countByColumn[callCol?.id] ?? 0;

    const passedToLien = inLien + inCall;
    const lienRate = total > 0 ? Math.round((passedToLien / total) * 100) : 0;
    const lienTotal = inLien + inCall;
    const callRate = lienTotal > 0 ? Math.round((inCall / lienTotal) * 100) : 0;

    return { total, lienRate, callRate };
  }, [leads, columns]);

  const dmsWeek = setterStats?.semaine.dms_sent ?? 0;
  const relancesWeek = setterStats?.semaine.followups_sent ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        icon={MessageSquare}
        label="Prospects en cours"
        value={String(crmStats.total)}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-600"
      />
      <KpiCard
        icon={Link2}
        label="Discussion → Lien"
        value={`${crmStats.lienRate}%`}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-600"
      />
      <KpiCard
        icon={PhoneCall}
        label="Lien → Call booke"
        value={`${crmStats.callRate}%`}
        iconBg="bg-purple-500/10"
        iconColor="text-purple-600"
      />
      <KpiCard
        icon={Send}
        label="DM cette semaine"
        value={String(dmsWeek)}
        iconBg="bg-sky-500/10"
        iconColor="text-sky-600"
      />
      <KpiCard
        icon={RefreshCw}
        label="Relances semaine"
        value={String(relancesWeek)}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-600"
      />
    </div>
  );
}

// ─── Closer KPIs ─────────

function CloserKpis() {
  const { stats } = useCloserCalls();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        icon={Phone}
        label="Appels realises"
        value={String(stats.totalCalls)}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-600"
      />
      <KpiCard
        icon={UserCheck}
        label="Taux de show-up"
        value={`${stats.showUpRate}%`}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-600"
      />
      <KpiCard
        icon={Target}
        label="Taux de closing"
        value={`${stats.closingRate}%`}
        iconBg="bg-purple-500/10"
        iconColor="text-purple-600"
      />
      <KpiCard
        icon={CheckCircle}
        label="Appels gagnes"
        value={String(stats.closedCalls)}
        iconBg="bg-green-500/10"
        iconColor="text-green-600"
      />
      <KpiCard
        icon={XCircle}
        label="Non qualifies"
        value={String(stats.nonQualifiedCalls)}
        iconBg="bg-lime-400/10"
        iconColor="text-lime-400"
      />
    </div>
  );
}

// ─── KPI Card ─────────

function KpiCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center mb-3",
          iconBg,
        )}
      >
        <Icon className={cn("size-4", iconColor)} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
