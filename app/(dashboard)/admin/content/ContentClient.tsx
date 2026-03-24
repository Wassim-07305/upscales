"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  Instagram,
  Youtube,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { logSupabaseError } from "@/lib/error-logger";
import type { VideoContent, VideoStatus, VideoPlatform } from "@/lib/types/database";

// ─── Config ─────────────────────────────────────────────────

interface StageConfig {
  value: VideoStatus;
  label: string;
  dotColor: string;
}

const STAGES: StageConfig[] = [
  { value: "idee", label: "Idée", dotColor: "bg-blue-400" },
  { value: "script_pret", label: "Script prêt", dotColor: "bg-amber-500" },
  { value: "tournage_pret", label: "Tournage prêt", dotColor: "bg-purple-500" },
  { value: "publie", label: "Publié", dotColor: "bg-emerald-500" },
];

const PLATFORMS: Record<VideoPlatform, { label: string; icon: typeof Instagram }> = {
  instagram: { label: "Instagram", icon: Instagram },
  youtube: { label: "YouTube", icon: Youtube },
  tiktok: { label: "TikTok", icon: Video },
  other: { label: "Autre", icon: Video },
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// ─── Video Card ─────────────────────────────────────────────

function VideoCard({
  video,
  isDragging,
  onDelete,
}: {
  video: VideoContent;
  isDragging?: boolean;
  onDelete?: () => void;
}) {
  const PlatformIcon = PLATFORMS[video.platform]?.icon || Video;

  return (
    <div
      className={cn(
        "bg-[#1C1C1C] border border-border rounded-xl p-3.5 group transition-all duration-200",
        isDragging
          ? "shadow-2xl opacity-90 rotate-1 scale-[1.03] ring-2 ring-neon/20"
          : "hover:border-neon/30 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0 cursor-grab opacity-40 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold truncate">{video.title}</p>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 text-transparent group-hover:text-muted-foreground hover:!text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] gap-1">
              <PlatformIcon className="w-3 h-3" />
              {PLATFORMS[video.platform]?.label}
            </Badge>
            {video.publish_date && (
              <span className="text-[11px] text-muted-foreground">
                {new Date(video.publish_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Draggable / Droppable ──────────────────────────────────

function DraggableVideo({ video, onDelete }: { video: VideoContent; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: video.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div ref={setNodeRef} style={{ ...style, touchAction: "none" }} {...listeners} {...attributes}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <VideoCard video={video} onDelete={onDelete} />
    </div>
  );
}

function StageColumn({ stage, videos, onDelete }: { stage: StageConfig; videos: VideoContent[]; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      <div className="flex items-center gap-2.5 px-2 mb-3 pb-3 border-b border-border">
        <div className={cn("w-2.5 h-2.5 rounded-full", stage.dotColor)} />
        <span className="text-xs font-bold uppercase tracking-wider">{stage.label}</span>
        <span className="text-[10px] font-mono font-semibold bg-white/5 border border-border px-1.5 py-0.5 rounded-md">
          {videos.length}
        </span>
      </div>
      <div className={cn(
        "flex-1 space-y-2.5 rounded-xl p-2 -m-2 transition-all duration-200",
        isOver && "bg-neon/5 ring-1 ring-inset ring-neon/20 shadow-inner",
      )}>
        {videos.map((v) => (
          <DraggableVideo key={v.id} video={v} onDelete={() => onDelete(v.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Calendar View ──────────────────────────────────────────

function CalendarView({ videos }: { videos: VideoContent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const videosByDate = useMemo(() => {
    const map: Record<string, VideoContent[]> = {};
    videos.forEach((v) => {
      if (!v.publish_date) return;
      const d = v.publish_date;
      if (!map[d]) map[d] = [];
      map[d].push(v);
    });
    return map;
  }, [videos]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {MONTHS_FR[month]} {year}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {DAYS_FR.map((d) => (
          <div key={d} className="bg-[#1C1C1C] p-2 text-center text-[11px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayVideos = dateStr ? (videosByDate[dateStr] || []) : [];
          const isToday = day && new Date().toISOString().split("T")[0] === dateStr;

          return (
            <div
              key={i}
              className={cn(
                "bg-[#141414] min-h-[80px] p-1.5",
                !day && "bg-[#0D0D0D]",
                isToday && "ring-1 ring-inset ring-neon/30",
              )}
            >
              {day && (
                <>
                  <span className={cn("text-[11px]", isToday ? "text-neon font-bold" : "text-muted-foreground")}>
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayVideos.map((v) => {
                      const PIcon = PLATFORMS[v.platform]?.icon || Video;
                      return (
                        <div key={v.id} className="flex items-center gap-1 px-1 py-0.5 rounded bg-white/5 text-[10px] truncate">
                          <PIcon className="w-2.5 h-2.5 shrink-0 text-neon" />
                          <span className="truncate">{v.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface ContentClientProps {
  videos: VideoContent[];
  userId: string;
}

export function ContentClient({ videos: initial, userId }: ContentClientProps) {
  const supabase = createClient();
  const [videos, setVideos] = useState<VideoContent[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState<VideoPlatform>("instagram");
  const [formDate, setFormDate] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formScript, setFormScript] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const videosByStage = useMemo(() => {
    const map = new Map<VideoStatus, VideoContent[]>();
    STAGES.forEach((s) => map.set(s.value, []));
    videos.forEach((v) => {
      const list = map.get(v.status);
      if (list) list.push(v);
    });
    return map;
  }, [videos]);

  const activeVideo = activeId ? videos.find((v) => v.id === activeId) ?? null : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const videoId = String(active.id);
    const newStatus = String(over.id) as VideoStatus;
    if (!STAGES.some((s) => s.value === newStatus)) return;

    const video = videos.find((v) => v.id === videoId);
    if (!video || video.status === newStatus) return;

    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: newStatus } : v)));

    const { error } = await supabase.from("video_content").update({ status: newStatus }).eq("id", videoId);
    if (error) {
      logSupabaseError("move video", error);
      toast.error("Erreur lors du déplacement");
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: video.status } : v)));
    }
  };

  const resetForm = () => {
    setFormTitle(""); setFormPlatform("instagram"); setFormDate(""); setFormDesc(""); setFormScript("");
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("video_content")
      .insert({
        title: formTitle.trim(),
        platform: formPlatform,
        publish_date: formDate || null,
        description: formDesc || null,
        script_notes: formScript || null,
        status: "idee",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError("create video", error);
      toast.error("Erreur de création");
    } else {
      setVideos((prev) => [...prev, data]);
      toast.success("Contenu ajouté");
      resetForm();
      setShowAdd(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce contenu ?")) return;
    const prev = videos;
    setVideos((p) => p.filter((v) => v.id !== id));

    const { error } = await supabase.from("video_content").delete().eq("id", id);
    if (error) {
      logSupabaseError("delete video", error);
      toast.error("Erreur de suppression");
      setVideos(prev);
    } else {
      toast.success("Contenu supprimé");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Production Vidéos</h1>
          <p className="text-muted-foreground text-sm">{videos.length} contenu{videos.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-neon text-black hover:bg-neon/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contenu
        </Button>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
              {STAGES.map((stage) => (
                <StageColumn
                  key={stage.value}
                  stage={stage}
                  videos={videosByStage.get(stage.value) ?? []}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <DragOverlay>
              {activeVideo ? (
                <div className="w-[240px]">
                  <VideoCard video={activeVideo} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView videos={videos} />
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau contenu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Titre de la vidéo" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plateforme</Label>
                <Select value={formPlatform} onValueChange={(v) => setFormPlatform(v as VideoPlatform)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORMS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de publication</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Sujet, angle..." />
            </div>
            <div>
              <Label>Notes de script</Label>
              <Textarea value={formScript} onChange={(e) => setFormScript(e.target.value)} rows={3} placeholder="Script, points clés..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white hover:text-white" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={saving || !formTitle.trim()} className="bg-neon text-black hover:bg-neon/90">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
