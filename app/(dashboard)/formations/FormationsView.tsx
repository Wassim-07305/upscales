"use client";

import { useState, useMemo } from "react";
import { FormationsFilters, ViewMode, SortOption } from "./FormationsFilters";
import { FormationGrid, FormationData } from "@/components/formations/FormationGrid";

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
      <FormationGrid formations={sorted} userId={userId} viewMode={viewMode} />
    </>
  );
}
