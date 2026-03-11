"use client";

import { useState } from "react";
import { FormationsFilters, ViewMode } from "./FormationsFilters";
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
      />
      <FormationGrid formations={formations} userId={userId} viewMode={viewMode} />
    </>
  );
}
