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
import { Plus, Pencil, Trash2, Users, Clock, MapPin, Loader2, CalendarDays } from "lucide-react";
import { Session, SessionStatus } from "@/lib/types/database";
import { formatDateTime, formatTime } from "@/lib/utils/dates";
import { toast } from "sonner";

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

  const statusColors: Record<SessionStatus, string> = {
    scheduled: "bg-turquoise/20 text-turquoise",
    completed: "bg-neon/20 text-neon",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
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
      <div className="grid gap-3">
        {sessions.map((s) => (
          <Card key={s.id}>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
    </div>
  );
}
