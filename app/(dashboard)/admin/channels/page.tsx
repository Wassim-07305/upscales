"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Loader2, Users, UserMinus, Hash } from "lucide-react";
import { Channel, ChannelType } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { timeAgo } from "@/lib/utils/dates";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/actions/audit";
import { SubNav } from "@/components/layout/sub-nav";

interface ChannelWithCount extends Channel {
  members_count: number;
}

interface ChannelMember {
  id: string;
  user_id: string;
  joined_at: string;
  user: { full_name: string; email: string; avatar_url: string | null } | null;
}

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<ChannelWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChannelType>("public");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);

  // Members management
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersChannel, setMembersChannel] = useState<ChannelWithCount | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("channels")
        .select("*")
        .neq("type", "dm")
        .order("created_at");

      if (data) {
        const channelIds = data.map((c) => c.id);
        const { data: memberCounts } = await supabase
          .from("channel_members")
          .select("channel_id")
          .in("channel_id", channelIds);

        setChannels(
          data.map((c) => ({
            ...c,
            members_count: memberCounts?.filter((m) => m.channel_id === c.id).length || 0,
          }))
        );
      }
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
        setChannels((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...updated, members_count: c.members_count } : c))
        );
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
        setChannels((prev) => [...prev, { ...created, members_count: 0 }]);
        await logAuditAction("channel.create", "channel", created.id, { name: data.name, type: data.type });
        toast.success("Channel créé");
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const channel = channels.find((c) => c.id === id);
    await supabase.from("channels").delete().eq("id", id);
    await logAuditAction("channel.delete", "channel", id, { name: channel?.name });
    setChannels((prev) => prev.filter((c) => c.id !== id));
    toast.success("Channel supprimé");
  };

  const handleArchive = async (id: string, archived: boolean) => {
    const channel = channels.find((c) => c.id === id);
    await supabase.from("channels").update({ is_archived: archived }).eq("id", id);
    await logAuditAction(archived ? "channel.archive" : "channel.restore", "channel", id, { name: channel?.name });
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_archived: archived } : c))
    );
    toast.success(archived ? "Channel archivé" : "Channel restauré");
  };

  const openMembers = async (channel: ChannelWithCount) => {
    setMembersChannel(channel);
    setMembersOpen(true);
    setLoadingMembers(true);

    const { data } = await supabase
      .from("channel_members")
      .select("id, user_id, joined_at, user:profiles!channel_members_user_id_fkey(full_name, email, avatar_url)")
      .eq("channel_id", channel.id)
      .order("joined_at", { ascending: false });

    setMembers(
      (data || []).map((m) => ({
        ...m,
        user: m.user as unknown as ChannelMember["user"],
      }))
    );
    setLoadingMembers(false);
  };

  const removeMember = async (memberId: string, userId: string) => {
    await supabase.from("channel_members").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (membersChannel) {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === membersChannel.id
            ? { ...c, members_count: Math.max(0, c.members_count - 1) }
            : c
        )
      );
    }
    toast.success("Membre retiré du channel");
  };

  if (loading) {
    return (
      <>
        <SubNav tabs={[{ label: "Paramètres", href: "/admin/settings" }, { label: "Équipe", href: "/admin/team" }, { label: "Channels", href: "/admin/channels" }, { label: "Modération", href: "/admin/moderation" }, { label: "Base IA", href: "/admin/ai" }, { label: "SOPs", href: "/admin/sops" }, { label: "Outils", href: "/admin/tools" }, { label: "Audit", href: "/admin/audit" }, { label: "Logs", href: "/admin/error-logs" }, { label: "Profil", href: "/profile" }]} />
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
    <SubNav tabs={[{ label: "Paramètres", href: "/admin/settings" }, { label: "Équipe", href: "/admin/team" }, { label: "Channels", href: "/admin/channels" }, { label: "Modération", href: "/admin/moderation" }, { label: "Base IA", href: "/admin/ai" }, { label: "SOPs", href: "/admin/sops" }, { label: "Outils", href: "/admin/tools" }, { label: "Audit", href: "/admin/audit" }, { label: "Logs", href: "/admin/error-logs" }, { label: "Profil", href: "/profile" }]} />
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

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Hash className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucun channel</p>
          <p className="text-sm mt-1">Créez votre premier channel pour commencer.</p>
        </div>
      ) : (
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
                      <div className="flex items-center gap-3 mt-0.5">
                        {ch.description && (
                          <p className="text-sm text-muted-foreground">{ch.description}</p>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {ch.members_count} membre{ch.members_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openMembers(ch)}
                      title="Gérer les membres"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le channel" : "Nouveau channel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#141414]" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#141414]" />
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
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="💬" className="bg-[#141414]" />
            </div>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Membres — {membersChannel?.name}
            </DialogTitle>
          </DialogHeader>
          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun membre dans ce channel</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {members.length} membre{members.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {getInitials(m.user?.full_name || m.user?.email || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{m.user?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.user?.email} · Rejoint {timeAgo(m.joined_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeMember(m.id, m.user_id)}
                      title="Retirer du channel"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
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
