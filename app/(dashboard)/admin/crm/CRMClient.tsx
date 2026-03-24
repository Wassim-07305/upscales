"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ExternalLink, Download, ChevronDown, UserCog, TagIcon, X, BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Profile, Tag, UserRole } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate, timeAgo } from "@/lib/utils/dates";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudentData extends Profile {
  tags: Tag[];
  enrollments_count: number;
  coach_phase: string | null;
  coach_health: string | null;
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "bg-blue-400/20 text-blue-400" },
  lancement: { label: "Lancement", color: "bg-cyan-400/20 text-cyan-400" },
  optimisation: { label: "Optim.", color: "bg-neon/20 text-neon" },
  scaling: { label: "Scaling", color: "bg-purple-400/20 text-purple-400" },
  autonomie: { label: "Autonomie", color: "bg-emerald-400/20 text-emerald-400" },
  offboarding: { label: "Offboard.", color: "bg-orange-400/20 text-orange-400" },
};

const HEALTH_ICONS: Record<string, string> = {
  en_forme: "🟢",
  attention: "🟡",
  critique: "🔴",
  a_risque: "⚠️",
};

interface FormationOption {
  id: string;
  title: string;
}

interface CRMClientProps {
  initialStudents: StudentData[];
  allTags: Tag[];
  allFormations: FormationOption[];
  currentUserRole: UserRole;
}

type SortKey = "name" | "role" | "enrollments" | "last_seen" | "created_at";
type SortDir = "asc" | "desc";

export function CRMClient({ initialStudents, allTags, allFormations, currentUserRole }: CRMClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const router = useRouter();
  const supabase = createClient();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="inline ml-1 h-3 w-3 text-primary" />
      : <ArrowDown className="inline ml-1 h-3 w-3 text-primary" />;
  };

  const filtered = useMemo(() => {
    let result = initialStudents;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((r) => r.role === roleFilter);
    }
    if (tagFilter !== "all") {
      result = result.filter((r) => r.tags.some((t) => t.id === tagFilter));
    }

    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * (a.full_name || "").localeCompare(b.full_name || "", "fr");
        case "role":
          return dir * a.role.localeCompare(b.role, "fr");
        case "enrollments":
          return dir * (a.enrollments_count - b.enrollments_count);
        case "last_seen":
          return dir * ((a.last_seen_at || "").localeCompare(b.last_seen_at || ""));
        case "created_at":
          return dir * a.created_at.localeCompare(b.created_at);
        default:
          return 0;
      }
    });

    return result;
  }, [initialStudents, search, roleFilter, tagFilter, sortKey, sortDir]);

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleBulkRole = async (role: string) => {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .in("id", ids);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      toast.success(`${ids.length} utilisateur(s) → ${getRoleLabel(role as UserRole)}`);
      setSelected(new Set());
      router.refresh();
    }
  };

  const handleBulkTag = async (tagId: string) => {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    const inserts = ids.map((userId) => ({
      user_id: userId,
      tag_id: tagId,
    }));

    // Upsert pour éviter les doublons (ignore les conflits)
    const { error } = await supabase
      .from("user_tags")
      .upsert(inserts, { onConflict: "user_id,tag_id", ignoreDuplicates: true });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      const tagName = allTags.find((t) => t.id === tagId)?.name || "Tag";
      toast.success(`Tag "${tagName}" ajouté à ${ids.length} utilisateur(s)`);
      setSelected(new Set());
      router.refresh();
    }
  };

  const handleBulkEnroll = async (formationId: string) => {
    if (selected.size === 0) return;

    const ids = Array.from(selected);
    const inserts = ids.map((userId) => ({
      user_id: userId,
      formation_id: formationId,
    }));

    const { error } = await supabase
      .from("formation_enrollments")
      .upsert(inserts, { onConflict: "user_id,formation_id", ignoreDuplicates: true });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      const formTitle = allFormations.find((f) => f.id === formationId)?.title || "Formation";
      toast.success(`${ids.length} utilisateur(s) inscrit(s) à "${formTitle}"`);
      setSelected(new Set());
      router.refresh();
    }
  };

  const handleExportCSV = () => {
    const header = "Nom,Email,Téléphone,Rôle,Tags,Formations,Dernière activité,Inscription\n";
    const dataToExport = selected.size > 0
      ? filtered.filter((s) => selected.has(s.id))
      : filtered;
    const rows = dataToExport.map((s) =>
      [
        `"${s.full_name || ""}"`,
        s.email,
        s.phone || "",
        getRoleLabel(s.role),
        `"${s.tags.map((t) => t.name).join(", ")}"`,
        s.enrollments_count,
        s.last_seen_at ? new Date(s.last_seen_at).toLocaleDateString("fr-FR") : "",
        new Date(s.created_at).toLocaleDateString("fr-FR"),
      ].join(",")
    );

    const csv = header + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${dataToExport.length} utilisateur(s) exporté(s)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM — Suivi des élèves</h1>
          <p className="text-muted-foreground">{initialStudents.length} utilisateurs au total</p>
        </div>
        {currentUserRole === "admin" && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Exporter CSV
          </Button>
        )}
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
          <SelectTrigger className="w-[160px]">
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
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count + bulk actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} résultat(s)
          {selected.size > 0 && (
            <span className="ml-2 text-primary font-medium">
              — {selected.size} sélectionné(s)
            </span>
          )}
        </p>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            {currentUserRole === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserCog className="mr-2 h-3.5 w-3.5" />
                    Changer le rôle
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkRole("prospect")}>
                    Prospect
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkRole("member")}>
                    Membre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkRole("moderator")}>
                    Modérateur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkRole("admin")}>
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {allTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <TagIcon className="mr-2 h-3.5 w-3.5" />
                    Ajouter un tag
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {allTags.map((tag) => (
                    <DropdownMenuItem key={tag.id} onClick={() => handleBulkTag(tag.id)}>
                      <span
                        className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {allFormations.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookOpen className="mr-2 h-3.5 w-3.5" />
                    Inscrire à une formation
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto">
                  {allFormations.map((f) => (
                    <DropdownMenuItem key={f.id} onClick={() => handleBulkEnroll(f.id)}>
                      {f.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Students table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("name")}>
                    Utilisateur <SortIcon col="name" />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("role")}>
                    Rôle <SortIcon col="role" />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Phase</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Santé</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("enrollments")}>
                    Formations <SortIcon col="enrollments" />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("last_seen")}>
                    Dernière activité <SortIcon col="last_seen" />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("created_at")}>
                    Inscription <SortIcon col="created_at" />
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className={cn(
                      "hover:bg-accent/50 transition-colors",
                      selected.has(student.id) && "bg-primary/5"
                    )}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selected.has(student.id)}
                        onCheckedChange={() => toggleOne(student.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {getInitials(student.full_name || student.email)}
                            </AvatarFallback>
                          </Avatar>
                          {student.is_online && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-neon border border-card" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-[10px]", getRoleBadgeColor(student.role))}>
                        {getRoleLabel(student.role)}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {student.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px]"
                            style={{ borderColor: tag.color + "50", color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {student.coach_phase && PHASE_LABELS[student.coach_phase] ? (
                        <Badge variant="outline" className={cn("text-[10px]", PHASE_LABELS[student.coach_phase].color)}>
                          {PHASE_LABELS[student.coach_phase].label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {student.coach_health && HEALTH_ICONS[student.coach_health] ? (
                        <span className="text-sm" title={student.coach_health}>
                          {HEALTH_ICONS[student.coach_health]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm">{student.enrollments_count}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {student.last_seen_at ? timeAgo(student.last_seen_at) : "—"}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(student.created_at)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/crm/${student.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
