"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, ExternalLink, Search, FolderOpen, ChevronDown, ChevronRight,
  Link2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SOP, SOPDepartment } from "@/lib/types/database";

// ─── Constants ──────────────────────────────────────────

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

const TOOL_CATEGORIES: Record<string, { label: string; color: string }> = {
  vente: { label: "Vente", color: "bg-blue-400/20 text-blue-400" },
  ads: { label: "Publicité", color: "bg-orange-400/20 text-orange-400" },
  delivery: { label: "Delivery", color: "bg-turquoise/20 text-turquoise" },
  operations: { label: "Opérations", color: "bg-pink-400/20 text-pink-400" },
  contenu: { label: "Contenu", color: "bg-purple-400/20 text-purple-400" },
  finance: { label: "Finance", color: "bg-emerald-400/20 text-emerald-400" },
  autre: { label: "Autre", color: "bg-zinc-400/20 text-zinc-400" },
};

const ROLE_LABELS: Record<string, string> = {
  setter: "Setter",
  closer: "Closer",
  coach: "Coach / CSM",
  assistante: "Assistante",
  all: "Tous les rôles",
};

type RessourceTab = "sops" | "playbooks" | "outils";

// ─── Types ──────────────────────────────────────────────

interface Playbook {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  target_role: string;
  icon: string | null;
}

interface ToolLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  order: number;
}

interface RessourcesHubProps {
  sops: SOP[];
  playbooks: Playbook[];
  tools: ToolLink[];
  isAdmin: boolean;
}

// ─── Main Component ─────────────────────────────────────

export function RessourcesHub({ sops, playbooks, tools, isAdmin }: RessourcesHubProps) {
  const [activeTab, setActiveTab] = useState<RessourceTab>("sops");

  // For admin, just show SOPs (other tabs are separate admin pages via SubNav)
  if (isAdmin) {
    return <SOPsTab sops={sops} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ressources</h1>
        <p className="text-muted-foreground text-sm">Guides, playbooks et outils de l'équipe</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { value: "sops" as RessourceTab, label: "SOPs", icon: FolderOpen, count: sops.length },
          { value: "playbooks" as RessourceTab, label: "Playbooks", icon: ClipboardList, count: playbooks.length },
          { value: "outils" as RessourceTab, label: "Liens & Outils", icon: Link2, count: tools.length },
        ]).map(({ value, label, icon: Icon, count }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">{count}</Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === "sops" && <SOPsTab sops={sops} />}
      {activeTab === "playbooks" && <PlaybooksTab playbooks={playbooks} />}
      {activeTab === "outils" && <ToolsTab tools={tools} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOPS TAB
// ═══════════════════════════════════════════════════════════

function SOPsTab({ sops }: { sops: SOP[] }) {
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Aucune procédure disponible</h3>
          <p className="text-sm text-muted-foreground">Les SOPs seront disponibles ici prochainement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                <TabsTrigger key={key} value={key} className="text-xs px-2.5">{dept.label}</TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

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
                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-neon hover:underline">
                              <ExternalLink className="h-3 w-3" />{link.label}
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

// ═══════════════════════════════════════════════════════════
// PLAYBOOKS TAB
// ═══════════════════════════════════════════════════════════

function PlaybooksTab({ playbooks }: { playbooks: Playbook[] }) {
  if (playbooks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Aucun playbook disponible</h3>
          <p className="text-sm text-muted-foreground">Les playbooks seront disponibles ici prochainement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {playbooks.map((pb) => (
        <Link key={pb.id} href={`/playbook/${pb.slug}`}>
          <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-neon" />
                <CardTitle className="text-base">{pb.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pb.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pb.description}</p>
              )}
              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[pb.target_role] || pb.target_role}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OUTILS TAB
// ═══════════════════════════════════════════════════════════

function ToolsTab({ tools }: { tools: ToolLink[] }) {
  if (tools.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Aucun lien disponible</h3>
          <p className="text-sm text-muted-foreground">Les liens seront disponibles ici prochainement.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = tools.reduce<Record<string, ToolLink[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, catTools]) => {
        const catConfig = TOOL_CATEGORIES[cat] || TOOL_CATEGORIES.autre;
        return (
          <div key={cat} className="space-y-3">
            <Badge variant="outline" className={cn("text-xs", catConfig.color)}>{catConfig.label}</Badge>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {catTools.map((tool) => (
                <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="hover:border-neon/30 transition-colors h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {tool.title}
                        <ExternalLink className="h-3 w-3 text-neon shrink-0" />
                      </div>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
