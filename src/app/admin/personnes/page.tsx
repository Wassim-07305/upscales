"use client";

import { useState, Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Upload, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { logError } from "@/lib/error-logger";
import { useUserManagement } from "@/hooks/use-user-management";
import { CSVImportModal } from "@/components/shared/CSVImportModal";
import { InviteUserModal } from "@/components/invitations/invite-user-modal";

class TabErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError({
      message: `[${this.props.name}] ${error.message}`,
      stack: error.stack ?? null,
      component_stack: errorInfo.componentStack ?? null,
      page: "/admin/personnes",
      source: "error-boundary",
      severity: "error",
      metadata: { section: this.props.name },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-lime-400/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-lime-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Erreur de chargement
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Impossible de charger la section {this.props.name}. Veuillez
            reessayer.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ClientsContent = dynamic(
  () => import("@/app/_shared-pages/clients/page"),
  { ssr: false },
);

const EquipeContent = dynamic(() => import("@/app/admin/csm/page"), {
  ssr: false,
});

const InvitationsContent = dynamic(
  () => import("@/app/admin/invitations/page"),
  { ssr: false },
);

const UsersContent = dynamic(() => import("@/app/admin/users/page"), {
  ssr: false,
});

type Tab = "tous" | "clients" | "équipe" | "invitations";

export default function PersonnesPage() {
  const [tab, setTab] = useState<Tab>("tous");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { users } = useUserManagement();

  return (
    <motion.div variants={staggerContainer} className="space-y-6">
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Personnes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerez vos clients, votre équipe et les invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvImport(true)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importer CSV
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle invitation
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        <div className="flex items-center gap-0 border-b border-border">
          {(["tous", "clients", "équipe", "invitations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-10 px-4 text-sm font-medium transition-all relative capitalize",
                tab === t
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "tous"
                ? "Tous"
                : t === "clients"
                  ? "Clients"
                  : t === "équipe"
                    ? "Équipe"
                    : "Invitations"}
              {tab === t && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div>
        {tab === "tous" && (
          <TabErrorBoundary name="Tous">
            <UsersContent />
          </TabErrorBoundary>
        )}
        {tab === "clients" && (
          <TabErrorBoundary name="Clients">
            <ClientsContent />
          </TabErrorBoundary>
        )}
        {tab === "équipe" && (
          <TabErrorBoundary name="Equipe">
            <EquipeContent />
          </TabErrorBoundary>
        )}
        {tab === "invitations" && (
          <TabErrorBoundary name="Invitations">
            <InvitationsContent />
          </TabErrorBoundary>
        )}
      </div>

      {/* Modals */}
      <InviteUserModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <CSVImportModal
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title="Importer des utilisateurs"
        description="Importez des utilisateurs depuis un fichier CSV"
        columns={[
          { key: "full_name", label: "Nom complet", required: true },
          { key: "email", label: "Email", required: true },
          { key: "role", label: "Role" },
          { key: "phone", label: "Telephone" },
        ]}
        onImport={async (rows) => {
          const res = await fetch("/api/admin/users/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users: rows }),
          });
          const data = await res.json();
          return { success: data.success ?? 0, errors: data.errors ?? 0 };
        }}
        templateFilename="users-import-template"
      />
    </motion.div>
  );
}
