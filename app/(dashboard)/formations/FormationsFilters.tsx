"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { value: "all", label: "Toutes" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminées" },
  { value: "free", label: "Gratuites" },
];

export function FormationsFilters({
  currentFilter,
  currentSearch,
}: {
  currentFilter: string;
  currentSearch: string;
}) {
  const [search, setSearch] = useState(currentSearch);
  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams();
    if (currentFilter !== "all") params.set("filter", currentFilter);
    if (value) params.set("q", value);
    const qs = params.toString();
    router.push(`/formations${qs ? `?${qs}` : ""}`);
  };

  return (
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
      <div className="flex gap-2">
        {filters.map((f) => {
          const params = new URLSearchParams();
          if (f.value !== "all") params.set("filter", f.value);
          if (currentSearch) params.set("q", currentSearch);
          const qs = params.toString();

          return (
            <Link
              key={f.value}
              href={`/formations${qs ? `?${qs}` : ""}`}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                currentFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
