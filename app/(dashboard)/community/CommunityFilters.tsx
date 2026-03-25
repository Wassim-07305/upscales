"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Hash, X } from "lucide-react";
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
  currentTag,
  popularTags,
}: {
  currentFilter: string;
  currentSearch?: string;
  currentTag?: string;
  popularTags?: string[];
}) {
  const router = useRouter();

  const buildUrl = (overrides: { filter?: string; q?: string; tag?: string | null }) => {
    const params = new URLSearchParams();
    const f = overrides.filter ?? currentFilter;
    const q = overrides.q ?? currentSearch;
    const t = "tag" in overrides ? overrides.tag : currentTag;
    if (f && f !== "recent") params.set("filter", f);
    if (q) params.set("q", q);
    if (t) params.set("tag", t);
    const query = params.toString();
    return `/community${query ? `?${query}` : ""}`;
  };

  const handleSearch = (value: string) => {
    router.push(buildUrl({ q: value.trim() || undefined }));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les posts..."
          defaultValue={currentSearch || ""}
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(() => handleSearch(value), 400);
            return () => clearTimeout(timeout);
          }}
          className="pl-9 bg-[#141414] border-0"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={buildUrl({ filter: f.value })}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              currentFilter === f.value && !currentTag
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Hashtags populaires */}
      {((popularTags && popularTags.length > 0) || currentTag) && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          {/* Always show active tag first for deselection */}
          {currentTag && !(popularTags || []).includes(currentTag) && (
            <Link
              href={buildUrl({ tag: null })}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-neon text-black transition-colors"
            >
              #{currentTag}
              <X className="h-3 w-3 ml-1 inline" />
            </Link>
          )}
          {(popularTags || []).map((tag) => (
            <Link
              key={tag}
              href={currentTag === tag ? buildUrl({ tag: null }) : buildUrl({ tag })}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                currentTag === tag
                  ? "bg-neon text-black"
                  : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              )}
            >
              #{tag}
              {currentTag === tag && <X className="h-3 w-3 ml-1 inline" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
