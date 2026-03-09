"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const filters = [
  { value: "recent", label: "Récents" },
  { value: "popular", label: "Populaires" },
  { value: "announcements", label: "Annonces" },
  { value: "mine", label: "Mes posts" },
];

export function CommunityFilters({ currentFilter }: { currentFilter: string }) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <Link
          key={f.value}
          href={`/community${f.value === "recent" ? "" : `?filter=${f.value}`}`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            currentFilter === f.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
