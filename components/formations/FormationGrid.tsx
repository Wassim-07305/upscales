"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FormationCard } from "./FormationCard";
import { FormationListItem } from "./FormationListItem";
import { Loader2 } from "lucide-react";
import { Formation } from "@/lib/types/database";

export interface FormationData extends Formation {
  moduleCount: number;
  totalDuration: number;
  enrolledCount: number;
  enrolled: boolean;
  progress: number;
  completed: boolean;
  averageRating: number;
  reviewCount: number;
  isFavorite: boolean;
}

interface FormationGridProps {
  formations: FormationData[];
  userId: string;
  pageSize?: number;
  viewMode?: "grid" | "list";
}

const PAGE_SIZE = 9;

export function FormationGrid({
  formations,
  userId,
  pageSize = PAGE_SIZE,
  viewMode = "grid",
}: FormationGridProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < formations.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + pageSize, formations.length));
    }
  }, [hasMore, pageSize, formations.length]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [formations.length, pageSize]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visible = formations.slice(0, visibleCount);

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
              moduleCount={formation.moduleCount}
              totalDuration={formation.totalDuration}
              enrolledCount={formation.enrolledCount}
              progress={formation.enrolled ? formation.progress : undefined}
              enrolled={formation.enrolled}
              averageRating={formation.averageRating}
              reviewCount={formation.reviewCount}
              isFavorite={formation.isFavorite}
              userId={userId}
              showFavorite
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((formation) => (
            <FormationListItem
              key={formation.id}
              formation={formation}
              userId={userId}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && formations.length > pageSize && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Toutes les formations ont ete chargees
        </p>
      )}

      {formations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune formation trouvee</p>
        </div>
      )}
    </>
  );
}
