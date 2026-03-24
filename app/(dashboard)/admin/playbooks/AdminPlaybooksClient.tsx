"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import type { Playbook, PlaybookRole } from "@/lib/types/database";

const ROLES: Record<PlaybookRole, { label: string; color: string }> = {
  setter: { label: "Setter", color: "bg-blue-400/20 text-blue-400" },
  closer: { label: "Closer", color: "bg-purple-400/20 text-purple-400" },
  coach: { label: "Coach / CSM", color: "bg-turquoise/20 text-turquoise" },
  assistante: { label: "Assistante", color: "bg-pink-400/20 text-pink-400" },
  all: { label: "Tous les rôles", color: "bg-neon/20 text-neon" },
};

interface PlaybookWithCount extends Playbook {
  playbook_sections: { id: string }[];
}

interface AdminPlaybooksClientProps {
  playbooks: PlaybookWithCount[];
}

export function AdminPlaybooksClient({ playbooks: initial }: AdminPlaybooksClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [playbooks, setPlaybooks] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlaybookWithCount | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [targetRole, setTargetRole] = useState<PlaybookRole>("all");

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setTargetRole("all");
    setModalOpen(true);
  };

  const openEdit = (pb: PlaybookWithCount) => {
    setEditing(pb);
    setTitle(pb.title);
    setSlug(pb.slug);
    setDescription(pb.description || "");
    setTargetRole(pb.target_role);
    setModalOpen(true);
  };

  const generateSlug = (t: string) =>
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editing) setSlug(generateSlug(val));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Le titre et le slug sont requis");
      return;
    }
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("playbooks")
        .update({ title, slug, description: description || null, target_role: targetRole })
        .eq("id", editing.id);

      if (error) {
        logSupabaseError("update playbook", error);
        toast.error("Erreur lors de la mise à jour");
      } else {
        toast.success("Playbook mis à jour");
        setPlaybooks((prev) =>
          prev.map((p) =>
            p.id === editing.id
              ? { ...p, title, slug, description: description || null, target_role: targetRole }
              : p
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from("playbooks")
        .insert({
          title,
          slug,
          description: description || null,
          target_role: targetRole,
          order: playbooks.length,
        })
        .select("*, playbook_sections(id)")
        .single();

      if (error) {
        logSupabaseError("create playbook", error);
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Playbook créé");
        setPlaybooks((prev) => [...prev, data]);
      }
    }

    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("playbooks").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete playbook", error);
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Playbook supprimé");
      setPlaybooks((prev) => prev.filter((p) => p.id !== id));
    }
    setDeleting(null);
  };

  const togglePublish = async (pb: PlaybookWithCount) => {
    const { error } = await supabase
      .from("playbooks")
      .update({ is_published: !pb.is_published })
      .eq("id", pb.id);

    if (error) {
      logSupabaseError("toggle playbook publish", error);
      toast.error("Erreur");
    } else {
      setPlaybooks((prev) =>
        prev.map((p) => (p.id === pb.id ? { ...p, is_published: !p.is_published } : p))
      );
      toast.success(pb.is_published ? "Playbook dépublié" : "Playbook publié");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Playbooks</h1>
          <p className="text-muted-foreground">
            Operating Systems par rôle — {playbooks.length} playbook{playbooks.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau playbook
        </Button>
      </div>

      {playbooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucun playbook</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier playbook pour structurer les processus par rôle.
            </p>
            <Button onClick={openCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer un playbook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((pb) => {
            const roleConfig = ROLES[pb.target_role];
            const sectionCount = pb.playbook_sections?.length || 0;
            return (
              <Card
                key={pb.id}
                className="group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/playbooks/${pb.id}/edit`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-neon shrink-0" />
                      <CardTitle className="text-base">{pb.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/playbook/${pb.slug}`, "_blank");
                        }}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        title="Voir côté membre"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublish(pb);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        title={pb.is_published ? "Dépublier" : "Publier"}
                      >
                        {pb.is_published ? (
                          <Eye className="h-4 w-4 text-neon" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(pb);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Supprimer ce playbook et tout son contenu ?")) handleDelete(pb.id);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        disabled={deleting === pb.id}
                      >
                        {deleting === pb.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {pb.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pb.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("text-xs", roleConfig.color)}>
                      {roleConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {sectionCount} section{sectionCount > 1 ? "s" : ""}
                    </Badge>
                    {pb.is_published ? (
                      <Badge variant="outline" className="text-xs bg-neon/10 text-neon border-neon/30">
                        Publié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Brouillon
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le playbook" : "Nouveau playbook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="ex: Setter OS"
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: setter-os"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du playbook..."
                rows={3}
              />
            </div>
            <div>
              <Label>Rôle cible</Label>
              <Select value={targetRole} onValueChange={(v) => setTargetRole(v as PlaybookRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-neon text-black hover:bg-neon/90"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
