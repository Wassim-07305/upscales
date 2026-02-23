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
import { Plus, Pencil, Trash2, Hash, Lock, Loader2 } from "lucide-react";
import { Channel, ChannelType } from "@/lib/types/database";
import { toast } from "sonner";

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChannelType>("public");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("channels")
        .select("*")
        .neq("type", "dm")
        .order("created_at");
      setChannels(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setType("public");
    setIcon("");
    setDialogOpen(true);
  };

  const openEdit = (ch: Channel) => {
    setEditing(ch);
    setName(ch.name);
    setDescription(ch.description || "");
    setType(ch.type);
    setIcon(ch.icon || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      type,
      icon: icon.trim() || null,
    };

    if (editing) {
      const { data: updated } = await supabase
        .from("channels")
        .update(data)
        .eq("id", editing.id)
        .select()
        .single();
      if (updated) {
        setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Channel mis à jour");
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: created } = await supabase
        .from("channels")
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();
      if (created) {
        setChannels((prev) => [...prev, created]);
        toast.success("Channel créé");
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("channels").delete().eq("id", id);
    setChannels((prev) => prev.filter((c) => c.id !== id));
    toast.success("Channel supprimé");
  };

  const handleArchive = async (id: string, archived: boolean) => {
    await supabase.from("channels").update({ is_archived: archived }).eq("id", id);
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_archived: archived } : c))
    );
    toast.success(archived ? "Channel archivé" : "Channel restauré");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des channels</h1>
          <p className="text-muted-foreground">{channels.length} channel(s)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un channel
        </Button>
      </div>

      <div className="grid gap-3">
        {channels.map((ch) => (
          <Card key={ch.id} className={ch.is_archived ? "opacity-50" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ch.icon || (ch.type === "private" ? "🔒" : "#")}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{ch.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {ch.type === "public" ? "Public" : "Privé"}
                      </Badge>
                      {ch.is_archived && (
                        <Badge variant="outline" className="text-[10px] text-yellow-400">
                          Archivé
                        </Badge>
                      )}
                    </div>
                    {ch.description && (
                      <p className="text-sm text-muted-foreground">{ch.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ch)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleArchive(ch.id, !ch.is_archived)}
                  >
                    {ch.is_archived ? "Restaurer" : "Archiver"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(ch.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le channel" : "Nouveau channel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ChannelType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Privé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icône (emoji)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="💬" className="bg-secondary/50" />
            </div>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
