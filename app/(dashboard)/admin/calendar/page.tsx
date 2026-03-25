"use client";

import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Users, Clock, MapPin, Loader2, CalendarDays, Download, ClipboardCheck, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session, SessionStatus } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatDateTime, formatTime } from "@/lib/utils/dates";
import { toast } from "sonner";
import { SubNav } from "@/components/layout/sub-nav";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function AdminCalendarPage() {
  const [sessions, setSessions] = useState<(Session & { participants_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxParts, setMaxParts] = useState("");
  const [color, setColor] = useState("#C6FF00");
  const [saving, setSaving] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<{
    id: string;
    user_id: string;
    attended: boolean;
    user: { full_name: string; email: string; avatar_url: string | null } | null;
  }[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("start_time", { ascending: false });

      if (data) {
        const sessionIds = data.map((s) => s.id);
        const { data: parts } = await supabase
          .from("session_participants")
          .select("session_id")
          .in("session_id", sessionIds);

        setSessions(
          data.map((s) => ({
            ...s,
            participants_count: parts?.filter((p) => p.session_id === s.id).length || 0,
          }))
        );
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setMaxParts("");
    setColor("#C6FF00");
    setDialogOpen(true);
  };

  const openEdit = (s: Session) => {
    setEditing(s);
    setTitle(s.title);
    setDescription(s.description || "");
    setStartTime(s.start_time.slice(0, 16));
    setEndTime(s.end_time.slice(0, 16));
    setLocation(s.location || "");
    setMaxParts(s.max_participants ? String(s.max_participants) : "");
    setColor(s.color);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !startTime || !endTime) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      location: location.trim() || null,
      max_participants: maxParts ? parseInt(maxParts) : null,
      color,
      host_id: user.id,
    };

    if (editing) {
      const { data: updated } = await supabase
        .from("sessions")
        .update(data)
        .eq("id", editing.id)
        .select()
        .single();
      if (updated) {
        setSessions((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...updated, participants_count: (s as any).participants_count } : s))
        );
        toast.success("Session mise à jour");
      }
    } else {
      const { data: created } = await supabase
        .from("sessions")
        .insert(data)
        .select()
        .single();
      if (created) {
        setSessions((prev) => [{ ...created, participants_count: 0 }, ...prev]);
        toast.success("Session créée");
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session supprimée");
  };

  const handleStatusChange = async (id: string, status: SessionStatus) => {
    await supabase.from("sessions").update({ status }).eq("id", id);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success("Statut mis à jour");
  };

  const handleExportParticipants = async (session: Session) => {
    const { data: participants } = await supabase
      .from("session_participants")
      .select("*, user:profiles!session_participants_user_id_fkey(full_name, email, phone)")
      .eq("session_id", session.id);

    if (!participants || participants.length === 0) {
      toast.error("Aucun participant à exporter");
      return;
    }

    const header = "Nom,Email,Téléphone,Inscrit le,Présent\n";
    const rows = participants.map((p) => {
      const user = p.user as unknown as { full_name: string; email: string; phone: string | null } | null;
      return [
        user?.full_name || "",
        user?.email || "",
        user?.phone || "",
        new Date(p.registered_at).toLocaleDateString("fr-FR"),
        p.attended ? "Oui" : "Non",
      ].join(",");
    });

    const csv = header + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants-${session.title.replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const openAttendance = async (session: Session) => {
    setAttendanceSession(session);
    setAttendanceOpen(true);
    setLoadingAttendance(true);

    const { data } = await supabase
      .from("session_participants")
      .select("id, user_id, attended, user:profiles!session_participants_user_id_fkey(full_name, email, avatar_url)")
      .eq("session_id", session.id);

    setParticipants(
      (data || []).map((p) => ({
        ...p,
        user: p.user as unknown as { full_name: string; email: string; avatar_url: string | null } | null,
      }))
    );
    setLoadingAttendance(false);
  };

  const toggleAttendance = async (participantId: string, attended: boolean) => {
    await supabase
      .from("session_participants")
      .update({ attended })
      .eq("id", participantId);

    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, attended } : p))
    );
  };

  const markAllPresent = async () => {
    if (!attendanceSession) return;
    await supabase
      .from("session_participants")
      .update({ attended: true })
      .eq("session_id", attendanceSession.id);

    setParticipants((prev) => prev.map((p) => ({ ...p, attended: true })));
    toast.success("Tous marqués comme présents");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sessions.findIndex((s) => s.id === active.id);
    const newIndex = sessions.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Swap start times between the two sessions
    const draggedSession = sessions[oldIndex];
    const targetSession = sessions[newIndex];

    const newStart = targetSession.start_time;
    const newEnd = targetSession.end_time;

    // Update dragged session with target's datetime
    await supabase
      .from("sessions")
      .update({ start_time: newStart, end_time: newEnd })
      .eq("id", draggedSession.id);

    // Update target with dragged session's datetime
    await supabase
      .from("sessions")
      .update({ start_time: draggedSession.start_time, end_time: draggedSession.end_time })
      .eq("id", targetSession.id);

    setSessions((prev) => {
      const updated = [...prev];
      updated[oldIndex] = { ...draggedSession, start_time: newStart, end_time: newEnd };
      updated[newIndex] = { ...targetSession, start_time: draggedSession.start_time, end_time: draggedSession.end_time };
      return updated;
    });

    toast.success("Créneaux échangés");
  };

  const statusColors: Record<SessionStatus, string> = {
    scheduled: "bg-turquoise/20 text-turquoise",
    completed: "bg-neon/20 text-neon",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <>
      <SubNav tabs={[{ label: "Calendrier", href: "/admin/calendar" }, { label: "Booking", href: "/admin/booking" }]} />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des sessions</h1>
          <p className="text-muted-foreground">{sessions.length} session(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucune session</p>
          <p className="text-sm mt-1">Créez votre première session pour commencer.</p>
        </div>
      ) : (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
      <div className="grid gap-3">
        {sessions.map((s) => (
          <SortableSessionCard key={s.id} id={s.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 h-14 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[s.status]}`}>
                        {s.status === "scheduled" ? "Planifiée" : s.status === "completed" ? "Terminée" : "Annulée"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(s.start_time)} — {formatTime(s.end_time)}
                      </span>
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s.participants_count || 0}{s.max_participants ? `/${s.max_participants}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v as SessionStatus)}>
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Planifiée</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openAttendance(s)}
                    title="Gérer les présences"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleExportParticipants(s)}
                    title="Exporter les participants"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </SortableSessionCard>
        ))}
      </div>
        </SortableContext>
      </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la session" : "Nouvelle session"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#141414]" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#141414]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Début</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-[#141414]" />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-[#141414]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lieu / Lien</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="URL Zoom ou lieu physique" className="bg-[#141414]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max participants</Label>
                <Input type="number" value={maxParts} onChange={(e) => setMaxParts(e.target.value)} className="bg-[#141414]" />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={!title.trim() || !startTime || !endTime || saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Présences — {attendanceSession?.title}
            </DialogTitle>
          </DialogHeader>
          {loadingAttendance ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun participant inscrit</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {participants.filter((p) => p.attended).length}/{participants.length} présent(s)
                </p>
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  Tous présents
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(p.user?.full_name || p.user?.email || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{p.user?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={p.attended}
                      onCheckedChange={(checked) => toggleAttendance(p.id, !!checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}

function SortableSessionCard({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? "z-50 shadow-lg" : ""}>
      <div className="flex">
        <button
          {...attributes}
          {...listeners}
          className="flex items-center px-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          title="Glisser pour échanger les créneaux"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </Card>
  );
}
