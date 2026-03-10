"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const filters = [
  { value: "recent", label: "Récents" },
  { value: "popular", label: "Populaires" },
  { value: "announcements", label: "Annonces" },
  { value: "mine", label: "Mes posts" },
];

export function CommunityFilters({
  currentFilter,
  currentSearch,
}: {
  currentFilter: string;
  currentSearch?: string;
}) {
  const router = useRouter();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    if (currentFilter !== "recent") params.set("filter", currentFilter);
    if (value.trim()) params.set("q", value.trim());
    const query = params.toString();
    router.push(`/community${query ? `?${query}` : ""}`);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les posts..."
          defaultValue={currentSearch || ""}
          onChange={(e) => {
            // Debounce search
            const value = e.target.value;
            const timeout = setTimeout(() => handleSearch(value), 400);
            return () => clearTimeout(timeout);
          }}
          className="pl-9 bg-[#141414] border-0"
        />
      </div>
      <div className="flex gap-2">
        {filters.map((f) => {
          const params = new URLSearchParams();
          if (f.value !== "recent") params.set("filter", f.value);
          if (currentSearch) params.set("q", currentSearch);
          const query = params.toString();

          return (
            <Link
              key={f.value}
              href={`/community${query ? `?${query}` : ""}`}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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
