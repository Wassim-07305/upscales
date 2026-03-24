"use client";

import { useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import {
  Bug,
  Search,
  Check,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Globe,
  Zap,
  Hand,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  component_stack: string | null;
  page: string | null;
  route: string | null;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  source: string;
  severity: string;
  user_agent: string | null;
  viewport: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "error-boundary": { label: "React Crash", icon: XCircle, color: "text-red-400" },
  "unhandled-error": { label: "JS Error", icon: AlertTriangle, color: "text-orange-400" },
  "unhandled-rejection": { label: "Promise", icon: Zap, color: "text-yellow-400" },
  "api-error": { label: "API", icon: Globe, color: "text-blue-400" },
  manual: { label: "Manuel", icon: Hand, color: "text-purple-400" },
};

function extractFileFromStack(stack: string | null): string | null {
  if (!stack) return null;
  const match = stack.match(/at\s+.*?[(\s]((?:\/|https?:\/\/)[^\s):]+:\d+:\d+)/);
  if (match) {
    const parts = match[1].split("/");
    return parts.slice(-2).join("/").replace(/:\d+:\d+$/, "");
  }
  return null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function ErrorLogsClient({
  initialLogs,
  totalCount,
}: {
  initialLogs: ErrorLog[];
  totalCount: number;
}) {
  const [logs, setLogs] = useState<ErrorLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (!showResolved && log.resolved) return false;
      if (sourceFilter !== "all" && log.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.message.toLowerCase().includes(q) ||
          log.page?.toLowerCase().includes(q) ||
          log.user_email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, sourceFilter, showResolved]);

  // Stats
  const stats = useMemo(() => {
    const unresolvedLogs = logs.filter((l) => !l.resolved);
    const bySource: Record<string, number> = {};
    const byPage: Record<string, number> = {};
    for (const log of unresolvedLogs) {
      bySource[log.source] = (bySource[log.source] || 0) + 1;
      if (log.page) byPage[log.page] = (byPage[log.page] || 0) + 1;
    }
    const topPages = Object.entries(byPage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    return { total: unresolvedLogs.length, bySource, topPages };
  }, [logs]);

  async function handleRefresh() {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    setLoading(false);
  }

  async function handleResolve(ids: string[]) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("error_logs")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast.error("Erreur lors de la résolution");
      return;
    }
    setLogs((prev) =>
      prev.map((l) =>
        ids.includes(l.id)
          ? { ...l, resolved: true, resolved_at: new Date().toISOString() }
          : l
      )
    );
    setSelected(new Set());
    toast.success(`${ids.length} erreur(s) résolue(s)`);
  }

  async function handleDelete(ids: string[]) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("error_logs")
      .delete()
      .in("id", ids);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
    setSelected(new Set());
    toast.success(`${ids.length} erreur(s) supprimée(s)`);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  function exportMarkdown() {
    const unresolvedLogs = logs.filter((l) => !l.resolved);
    if (unresolvedLogs.length === 0) {
      toast.info("Aucune erreur non résolue à exporter");
      return;
    }

    // Deduplicate by message
    const grouped = new Map<string, { log: ErrorLog; count: number; pages: Set<string> }>();
    for (const log of unresolvedLogs) {
      const key = log.message;
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
        if (log.page) existing.pages.add(log.page);
      } else {
        grouped.set(key, {
          log,
          count: 1,
          pages: new Set(log.page ? [log.page] : []),
        });
      }
    }

    const entries = [...grouped.values()].sort((a, b) => b.count - a.count);
    const criticalCount = entries.filter((e) => e.log.severity === "critical").length;
    const uniquePages = new Set(unresolvedLogs.map((l) => l.page).filter(Boolean));

    let md = `# Error Report — ${new Date().toLocaleDateString("fr-FR")}\n\n`;
    md += `## Résumé\n\n`;
    md += `| Métrique | Valeur |\n|----------|--------|\n`;
    md += `| Erreurs totales | ${unresolvedLogs.length} |\n`;
    md += `| Erreurs uniques | ${entries.length} |\n`;
    md += `| Critiques | ${criticalCount} |\n`;
    md += `| Pages touchées | ${uniquePages.size} |\n\n`;

    md += `## Liste rapide\n\n`;
    for (const { log, count } of entries) {
      const file = extractFileFromStack(log.stack);
      const countStr = count > 1 ? ` (x${count})` : "";
      const fileStr = file ? ` — \`${file}\`` : "";
      const sev = log.severity === "critical" ? " 🔴" : "";
      md += `- ${sev}**${log.message.slice(0, 120)}**${countStr}${fileStr}\n`;
    }

    md += `\n## Détails par page\n\n`;
    const byPage = new Map<string, typeof entries>();
    for (const entry of entries) {
      const pages = entry.pages.size > 0 ? [...entry.pages] : ["(inconnue)"];
      for (const page of pages) {
        if (!byPage.has(page)) byPage.set(page, []);
        byPage.get(page)!.push(entry);
      }
    }

    for (const [page, pageEntries] of byPage) {
      md += `### ${page}\n\n`;
      for (const { log, count } of pageEntries) {
        const countStr = count > 1 ? ` (x${count})` : "";
        md += `<details>\n<summary>${log.message.slice(0, 120)}${countStr}</summary>\n\n`;
        md += `- **Source** : ${log.source}\n`;
        md += `- **Sévérité** : ${log.severity}\n`;
        md += `- **Dernier** : ${formatDate(log.created_at)}\n`;
        if (log.stack) {
          md += `\n\`\`\`\n${log.stack.slice(0, 2000)}\n\`\`\`\n`;
        }
        if (log.component_stack) {
          md += `\nComponent stack:\n\`\`\`\n${log.component_stack.slice(0, 1000)}\n\`\`\`\n`;
        }
        md += `\n</details>\n\n`;
      }
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport exporté");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-syne)]">
            Error Logs
          </h1>
          <p className="text-sm text-[#999]">{totalCount} erreurs enregistrées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportMarkdown}>
            <Download className="w-4 h-4 mr-2" />
            Exporter .md
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = stats.bySource[key] || 0;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${sourceFilter === key ? "border-[#C6FF00]/50" : ""}`}
              onClick={() => setSourceFilter(sourceFilter === key ? "all" : key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-xs text-[#999]">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top pages */}
      {stats.topPages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#999]">Pages les plus touchées</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {stats.topPages.map(([page, count]) => (
                <Badge key={page} variant="outline" className="font-mono text-xs">
                  {page} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <Input
            placeholder="Rechercher erreur, page, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#999] cursor-pointer">
          <Checkbox
            checked={showResolved}
            onCheckedChange={(v) => setShowResolved(!!v)}
          />
          Afficher résolues
        </label>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleResolve([...selected])}>
              <Check className="w-4 h-4 mr-1" />
              Résoudre ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-400 hover:text-red-300"
              onClick={() => handleDelete([...selected])}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-[#666]">
              {filtered.length} erreur(s) affichée(s)
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bug className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#666]">Aucune erreur trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((log) => {
            const config = SOURCE_CONFIG[log.source] || SOURCE_CONFIG.manual;
            const Icon = config.icon;
            const isExpanded = expanded.has(log.id);
            const file = extractFileFromStack(log.stack);

            return (
              <Card
                key={log.id}
                className={`transition-colors ${log.resolved ? "opacity-50" : ""} ${selected.has(log.id) ? "border-[#C6FF00]/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(log.id)}
                      onCheckedChange={() => toggleSelect(log.id)}
                      className="mt-1"
                    />
                    <button
                      onClick={() => toggleExpanded(log.id)}
                      className="mt-1 text-[#666] hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Icon className={`w-4 h-4 mt-1 shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white font-medium truncate">
                          {log.message.slice(0, 150)}
                        </p>
                        {log.severity === "critical" && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            CRITICAL
                          </Badge>
                        )}
                        {log.resolved && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-400 border-green-400/30">
                            Résolu
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#666]">
                        <span>{formatDate(log.created_at)}</span>
                        {log.page && <span className="font-mono">{log.page}</span>}
                        {file && <span className="font-mono text-[#555]">{file}</span>}
                        {log.user_email && <span>{log.user_email}</span>}
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-[#666]">Source</span>
                              <p className="text-white">{config.label}</p>
                            </div>
                            <div>
                              <span className="text-[#666]">Sévérité</span>
                              <p className="text-white">{log.severity}</p>
                            </div>
                            <div>
                              <span className="text-[#666]">Viewport</span>
                              <p className="text-white">{log.viewport || "—"}</p>
                            </div>
                            <div>
                              <span className="text-[#666]">User</span>
                              <p className="text-white">{log.user_email || "anonyme"}</p>
                            </div>
                          </div>
                          {log.stack && (
                            <div>
                              <p className="text-xs text-[#666] mb-1">Stack trace</p>
                              <pre className="text-xs text-[#999] bg-[#111] p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                          {log.component_stack && (
                            <div>
                              <p className="text-xs text-[#666] mb-1">Component stack</p>
                              <pre className="text-xs text-[#999] bg-[#111] p-3 rounded-lg overflow-x-auto max-h-32 overflow-y-auto font-mono">
                                {log.component_stack}
                              </pre>
                            </div>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <p className="text-xs text-[#666] mb-1">Metadata</p>
                              <pre className="text-xs text-[#999] bg-[#111] p-3 rounded-lg overflow-x-auto font-mono">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            {!log.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve([log.id])}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Résoudre
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => handleDelete([log.id])}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
