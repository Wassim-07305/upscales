"use client";

import { useState, useMemo } from "react";
import { FormationsFilters, ViewMode, SortOption } from "./FormationsFilters";
import { FormationGrid, FormationData } from "@/components/formations/FormationGrid";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;

interface FormationsViewProps {
  formations: FormationData[];
  userId: string;
  currentFilter: string;
  currentSearch: string;
  currentDifficulty: string;
  currentDuration: string;
  currentCategory: string;
  categories: string[];
}

export function FormationsView({
  formations,
  userId,
  currentFilter,
  currentSearch,
  currentDifficulty,
  currentDuration,
  currentCategory,
  categories,
}: FormationsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    if (sortBy === "default") return formations;
    return [...formations].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title, "fr");
        case "duration":
          return b.totalDuration - a.totalDuration;
        case "rating":
          return b.averageRating - a.averageRating;
        case "enrolled":
          return b.enrolledCount - a.enrolledCount;
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [formations, sortBy]);

  return (
    <>
      <FormationsFilters
        currentFilter={currentFilter}
        currentSearch={currentSearch}
        currentDifficulty={currentDifficulty}
        currentDuration={currentDuration}
        currentCategory={currentCategory}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <FormationGrid formations={sorted.slice(0, visibleCount)} userId={userId} viewMode={viewMode} />
      {visibleCount < sorted.length && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          >
            Voir plus ({sorted.length - visibleCount} restante{sorted.length - visibleCount > 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </>
  );
}
