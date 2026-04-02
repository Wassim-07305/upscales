"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { Settings, Plus, MessageSquare, Link, PhoneCall } from "lucide-react";
import { SetterPipelineKanban } from "@/components/crm/setter-pipeline-kanban";
import { SetterPipelineList } from "@/components/crm/setter-pipeline-list";
import { SetterBilan } from "@/components/crm/setter-bilan";
import { SetterPipelineConfig } from "@/components/crm/setter-pipeline-config";
import {
  useCreateSetterLead,
  usePipelineColumns,
  useSetterLeads,
} from "@/hooks/use-setter-crm";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type CrmView = "pipeline" | "liste" | "bilan";

const TABS: { key: CrmView; label: string }[] = [
  { key: "pipeline", label: "Pipeline" },
  { key: "liste", label: "Liste" },
  { key: "bilan", label: "Bilan" },
];

function CrmKpiCard({
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
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground tabular-nums leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ClientPipelinePage() {
  const [view, setView] = useState<CrmView>("pipeline");
  const [showConfig, setShowConfig] = useState(false);
  const { user } = useAuth();
  const clientId = user?.id;
  const { columns } = usePipelineColumns(clientId);
  const { leads } = useSetterLeads(clientId ? { clientId } : undefined);
  const createLead = useCreateSetterLead();

  // KPI stats
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

    const inDiscussion =
      (countByColumn[discussionCol?.id] ?? 0) +
      (countByColumn[relanceCol?.id] ?? 0);
    const inLien = countByColumn[lienCol?.id] ?? 0;
    const inCall = countByColumn[callCol?.id] ?? 0;

    const passedToLien = inLien + inCall;
    const lienRate = total > 0 ? Math.round((passedToLien / total) * 100) : 0;

    const lienTotal = inLien + inCall;
    const callRate = lienTotal > 0 ? Math.round((inCall / lienTotal) * 100) : 0;

    return { total, lienRate, callRate };
  }, [leads, columns]);

  const handleNewProspect = () => {
    const firstColumn = columns?.[0];
    if (!firstColumn) {
      toast.error("Aucune colonne configuree");
      return;
    }
    createLead.mutate(
      {
        setter_id: user?.id ?? "",
        client_id: clientId ?? null,
        column_id: firstColumn.id,
        name: "Sans nom",
      } as never,
      {
        onSuccess: () => toast.success("Prospect ajoute"),
      },
    );
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            CRM
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline de prospection, suivi des leads et bilan d&apos;activite.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowConfig(true)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Colonnes
          </button>
          <button
            onClick={handleNewProspect}
            disabled={createLead.isPending}
            className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau prospect
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <CrmKpiCard
          icon={MessageSquare}
          label="Prospects en cours"
          value={String(crmStats.total)}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <CrmKpiCard
          icon={Link}
          label="Discussion → Lien envoye"
          value={`${crmStats.lienRate}%`}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600"
        />
        <CrmKpiCard
          icon={PhoneCall}
          label="Lien envoye → Call booke"
          value={`${crmStats.callRate}%`}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-0 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                "h-10 px-4 text-sm font-medium transition-all relative",
                view === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {view === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div variants={staggerItem}>
        {view === "pipeline" && <SetterPipelineKanban clientId={clientId} />}
        {view === "liste" && <SetterPipelineList clientId={clientId} />}
        {view === "bilan" && <SetterBilan clientId={clientId} />}
      </motion.div>

      {/* Column config modal */}
      <SetterPipelineConfig
        open={showConfig}
        onClose={() => setShowConfig(false)}
        columns={columns ?? []}
      />
    </motion.div>
  );
}
