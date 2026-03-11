"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "Toutes" },
  { value: "favorites", label: "Favoris" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminées" },
  { value: "free", label: "Gratuites" },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  all: "Tous niveaux",
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

const DURATION_LABELS: Record<string, string> = {
  all: "Toute durée",
  short: "< 1h",
  medium: "1-3h",
  long: "> 3h",
};

export type ViewMode = "grid" | "list";

interface FormationsFiltersProps {
  currentFilter: string;
  currentSearch: string;
  currentDifficulty?: string;
  currentDuration?: string;
  currentCategory?: string;
  categories?: string[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function FormationsFilters({
  currentFilter,
  currentSearch,
  currentDifficulty = "all",
  currentDuration = "all",
  currentCategory = "all",
  categories = [],
  viewMode = "grid",
  onViewModeChange,
}: FormationsFiltersProps) {
  const [search, setSearch] = useState(currentSearch);
  const [showAdvanced, setShowAdvanced] = useState(
    currentDifficulty !== "all" ||
      currentDuration !== "all" ||
      currentCategory !== "all"
  );
  const router = useRouter();

  const buildUrl = (overrides: Record<string, string> = {}) => {
    const values = {
      filter: currentFilter,
      q: currentSearch,
      difficulty: currentDifficulty,
      duration: currentDuration,
      category: currentCategory,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (values.filter && values.filter !== "all")
      params.set("filter", values.filter);
    if (values.q) params.set("q", values.q);
    if (values.difficulty && values.difficulty !== "all")
      params.set("difficulty", values.difficulty);
    if (values.duration && values.duration !== "all")
      params.set("duration", values.duration);
    if (values.category && values.category !== "all")
      params.set("category", values.category);
    const qs = params.toString();
    return `/formations${qs ? `?${qs}` : ""}`;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    router.push(buildUrl({ q: value }));
  };

  const activeAdvancedCount = [
    currentDifficulty !== "all",
    currentDuration !== "all",
    currentCategory !== "all",
  ].filter(Boolean).length;

  const handleClearAdvanced = () => {
    router.push(
      buildUrl({ difficulty: "all", duration: "all", category: "all" })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-[#141414] border-0"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <Link key={f.value} href={buildUrl({ filter: f.value })}>
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1.5 cursor-pointer text-sm font-medium transition-colors",
                  currentFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {f.label}
              </Badge>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5",
              showAdvanced && "text-primary"
            )}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {activeAdvancedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                {activeAdvancedCount}
              </span>
            )}
          </Button>
          {onViewModeChange && (
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          <Select
            value={currentDifficulty}
            onValueChange={(v) => router.push(buildUrl({ difficulty: v }))}
          >
            <SelectTrigger className="w-[160px] bg-[#141414] border-0 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDuration}
            onValueChange={(v) => router.push(buildUrl({ duration: v }))}
          >
            <SelectTrigger className="w-[140px] bg-[#141414] border-0 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DURATION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select
              value={currentCategory}
              onValueChange={(v) => router.push(buildUrl({ category: v }))}
            >
              <SelectTrigger className="w-[160px] bg-[#141414] border-0 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeAdvancedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={handleClearAdvanced}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
