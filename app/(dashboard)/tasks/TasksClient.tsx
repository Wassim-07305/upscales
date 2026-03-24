"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Star,
  StarOff,
  CalendarDays,
  ListTodo,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logSupabaseError } from "@/lib/error-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types/database";

// ─── Schema ──────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  due_date: z.string().optional(),
  is_top_priority: z.boolean(),
});
type TaskForm = z.infer<typeof taskSchema>;

// ─── Helpers ─────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  high: { label: "Haute", color: "text-red-400 bg-red-400/10", icon: ArrowUpCircle },
  medium: { label: "Moyenne", color: "text-[#FFB800] bg-[#FFB800]/10", icon: ArrowRightCircle },
  low: { label: "Basse", color: "text-blue-400 bg-blue-400/10", icon: ArrowDownCircle },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Circle }> = {
  todo: { label: "À faire", icon: Circle },
  done: { label: "Terminé", icon: CheckCircle2 },
};

function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff < -1) return `Il y a ${Math.abs(diff)}j`;
  if (diff <= 7) return `Dans ${diff}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isDueOverdue(date: string | null): boolean {
  if (!date) return false;
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// ─── Component ───────────────────────────────────────────────

interface TasksClientProps {
  tasks: Task[];
  userId: string;
}

export function TasksClient({ tasks: initialTasks, userId }: TasksClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const topPriorities = initialTasks.filter((t) => t.is_top_priority && t.status !== "done");
  const filteredTasks = initialTasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const todoCount = initialTasks.filter((t) => t.status === "todo").length;
  const doneToday = initialTasks.filter((t) => {
    if (t.status !== "done" || !t.completed_at) return false;
    const today = new Date().toISOString().slice(0, 10);
    return t.completed_at.slice(0, 10) === today;
  }).length;

  // ─── Toggle status ──────────────────────────────────────

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const updates: Partial<Task> = {
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) { logSupabaseError("tasks.toggleStatus", error); toast.error(error.message || "Erreur de mise à jour"); }
    else router.refresh();
  };

  // ─── Toggle top priority ────────────────────────────────

  const handleToggleTopPriority = async (task: Task) => {
    const currentTopCount = initialTasks.filter((t) => t.is_top_priority && t.id !== task.id).length;
    if (!task.is_top_priority && currentTopCount >= 3) {
      toast.error("Maximum 3 priorités du jour");
      return;
    }
    const { error } = await supabase
      .from("tasks")
      .update({ is_top_priority: !task.is_top_priority })
      .eq("id", task.id);
    if (error) { logSupabaseError("tasks.togglePriority", error); toast.error(error.message || "Erreur de mise à jour"); }
    else router.refresh();
  };

  // ─── Delete ──────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    setLoading(true);
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { logSupabaseError("tasks.delete", error); toast.error(error.message || "Erreur lors de la suppression"); }
    else {
      toast.success("Tâche supprimée");
      router.refresh();
    }
    setLoading(false);
  };

  // ─── Quick add ──────────────────────────────────────────

  const [quickAdd, setQuickAdd] = useState("");
  const handleQuickAdd = async () => {
    if (!quickAdd.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      title: quickAdd.trim(),
      status: "todo",
      priority: "medium",
      user_id: userId,
    });
    if (error) {
      logSupabaseError("tasks.quickAdd", error);
      toast.error(error.message || "Erreur de création");
    } else {
      setQuickAdd("");
      toast.success("Tâche ajoutée");
      router.refresh();
    }
  };

  // ─── Task row ───────────────────────────────────────────

  function TaskRow({ task }: { task: Task }) {
    const priority = PRIORITY_CONFIG[task.priority];
    const PriorityIcon = priority.icon;
    const isDone = task.status === "done";
    const overdue = !isDone && isDueOverdue(task.due_date);
    const dueLabel = formatDueDate(task.due_date);

    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50",
          isDone && "opacity-50"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggleStatus(task)}
          className="shrink-0"
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-neon transition-colors" />
          )}
        </button>

        {/* Title */}
        <span className={cn("flex-1 text-sm truncate", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </span>

        {/* Top priority star */}
        <button
          onClick={() => handleToggleTopPriority(task)}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {task.is_top_priority ? (
            <Star className="h-4 w-4 text-[#FFB800] fill-[#FFB800]" />
          ) : (
            <StarOff className="h-4 w-4 text-muted-foreground hover:text-[#FFB800]" />
          )}
        </button>

        {/* Priority badge */}
        <Badge variant="outline" className={cn("text-[10px] shrink-0", priority.color)}>
          <PriorityIcon className="h-3 w-3 mr-1" />
          {priority.label}
        </Badge>

        {/* Due date */}
        {dueLabel && (
          <span className={cn("text-xs shrink-0", overdue ? "text-red-400 font-medium" : "text-muted-foreground")}>
            <CalendarDays className="h-3 w-3 inline mr-1" />
            {dueLabel}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setModal({ open: true, task })}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-300"
            onClick={() => handleDelete(task.id)}
            disabled={loading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────

  if (initialTasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes tâches</h1>
          <p className="text-muted-foreground">Organisez votre journée</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Aucune tâche</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première tâche pour commencer à organiser votre journée.
            </p>
            <Button onClick={() => setModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </CardContent>
        </Card>
        <TaskFormModal
          open={modal.open}
          onClose={() => setModal({ open: false })}
          supabase={supabase}
          userId={userId}
          onSuccess={() => { setModal({ open: false }); router.refresh(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes tâches</h1>
          <p className="text-muted-foreground">Organisez votre journée</p>
        </div>
        <Button onClick={() => setModal({ open: true })} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon/10">
              <Circle className="h-4 w-4 text-neon" />
            </div>
            <div>
              <p className="text-xl font-bold">{todoCount}</p>
              <p className="text-xs text-muted-foreground">À faire</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-400/10">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{doneToday}</p>
              <p className="text-xs text-muted-foreground">Terminées aujourd&apos;hui</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder="Ajouter une tâche rapidement..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
        />
        <Button onClick={handleQuickAdd} variant="outline" disabled={!quickAdd.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Top 3 priorities */}
      {topPriorities.length > 0 && (
        <Card className="border-neon/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-[#FFB800] fill-[#FFB800]" />
              Top priorités du jour
              <Badge variant="outline" className="text-[10px] ml-1">{topPriorities.length}/3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topPriorities.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* All tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              Toutes les tâches
            </CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2.5 h-6">Tout</TabsTrigger>
                <TabsTrigger value="todo" className="text-xs px-2.5 h-6">À faire</TabsTrigger>
                <TabsTrigger value="done" className="text-xs px-2.5 h-6">Terminé</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune tâche dans cette catégorie.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <TaskFormModal
        open={modal.open}
        task={modal.task}
        onClose={() => setModal({ open: false })}
        supabase={supabase}
        userId={userId}
        onSuccess={() => { setModal({ open: false }); router.refresh(); }}
      />
    </div>
  );
}

// ─── Task Form Modal ─────────────────────────────────────────

function TaskFormModal({
  open,
  task,
  onClose,
  supabase,
  userId,
  onSuccess,
}: {
  open: boolean;
  task?: Task;
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
  userId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          due_date: task.due_date || "",
          is_top_priority: task.is_top_priority,
        }
      : {
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          is_top_priority: false,
        },
  });

  const onSubmit = async (data: TaskForm) => {
    setLoading(true);
    const payload = {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_date: data.due_date || null,
      is_top_priority: data.is_top_priority,
    };

    if (task) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
      if (error) { logSupabaseError("tasks.update", error); toast.error(error.message || "Erreur de mise à jour"); setLoading(false); return; }
      toast.success("Tâche mise à jour");
    } else {
      const { error } = await supabase.from("tasks").insert({ ...payload, status: "todo", user_id: userId });
      if (error) { logSupabaseError("tasks.create", error); toast.error(error.message || "Erreur de création"); setLoading(false); return; }
      toast.success("Tâche créée");
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input {...form.register("title")} placeholder="Ex: Préparer le rapport hebdomadaire" />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea {...form.register("description")} placeholder="Détails..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priorité</Label>
              <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Haute</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="low">🔵 Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date d&apos;échéance</Label>
              <Input type="date" {...form.register("due_date")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_top_priority"
              {...form.register("is_top_priority")}
              className="rounded border-border"
            />
            <Label htmlFor="is_top_priority" className="text-sm font-normal cursor-pointer">
              <Star className="h-3.5 w-3.5 inline text-[#FFB800] mr-1" />
              Marquer comme priorité du jour (max 3)
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-neon text-black hover:bg-neon/90">
              {loading ? "..." : task ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
