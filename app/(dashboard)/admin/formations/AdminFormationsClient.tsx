"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Loader2,
  ImageIcon,
  Settings2,
  Copy,
  Download,
  BarChart3,
} from "lucide-react";
import { DifficultyLevel, Formation, FormationStatus } from "@/lib/types/database";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FormationWithCount extends Formation {
  enrolled_count: number;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-neon/20 text-neon border-neon/30",
  intermediate: "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusColors: Record<FormationStatus, string> = {
  draft: "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30",
  published: "bg-neon/20 text-neon border-neon/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function AdminFormationsClient({
  formations: initial,
}: {
  formations: FormationWithCount[];
}) {
  const [formations, setFormations] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FormationStatus>("draft");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const openCreateDialog = () => {
    setEditingFormation(null);
    setTitle("");
    setDescription("");
    setStatus("draft");
    setIsFree(false);
    setPrice("");
    setDifficulty("beginner");
    setCategory("");
    setDialogOpen(true);
  };

  const openEditDialog = (f: Formation) => {
    setEditingFormation(f);
    setTitle(f.title);
    setDescription(f.description || "");
    setStatus(f.status);
    setIsFree(f.is_free);
    setPrice(f.price ? String(f.price) : "");
    setDifficulty(f.difficulty);
    setCategory(f.category || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      is_free: isFree,
      price: isFree ? null : price ? parseFloat(price) : null,
      difficulty,
      category: category.trim() || null,
    };

    if (editingFormation) {
      const { error } = await supabase
        .from("formations")
        .update(data)
        .eq("id", editingFormation.id);

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else {
        toast.success("Formation mise à jour");
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("formations").insert({
        ...data,
        created_by: user?.id,
      });

      if (error) {
        toast.error("Erreur", { description: error.message });
      } else {
        toast.success("Formation créée");
      }
    }

    setSaving(false);
    setDialogOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("formations").delete().eq("id", id);
    setFormations((prev) => prev.filter((f) => f.id !== id));
    toast.success("Formation supprimée");
  };

  const handleDuplicate = async (formation: Formation) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Dupliquer la formation
    const { data: newFormation, error } = await supabase
      .from("formations")
      .insert({
        title: `${formation.title} (copie)`,
        description: formation.description,
        status: "draft" as FormationStatus,
        is_free: formation.is_free,
        price: formation.price,
        difficulty: formation.difficulty,
        category: formation.category,
        thumbnail_url: formation.thumbnail_url,
        order: formations.length,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error || !newFormation) {
      toast.error("Erreur lors de la duplication");
      setSaving(false);
      return;
    }

    // Dupliquer les modules
    const { data: modules } = await supabase
      .from("modules")
      .select("*")
      .eq("formation_id", formation.id)
      .order("order");

    if (modules && modules.length > 0) {
      await supabase.from("modules").insert(
        modules.map((m) => ({
          formation_id: newFormation.id,
          title: m.title,
          description: m.description,
          type: m.type,
          video_url: m.video_url,
          content: m.content,
          duration_minutes: m.duration_minutes,
          order: m.order,
          is_preview: m.is_preview,
        }))
      );
    }

    toast.success("Formation dupliquée");
    setSaving(false);
    router.refresh();
  };

  const handleExportProgress = async (formation: FormationWithCount) => {
    // Récupérer les inscriptions et progrès
    const [{ data: enrollments }, { data: modules }, { data: progress }] = await Promise.all([
      supabase
        .from("formation_enrollments")
        .select("user_id, enrolled_at, completed_at, user:profiles(full_name, email)")
        .eq("formation_id", formation.id),
      supabase
        .from("modules")
        .select("id, title")
        .eq("formation_id", formation.id)
        .order("order"),
      supabase
        .from("module_progress")
        .select("user_id, module_id, completed")
        .eq("formation_id", formation.id),
    ]);

    if (!enrollments?.length) {
      toast.error("Aucun inscrit à exporter");
      return;
    }

    const totalModules = modules?.length || 0;
    const header = "Nom,Email,Date inscription,Date complétion,Modules complétés,Total modules,Progression (%)\n";
    const rows = enrollments.map((e) => {
      const user = e.user as unknown as { full_name: string; email: string } | null;
      const userProgress = progress?.filter((p) => p.user_id === e.user_id && p.completed).length || 0;
      const percent = totalModules > 0 ? Math.round((userProgress / totalModules) * 100) : 0;

      return [
        `"${user?.full_name || ""}"`,
        user?.email || "",
        new Date(e.enrolled_at).toLocaleDateString("fr-FR"),
        e.completed_at ? new Date(e.completed_at).toLocaleDateString("fr-FR") : "",
        userProgress,
        totalModules,
        percent,
      ].join(",");
    });

    const csv = header + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-${formation.title.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${enrollments.length} inscription(s) exportée(s)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des formations</h1>
          <p className="text-muted-foreground">{formations.length} formation(s)</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une formation
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Formation</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Niveau</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Catégorie</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Inscrits</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Prix</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Créée le</th>
                  <th className="p-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formations.map((f) => (
                  <tr key={f.id} className="hover:bg-accent/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {f.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{f.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Select
                        value={f.status}
                        onValueChange={async (v) => {
                          await supabase.from("formations").update({ status: v }).eq("id", f.id);
                          setFormations((prev) => prev.map((x) => x.id === f.id ? { ...x, status: v as FormationStatus } : x));
                          toast.success("Statut mis à jour");
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-7 border-0 p-0">
                          <Badge variant="outline" className={cn("text-[10px] cursor-pointer", statusColors[f.status])}>
                            {f.status === "draft" ? "Brouillon" : f.status === "published" ? "Publié" : "Archivé"}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {f.difficulty && (
                        <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_COLORS[f.difficulty])}>
                          {DIFFICULTY_LABELS[f.difficulty] || f.difficulty}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {f.category ? (
                        <Badge variant="outline" className="text-[10px]">
                          {f.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {f.enrolled_count}
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm">{f.is_free ? "Gratuit" : f.price ? `${f.price}€` : "—"}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Modifier les infos"
                          onClick={() => openEditDialog(f)}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/admin/formations/${f.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Gérer les modules">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Dupliquer"
                          onClick={() => handleDuplicate(f)}
                          disabled={saving}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {f.enrolled_count > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Exporter les progrès"
                            onClick={() => handleExportProgress(f)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la formation ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Tous les modules et inscriptions seront supprimés.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(f.id)} className="bg-destructive text-white">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFormation ? "Modifier la formation" : "Nouvelle formation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#141414]" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#141414] min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FormationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Gratuit</Label>
              <Switch checked={isFree} onCheckedChange={setIsFree} />
            </div>
            {!isFree && (
              <div className="space-y-2">
                <Label>Prix (€)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-[#141414]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Niveau de difficulté</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Marketing, Développement, Design..."
                className="bg-[#141414]"
              />
            </div>
            <Button onClick={handleSave} disabled={!title.trim() || saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFormation ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
