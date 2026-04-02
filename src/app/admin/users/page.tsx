"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  UserMinus,
  Archive,
  Loader2,
  ChevronDown,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, formatDate } from "@/lib/utils";
import { useUserManagement } from "@/hooks/use-user-management";
import { UserOffboardingModal } from "@/components/admin/user-offboarding-modal";
import { ROLE_OPTIONS } from "@/types/invitations";
import type { Profile } from "@/types/database";
import { motion } from "framer-motion";
import { fadeInUp, defaultTransition } from "@/lib/animations";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [offboardingUser, setOffboardingUser] = useState<
    (Profile & { is_archived?: boolean }) | null
  >(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const {
    users,
    isLoading,
    error: usersError,
    changeUserRole,
    archiveUser,
  } = useUserManagement();

  const filtered = useMemo(() => {
    let result = users.filter((u) => !u.is_archived);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    return result;
  }, [users, search]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.id)));
    }
  }, [filtered, selectedIds.size]);

  const handleBulkArchive = async () => {
    if (!confirm(`Archiver ${selectedIds.size} utilisateur(s) ?`)) return;
    for (const id of selectedIds) {
      await archiveUser.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    changeUserRole.mutate(
      { userId, newRole },
      {
        onSuccess: () => setEditingRoleId(null),
      },
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={defaultTransition}
      className="space-y-4"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selectionne(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleBulkArchive}
              disabled={archiveUser.isPending}
              className="h-8 px-3 rounded-lg text-xs font-medium text-lime-400 hover:bg-lime-400/10 transition-colors flex items-center gap-1.5"
            >
              {archiveUser.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              Archiver
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {usersError ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Impossible de charger les utilisateurs. Veuillez reessayer.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun utilisateur trouve
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Utilisateur
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                    Inscription
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                    Dernière connexion
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Statut
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelected = selectedIds.has(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt={u.full_name}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-semibold">
                              {getInitials(u.full_name)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {u.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingRoleId === u.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              className="h-8 px-2 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              autoFocus
                              onBlur={() => setEditingRoleId(null)}
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            {changeUserRole.isPending && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRoleId(u.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                            title="Cliquer pour changer le role"
                          >
                            {ROLE_OPTIONS.find((r) => r.value === u.role)
                              ?.label ?? u.role}
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {u.last_seen_at
                          ? formatDate(u.last_seen_at, "relative")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-emerald-500 bg-emerald-500/10">
                          Actif
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Archiver ${u.full_name} ? L'utilisateur ne pourra plus se connecter.`,
                                )
                              ) {
                                archiveUser.mutate(u.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            title="Archiver"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOffboardingUser(u)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-lime-400 hover:bg-lime-400/10 transition-colors"
                            title="Offboarding"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offboarding modal (quick, per-user) */}
      <UserOffboardingModal
        open={!!offboardingUser}
        onClose={() => setOffboardingUser(null)}
        user={offboardingUser}
      />
    </motion.div>
  );
}
