"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ExternalLink,
  Link2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import type { ToolLink, ToolCategory } from "@/lib/types/database";

const CATEGORIES: Record<ToolCategory, { label: string; color: string }> = {
  vente: { label: "Vente", color: "bg-blue-400/20 text-blue-400" },
  ads: { label: "Publicité", color: "bg-orange-400/20 text-orange-400" },
  delivery: { label: "Delivery", color: "bg-turquoise/20 text-turquoise" },
  operations: { label: "Opérations", color: "bg-pink-400/20 text-pink-400" },
  contenu: { label: "Contenu", color: "bg-purple-400/20 text-purple-400" },
  finance: { label: "Finance", color: "bg-emerald-400/20 text-emerald-400" },
  autre: { label: "Autre", color: "bg-zinc-400/20 text-zinc-400" },
};

interface ToolsAdminClientProps {
  tools: ToolLink[];
}

export function ToolsAdminClient({ tools: initial }: ToolsAdminClientProps) {
  const supabase = createClient();
  const [tools, setTools] = useState<ToolLink[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ToolLink | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ToolCategory>("autre");

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setUrl(""); setDescription(""); setCategory("autre");
    setShowModal(true);
  };

  const openEdit = (tool: ToolLink) => {
    setEditing(tool);
    setTitle(tool.title); setUrl(tool.url);
    setDescription(tool.description || ""); setCategory(tool.category);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error("Le titre et l'URL sont requis");
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      category,
    };

    if (editing) {
      const { error } = await supabase.from("tool_links").update(payload).eq("id", editing.id);
      if (error) {
        logSupabaseError("update tool", error);
        toast.error("Erreur de mise à jour");
      } else {
        setTools((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...payload } : t)));
        toast.success("Lien mis à jour");
      }
    } else {
      const { data, error } = await supabase
        .from("tool_links")
        .insert({ ...payload, order: tools.length })
        .select()
        .single();

      if (error) {
        logSupabaseError("create tool", error);
        toast.error("Erreur de création");
      } else {
        setTools((prev) => [...prev, data]);
        toast.success("Lien ajouté");
      }
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lien ?")) return;
    const { error } = await supabase.from("tool_links").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete tool", error);
      toast.error("Erreur");
    } else {
      setTools((prev) => prev.filter((t) => t.id !== id));
      toast.success("Lien supprimé");
    }
  };

  const togglePublish = async (tool: ToolLink) => {
    const { error } = await supabase
      .from("tool_links")
      .update({ is_published: !tool.is_published })
      .eq("id", tool.id);

    if (error) {
      logSupabaseError("toggle tool publish", error);
      toast.error("Erreur");
    } else {
      setTools((prev) => prev.map((t) => (t.id === tool.id ? { ...t, is_published: !t.is_published } : t)));
    }
  };

  // Group by category
  const grouped = tools.reduce<Record<string, ToolLink[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hub Liens & Outils</h1>
          <p className="text-muted-foreground text-sm">{tools.length} lien{tools.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un lien
        </Button>
      </div>

      {tools.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun lien</h3>
            <p className="text-sm text-muted-foreground">Ajoutez les liens vers vos outils et ressources.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, catTools]) => {
          const catConfig = CATEGORIES[cat as ToolCategory];
          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", catConfig.color)}>{catConfig.label}</Badge>
                <span className="text-xs text-muted-foreground">{catTools.length} lien{catTools.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {catTools.map((tool) => (
                  <Card key={tool.id} className={cn("group hover:border-neon/30 transition-colors", !tool.is_published && "opacity-50")}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <a href={tool.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold hover:text-neon transition-colors flex items-center gap-1.5">
                            {tool.title}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{tool.url}</p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button onClick={() => togglePublish(tool)} className="p-1.5 rounded hover:bg-white/10" title={tool.is_published ? "Masquer" : "Publier"}>
                            {tool.is_published ? <Eye className="h-3.5 w-3.5 text-neon" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                          <button onClick={() => openEdit(tool)} className="p-1.5 rounded hover:bg-white/10">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(tool.id)} className="p-1.5 rounded hover:bg-white/10">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le lien" : "Nouveau lien"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: iClosed" autoFocus />
            </div>
            <div>
              <Label>URL *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte..." />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ToolCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-neon text-black hover:bg-neon/90">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
