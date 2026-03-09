"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  MoreVertical,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Loader2,
} from "lucide-react";

interface PagesAdminClientProps {
  pages: LandingPage[];
}

export function PagesAdminClient({ pages: initialPages }: PagesAdminClientProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleCreate() {
    if (!title || !slug) return;
    setCreating(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("landing_pages")
        .insert({
          title,
          slug,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Page créée");
      setPages((prev) => [data, ...prev]);
      setCreateOpen(false);
      setTitle("");
      setSlug("");
      setDescription("");

      // Ouvrir directement l'éditeur
      router.push(`/admin/pages/${data.id}/edit`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la création";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(pageId: string) {
    if (!confirm("Supprimer cette page ?")) return;
    setDeletingId(pageId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("landing_pages")
        .delete()
        .eq("id", pageId);

      if (error) throw error;

      toast.success("Page supprimée");
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(page: LandingPage) {
    setTogglingId(page.id);

    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !page.is_active }),
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();
      toast.success(updated.is_active ? "Page publiée" : "Page dépubliée");
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, ...updated } : p))
      );
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setTogglingId(null);
    }
  }

  function copyUrl(slug: string) {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiée");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Landing Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et gérez vos pages de vente et de capture.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon text-background hover:bg-neon/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une landing page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Ma super page"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/p/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="ma-super-page"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description pour le SEO"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !title || !slug}
                className="w-full bg-neon text-background hover:bg-neon/90"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Créer et éditer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucune landing page</p>
          <p className="text-sm mt-1">Créez votre première page pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="gradient-border bg-card/50 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{page.title}</CardTitle>
                    <CardDescription className="text-xs mt-1 truncate">
                      /p/{page.slug}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        page.is_active
                          ? "bg-neon/20 text-neon border-neon/30"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {page.is_active ? "Publié" : "Brouillon"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/pages/${page.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(page)} disabled={togglingId === page.id}>
                          {page.is_active ? (
                            <><EyeOff className="h-4 w-4 mr-2" />Dépublier</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" />Publier</>
                          )}
                        </DropdownMenuItem>
                        {page.is_active && (
                          <DropdownMenuItem onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voir la page
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => copyUrl(page.slug)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier l&apos;URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(page.id)}
                          disabled={deletingId === page.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {page.description}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Ouvrir l&apos;éditeur
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
