"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole, Tag } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  UserCircle,
  Ban,
  RotateCcw,
  Mail,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  moderator: "Modérateur",
  member: "Membre",
  prospect: "Prospect",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  member: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  prospect: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface UsersClientProps {
  profiles: Profile[];
  allTags: Tag[];
  userTags: { user_id: string; tag: Tag | null }[];
  isAdmin: boolean;
}

export function UsersClient({ profiles: initialProfiles, allTags, userTags, isAdmin }: UsersClientProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const supabase = createClient();

  // Tags per user
  const tagsByUser = useMemo(() => {
    const map: Record<string, Tag[]> = {};
    userTags.forEach((ut) => {
      if (ut.tag) {
        if (!map[ut.user_id]) map[ut.user_id] = [];
        map[ut.user_id].push(ut.tag);
      }
    });
    return map;
  }, [userTags]);

  // Filter
  const filtered = useMemo(() => {
    let list = profiles;
    if (roleFilter !== "all") {
      list = list.filter((p) => p.role === roleFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, roleFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: profiles.length,
    admins: profiles.filter((p) => p.role === "admin").length,
    moderators: profiles.filter((p) => p.role === "moderator").length,
    members: profiles.filter((p) => p.role === "member").length,
    prospects: profiles.filter((p) => p.role === "prospect").length,
    suspended: profiles.filter((p) => p.is_suspended).length,
  }), [profiles]);

  // Change role
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      toast.error("Erreur lors du changement de rôle");
      return;
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
    );
    toast.success(`Rôle mis à jour : ${ROLE_LABELS[newRole]}`);
  };

  // Suspend / unsuspend
  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    const updates = currentlySuspended
      ? { is_suspended: false, suspended_at: null, suspended_reason: null }
      : { is_suspended: true, suspended_at: new Date().toISOString(), suspended_reason: "Suspendu par admin" };

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) {
      toast.error("Erreur");
      return;
    }
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === userId
          ? { ...p, is_suspended: !currentlySuspended, suspended_at: updates.suspended_at, suspended_reason: updates.suspended_reason }
          : p
      )
    );
    toast.success(currentlySuspended ? "Compte réactivé" : "Compte suspendu");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des membres et du staff</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Admins", value: stats.admins, color: "text-red-400" },
          { label: "Modérateurs", value: stats.moderators, color: "text-purple-400" },
          { label: "Membres", value: stats.members, color: "text-emerald-400" },
          { label: "Prospects", value: stats.prospects, color: "text-zinc-400" },
          { label: "Suspendus", value: stats.suspended, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141414] border-0"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Modérateur</SelectItem>
            <SelectItem value="member">Membre</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Utilisateur</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Tags</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Inscrit le</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Statut</th>
                  {isAdmin && <th className="p-3 text-right text-xs font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const tags = tagsByUser[user.id] || [];
                  return (
                    <tr key={user.id} onClick={() => router.push(`/admin/users/${user.id}`)} className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {getInitials(user.full_name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            {user.is_online && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.full_name || "Sans nom"}
                              {user.is_suspended && (
                                <span className="ml-2 text-[10px] text-amber-400">(suspendu)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {user.phone ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />{user.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isAdmin ? (
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Modérateur</SelectItem>
                              <SelectItem value="member">Membre</SelectItem>
                              <SelectItem value="prospect">Prospect</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={cn("text-[10px]", ROLE_COLORS[user.role])}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-[10px]" style={{ borderColor: tag.color, color: tag.color }}>
                              {tag.name}
                            </Badge>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
                          )}
                          {tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {user.is_online ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En ligne
                          </span>
                        ) : user.last_seen_at ? (
                          <span className="text-xs text-muted-foreground">Vu {formatDate(user.last_seen_at)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Jamais vu</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7",
                              user.is_suspended ? "text-emerald-400 hover:text-emerald-300" : "text-amber-400 hover:text-amber-300"
                            )}
                            onClick={() => handleToggleSuspend(user.id, user.is_suspended)}
                            title={user.is_suspended ? "Réactiver" : "Suspendre"}
                          >
                            {user.is_suspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
