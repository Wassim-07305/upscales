"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const filters = [
  { value: "all", label: "Toutes" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminées" },
  { value: "free", label: "Gratuites" },
];

export function FormationsFilters({ currentFilter }: { currentFilter: string }) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <Link
          key={f.value}
          href={`/formations${f.value === "all" ? "" : `?filter=${f.value}`}`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            currentFilter === f.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
