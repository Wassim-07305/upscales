"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ExternalLink } from "lucide-react";
import { Profile, Tag, UserRole } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate, timeAgo } from "@/lib/utils/dates";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import { cn } from "@/lib/utils";

interface StudentData extends Profile {
  tags: Tag[];
  enrollments_count: number;
}

interface CRMClientProps {
  initialStudents: StudentData[];
  allTags: Tag[];
  currentUserRole: UserRole;
}

export function CRMClient({ initialStudents, allTags, currentUserRole }: CRMClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

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

    return result;
  }, [initialStudents, search, roleFilter, tagFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM — Suivi des élèves</h1>
        <p className="text-muted-foreground">{initialStudents.length} utilisateurs au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-0"
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">{filtered.length} résultat(s)</p>

      {/* Students table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Utilisateur</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Formations</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Dernière activité</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Inscription</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-accent/50 transition-colors">
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
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-card" />
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
