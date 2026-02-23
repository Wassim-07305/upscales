"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  GripVertical,
  Pencil,
  Loader2,
  Save,
} from "lucide-react";
import { Formation, Module, ModuleType } from "@/lib/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeIcons: Record<ModuleType, typeof Video> = {
  video_upload: Video,
  video_embed: Video,
  text: FileText,
  quiz: HelpCircle,
};

const typeLabels: Record<ModuleType, string> = {
  video_upload: "Vidéo (upload)",
  video_embed: "Vidéo (embed)",
  text: "Texte",
  quiz: "Quiz",
};

export function FormationEditor({
  formation,
  initialModules,
}: {
  formation: Formation;
  initialModules: Module[];
}) {
  const [modules, setModules] = useState(initialModules);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleType, setModuleType] = useState<ModuleType>("video_upload");
  const [moduleVideoUrl, setModuleVideoUrl] = useState("");
  const [moduleContent, setModuleContent] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleIsPreview, setModuleIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const openAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleDescription("");
    setModuleType("video_upload");
    setModuleVideoUrl("");
    setModuleContent("");
    setModuleDuration("");
    setModuleIsPreview(false);
    setModuleDialogOpen(true);
  };

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleDescription(mod.description || "");
    setModuleType(mod.type);
    setModuleVideoUrl(mod.video_url || "");
    setModuleContent(mod.content || "");
    setModuleDuration(String(mod.duration_minutes || ""));
    setModuleIsPreview(mod.is_preview);
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) return;
    setSaving(true);

    const data = {
      formation_id: formation.id,
      title: moduleTitle.trim(),
      description: moduleDescription.trim() || null,
      type: moduleType,
      video_url: moduleVideoUrl.trim() || null,
      content: moduleContent.trim() || null,
      duration_minutes: moduleDuration ? parseInt(moduleDuration) : 0,
      is_preview: moduleIsPreview,
      order: editingModule ? editingModule.order : modules.length,
    };

    if (editingModule) {
      const { data: updated, error } = await supabase
        .from("modules")
        .update(data)
        .eq("id", editingModule.id)
        .select()
        .single();

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else if (updated) {
        setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Module mis à jour");
      }
    } else {
      const { data: created, error } = await supabase
        .from("modules")
        .insert(data)
        .select()
        .single();

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else if (created) {
        setModules((prev) => [...prev, created]);
        toast.success("Module ajouté");
      }
    }

    setSaving(false);
    setModuleDialogOpen(false);
  };

  const handleDeleteModule = async (moduleId: string) => {
    await supabase.from("modules").delete().eq("id", moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    toast.success("Module supprimé");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/formations"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour aux formations
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{formation.title}</h1>
        <p className="text-muted-foreground">Gérer les modules de cette formation</p>
      </div>

      {/* Modules list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Modules ({modules.length})</CardTitle>
          <Button size="sm" onClick={openAddModule}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un module
          </Button>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Aucun module. Ajoutez-en un pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod, index) => {
                const Icon = typeIcons[mod.type];
                return (
                  <div
                    key={mod.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1C1C1C] hover:bg-[#141414] transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex items-center justify-center w-7 h-7 rounded bg-secondary text-xs font-medium">
                      {index + 1}
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mod.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {typeLabels[mod.type]}
                        </Badge>
                        {mod.is_preview && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            Aperçu
                          </Badge>
                        )}
                        {mod.duration_minutes > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {mod.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditModule(mod)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteModule(mod.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Modifier le module" : "Nouveau module"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="bg-[#141414]" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                className="bg-[#141414] min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={moduleType} onValueChange={(v) => setModuleType(v as ModuleType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video_upload">Vidéo (upload)</SelectItem>
                  <SelectItem value="video_embed">Vidéo (embed URL)</SelectItem>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(moduleType === "video_upload" || moduleType === "video_embed") && (
              <div className="space-y-2">
                <Label>{moduleType === "video_upload" ? "URL de la vidéo (Supabase Storage)" : "URL embed (YouTube/Vimeo)"}</Label>
                <Input
                  value={moduleVideoUrl}
                  onChange={(e) => setModuleVideoUrl(e.target.value)}
                  placeholder={moduleType === "video_upload" ? "https://..." : "https://www.youtube.com/embed/..."}
                  className="bg-[#141414]"
                />
              </div>
            )}

            {moduleType === "text" && (
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={moduleContent}
                  onChange={(e) => setModuleContent(e.target.value)}
                  className="bg-[#141414] min-h-[120px]"
                  placeholder="Contenu du module (supporte le HTML)"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={moduleDuration}
                onChange={(e) => setModuleDuration(e.target.value)}
                className="bg-[#141414]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Accessible en aperçu (prospects)</Label>
              <input
                type="checkbox"
                checked={moduleIsPreview}
                onChange={(e) => setModuleIsPreview(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <Button
              onClick={handleSaveModule}
              disabled={!moduleTitle.trim() || saving}
              className="w-full"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModule ? "Mettre à jour" : "Ajouter le module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
