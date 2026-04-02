"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  Search,
  Copy,
  Check,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useInvitations } from "@/hooks/use-invitations";
import { InviteUserModal } from "@/components/invitations/invite-user-modal";
import { ROLE_OPTIONS } from "@/types/invitations";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "En attente",
    color: "text-amber-600 bg-amber-500/10 border border-amber-500/20",
    icon: Clock,
  },
  accepted: {
    label: "Acceptee",
    color: "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20",
    icon: CheckCircle,
  },
  expired: {
    label: "Expiree",
    color: "text-gray-500 bg-gray-500/10 border border-gray-500/20",
    icon: XCircle,
  },
};

export default function InvitationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { invitations, isLoading, deleteInvitation } = useInvitations();

  const filtered = useMemo(() => {
    if (!search) return invitations;
    const q = search.toLowerCase();
    return invitations.filter(
      (i) =>
        i.full_name?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q),
    );
  }, [invitations, search]);

  const handleCopyLink = async (inviteCode: string, id: string) => {
    const link = `${window.location.origin}/register?code=${inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette invitation ?")) {
      deleteInvitation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une invitation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10">
          <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune invitation</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-[#c6ff00] hover:text-[#c6ff00] font-medium transition-colors"
          >
            Creer une invitation
          </button>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Nom
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3.5 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invite) => {
                const statusInfo = STATUS_LABELS[invite.status];
                const StatusIcon = statusInfo?.icon ?? Clock;
                return (
                  <tr
                    key={invite.id}
                    className="border-b border-border last:border-0 hover:bg-[#c6ff00]/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                      {invite.full_name}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {invite.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-foreground">
                        {ROLE_OPTIONS.find((r) => r.value === invite.role)
                          ?.label ?? invite.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                          statusInfo?.color,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(invite.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {invite.status === "pending" && (
                          <button
                            onClick={() =>
                              handleCopyLink(invite.invite_code, invite.id)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#c6ff00] hover:bg-[#c6ff00]/5 transition-colors"
                            title="Copier le lien"
                          >
                            {copiedId === invite.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invite.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-lime-400 hover:bg-lime-400/10 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InviteUserModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
