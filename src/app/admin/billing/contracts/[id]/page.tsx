"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { useContract } from "@/hooks/use-contracts";
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  PenLine,
  Download,
  Shield,
} from "lucide-react";

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  draft: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  sent: {
    label: "Envoye",
    className: "bg-blue-500/10 text-blue-600",
    icon: Send,
  },
  signed: {
    label: "Signe",
    className: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Annule",
    className: "bg-lime-400/10 text-lime-400",
    icon: XCircle,
  },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: contract, isLoading } = useContract(id);

  const handleDownloadPDF = () => {
    if (contract?.signed_pdf_url) {
      window.open(contract.signed_pdf_url, "_blank");
    } else {
      window.open(`/api/contracts/${id}/pdf`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-16">
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Contrat introuvable</p>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusConf.icon;

  const timeline = [
    { date: contract.created_at, label: "Contrat cree", icon: FileText },
    ...(contract.sent_at
      ? [{ date: contract.sent_at, label: "Envoye au client", icon: Send }]
      : []),
    ...(contract.signed_at
      ? [
          {
            date: contract.signed_at,
            label: "Signe par le client",
            icon: PenLine,
          },
        ]
      : []),
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        transition={defaultTransition}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {contract.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contract.client?.full_name ?? "Client inconnu"}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${statusConf.className}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusConf.label}
        </span>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="lg:col-span-2 space-y-6"
        >
          {/* PDF du contrat signe */}
          {contract.status === "signed" && contract.signed_pdf_url ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <iframe
                src={contract.signed_pdf_url}
                className="w-full border-0"
                style={{ height: "75vh" }}
                title="Contrat signe"
              />
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {contract.status === "sent"
                  ? "En attente de signature par le client"
                  : contract.status === "draft"
                    ? "Brouillon — pas encore envoye"
                    : "Contrat annule"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          variants={fadeInUp}
          transition={defaultTransition}
          className="space-y-6"
        >
          {/* Info card */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Informations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-foreground">
                    {contract.client?.full_name ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contract.client?.email ?? ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Cree le {formatDate(contract.created_at)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border">
              <button
                onClick={handleDownloadPDF}
                className="w-full h-9 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Telecharger PDF
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Historique
            </h3>
            <div className="space-y-0">
              {timeline.map((event, i) => {
                const Icon = event.icon;
                return (
                  <div key={i} className="flex gap-3 relative">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[11px] top-7 w-px h-[calc(100%-4px)] bg-border" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-foreground">{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature electronique */}
          {contract.status === "signed" && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Signature
              </h3>
              {contract.signature_image && (
                <div className="bg-white border border-border rounded-lg p-2 mb-3 w-fit">
                  <Image
                    src={contract.signature_image}
                    alt="Signature"
                    width={160}
                    height={50}
                    className="h-12 w-auto"
                    unoptimized
                  />
                </div>
              )}
              <div className="space-y-1 text-xs text-muted-foreground">
                {contract.signature_data?.signer_name && (
                  <p className="text-foreground font-medium text-sm">
                    {contract.signature_data.signer_name}
                  </p>
                )}
                <p>Signe le {formatDate(contract.signed_at)}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
