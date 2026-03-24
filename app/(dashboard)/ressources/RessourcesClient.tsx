"use client";

import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Search,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SOP, SOPDepartment } from "@/lib/types/database";

const DEPARTMENTS: Record<SOPDepartment, { label: string; color: string }> = {
  ceo: { label: "CEO", color: "bg-neon/20 text-neon" },
  sales: { label: "Sales", color: "bg-blue-400/20 text-blue-400" },
  delivery: { label: "Delivery", color: "bg-turquoise/20 text-turquoise" },
  publicite: { label: "Publicité", color: "bg-[#FFB800]/20 text-[#FFB800]" },
  contenu: { label: "Contenu", color: "bg-purple-400/20 text-purple-400" },
  equipe: { label: "Équipe", color: "bg-pink-400/20 text-pink-400" },
  tresorerie: { label: "Trésorerie", color: "bg-emerald-400/20 text-emerald-400" },
  operations: { label: "Opérations", color: "bg-orange-400/20 text-orange-400" },
};

interface RessourcesClientProps {
  sops: SOP[];
}

export function RessourcesClient({ sops }: RessourcesClientProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<"all" | SOPDepartment>("all");
  const [expandedSops, setExpandedSops] = useState<Set<string>>(new Set());

  const filtered = sops.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedByDept = filtered.reduce<Record<string, SOP[]>>((acc, sop) => {
    if (!acc[sop.department]) acc[sop.department] = [];
    acc[sop.department].push(sop);
    return acc;
  }, {});

  const toggleExpand = (id: string) => {
    setExpandedSops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (sops.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ressources</h1>
          <p className="text-muted-foreground">Procédures et guides</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucune ressource disponible</h3>
            <p className="text-sm text-muted-foreground">Les procédures seront disponibles ici prochainement.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ressources</h1>
        <p className="text-muted-foreground">Procédures et guides — {sops.length} document{sops.length > 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
        </div>
        <Tabs value={deptFilter} onValueChange={(v) => setDeptFilter(v as typeof deptFilter)}>
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="all" className="text-xs px-2.5">Tous</TabsTrigger>
            {Object.entries(DEPARTMENTS).map(([key, dept]) => {
              const count = sops.filter((s) => s.department === key).length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={key} value={key} className="text-xs px-2.5">
                  {dept.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* SOPs by department */}
      {Object.entries(groupedByDept).map(([dept, deptSops]) => {
        const deptConfig = DEPARTMENTS[dept as SOPDepartment];
        return (
          <div key={dept} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", deptConfig.color)}>{deptConfig.label}</Badge>
              <span className="text-xs text-muted-foreground">{deptSops.length} procédure{deptSops.length > 1 ? "s" : ""}</span>
            </div>
            {deptSops.map((sop) => {
              const isExpanded = expandedSops.has(sop.id);
              const links = (sop.external_links || []) as { label: string; url: string }[];
              return (
                <Card key={sop.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => toggleExpand(sop.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <BookOpen className="h-4 w-4 text-neon shrink-0" />
                      <CardTitle className="text-sm">{sop.title}</CardTitle>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
                      {sop.content && (
                        <div className="prose prose-sm prose-invert max-w-none mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {sop.content.replace(/<[^>]*>/g, "")}
                        </div>
                      )}
                      {links.length > 0 && (
                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Liens utiles :</p>
                          {links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-neon hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune ressource trouvée.</p>
      )}
    </div>
  );
}
