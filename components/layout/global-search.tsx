"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/lib/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Users, MessageSquare, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "formation" | "post" | "user";
}

interface GlobalSearchProps {
  quickLinks: QuickLink[];
  placeholder?: string;
}

// ─── Component ──────────────────────────────────────────────

export function GlobalSearch({
  quickLinks,
  placeholder = "Rechercher...",
}: GlobalSearchProps) {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Raccourci clavier : Cmd+K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    },
    [searchOpen, setSearchOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset on close
  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const searchTerm = `%${query}%`;
      const allResults: SearchResult[] = [];

      // Search formations
      const { data: formations } = await supabase
        .from("formations")
        .select("id, title, description")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("is_published", true)
        .limit(5);

      if (formations) {
        formations.forEach((f) => {
          allResults.push({
            id: f.id,
            title: f.title,
            subtitle: f.description?.slice(0, 80) || undefined,
            href: `/formations/${f.id}`,
            type: "formation",
          });
        });
      }

      // Search posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, author:profiles!posts_author_id_fkey(full_name)")
        .ilike("content", searchTerm)
        .limit(5);

      if (posts) {
        posts.forEach((p) => {
          const authorName = (p.author as { full_name: string } | null)?.full_name || "Anonyme";
          allResults.push({
            id: p.id,
            title: p.content.slice(0, 60) + (p.content.length > 60 ? "..." : ""),
            subtitle: `Par ${authorName}`,
            href: `/community/${p.id}`,
            type: "post",
          });
        });
      }

      // Search users (profiles)
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      if (users) {
        users.forEach((u) => {
          allResults.push({
            id: u.id,
            title: u.full_name || u.email,
            subtitle: u.email,
            href: `/admin/crm/${u.id}`,
            type: "user",
          });
        });
      }

      setResults(allResults);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(href: string) {
    setSearchOpen(false);
    router.push(href);
  }

  const typeIcon = {
    formation: BookOpen,
    post: MessageSquare,
    user: Users,
  };

  const typeLabel = {
    formation: "Formations",
    post: "Posts",
    user: "Utilisateurs",
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Recherche"
      description="Rechercher des formations, posts et utilisateurs"
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>Aucun resultat pour &quot;{query}&quot;</CommandEmpty>
        )}

        {/* Search results */}
        {!loading &&
          (Object.keys(grouped) as Array<"formation" | "post" | "user">).map((type) => {
            const Icon = typeIcon[type];
            return (
              <CommandGroup key={type} heading={typeLabel[type]}>
                {grouped[type].map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle || ""}`}
                    onSelect={() => handleSelect(result.href)}
                    className="gap-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{result.title}</p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}

        {/* Quick links when no query */}
        {!query && (
          <>
            {results.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Navigation rapide">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <CommandItem
                    key={link.href}
                    onSelect={() => handleSelect(link.href)}
                    className="gap-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{link.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
