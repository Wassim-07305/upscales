"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Send,
  Plus,
  X,
  BookOpen,
  MessageCircle,
  Newspaper,
  Award,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Profile, Tag, Certificate, CrmNote, UserRole, UserWarning } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatDate, timeAgo } from "@/lib/utils/dates";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentDetailProps {
  student: Profile;
  enrollments: any[];
  certificates: (Certificate & { formation?: { title: string } })[];
  notes: (CrmNote & { author?: { full_name: string } })[];
  warnings: (UserWarning & { issuer?: { full_name: string } })[];
  userTags: Tag[];
  allTags: Tag[];
  messageCount: number;
  postCount: number;
  isAdmin: boolean;
}

export function StudentDetail({
  student,
  enrollments,
  certificates,
  notes: initialNotes,
  warnings: initialWarnings,
  userTags: initialTags,
  allTags,
  messageCount,
  postCount,
  isAdmin,
}: StudentDetailProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [warnings, setWarnings] = useState(initialWarnings);
  const [tags, setTags] = useState(initialTags);
  const [newNote, setNewNote] = useState("");
  const [role, setRole] = useState(student.role);
  const [suspended, setSuspended] = useState(student.is_suspended);
  const [loading, setLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [warningReason, setWarningReason] = useState("");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setLoading(true);
    await supabase
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: suspendReason.trim(),
      })
      .eq("id", student.id);

    await supabase.from("notifications").insert({
      user_id: student.id,
      type: "system" as const,
      title: "Compte suspendu",
      message: `Votre compte a été suspendu. Motif : ${suspendReason.trim()}`,
      link: "/suspended",
    });

    setSuspended(true);
    setSuspendReason("");
    setSuspendDialogOpen(false);
    toast.success("Utilisateur suspendu");
    setLoading(false);
  };

  const handleUnsuspend = async () => {
    setLoading(true);
    await supabase
      .from("profiles")
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
      })
      .eq("id", student.id);

    await supabase.from("notifications").insert({
      user_id: student.id,
      type: "system" as const,
      title: "Compte réactivé",
      message: "Votre compte a été réactivé. Bienvenue !",
      link: "/dashboard",
    });

    setSuspended(false);
    toast.success("Utilisateur réactivé");
    setLoading(false);
  };

  const handleAddWarning = async () => {
    if (!warningReason.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_warnings")
      .insert({
        user_id: student.id,
        issued_by: user.id,
        reason: warningReason.trim(),
      })
      .select("*, issuer:profiles!user_warnings_issued_by_fkey(full_name)")
      .single();

    if (data) {
      setWarnings((prev) => [data, ...prev]);

      await supabase.from("notifications").insert({
        user_id: student.id,
        type: "system" as const,
        title: "Avertissement reçu",
        message: `Vous avez reçu un avertissement : ${warningReason.trim()}`,
        link: "/settings",
      });

      toast.success("Avertissement envoyé");
    }

    setWarningReason("");
    setWarningDialogOpen(false);
    setLoading(false);
  };

  const handleDeleteWarning = async (id: string) => {
    await supabase.from("user_warnings").delete().eq("id", id);
    setWarnings((prev) => prev.filter((w) => w.id !== id));
    toast.success("Avertissement supprimé");
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("crm_notes")
      .insert({ student_id: student.id, author_id: user.id, content: newNote.trim() })
      .select("*, author:profiles(full_name)")
      .single();

    if (data) {
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
      toast.success("Note ajoutée");
    }
    setLoading(false);
  };

  const handleRoleChange = async (newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", student.id);
    setRole(newRole as UserRole);
    toast.success("Rôle mis à jour");
    router.refresh();
  };

  const handleAddTag = async (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    if (!tag || tags.some((t) => t.id === tagId)) return;

    await supabase.from("user_tags").insert({ user_id: student.id, tag_id: tagId });
    setTags((prev) => [...prev, tag]);
    toast.success("Tag ajouté");
  };

  const handleRemoveTag = async (tagId: string) => {
    await supabase.from("user_tags").delete().eq("user_id", student.id).eq("tag_id", tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const availableTags = allTags.filter((t) => !tags.some((ut) => ut.id === t.id));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/crm"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour au CRM
      </Link>

      {/* Suspension banner */}
      {suspended && (
        <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Compte suspendu</p>
            {student.suspended_reason && (
              <p className="text-xs text-muted-foreground">{student.suspended_reason}</p>
            )}
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleUnsuspend} disabled={loading}>
              <ShieldCheck className="h-4 w-4 mr-1" />
              Réactiver
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {getInitials(student.full_name || student.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{student.full_name || student.email}</h1>
                {suspended && (
                  <Badge variant="destructive" className="text-[10px]">Suspendu</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {isAdmin ? (
                  <Select value={role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-[140px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="moderator">Modérateur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn("text-xs", getRoleBadgeColor(role))}>
                    {getRoleLabel(role)}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Inscrit le {formatDate(student.created_at)}
                </span>
              </div>
            </div>

            {/* Admin actions: warn & suspend */}
            {isAdmin && !suspended && (
              <div className="flex gap-2 shrink-0">
                <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Avertir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Envoyer un avertissement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Textarea
                        value={warningReason}
                        onChange={(e) => setWarningReason(e.target.value)}
                        placeholder="Motif de l'avertissement..."
                        className="min-h-[80px]"
                      />
                      <Button onClick={handleAddWarning} disabled={!warningReason.trim() || loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                        Envoyer l&apos;avertissement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <ShieldAlert className="h-4 w-4 mr-1" />
                      Suspendre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Suspendre l&apos;utilisateur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        L&apos;utilisateur ne pourra plus accéder à la plateforme tant que son compte est suspendu.
                      </p>
                      <Textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="Motif de la suspension..."
                        className="min-h-[80px]"
                      />
                      <Button variant="destructive" onClick={handleSuspend} disabled={!suspendReason.trim() || loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                        Confirmer la suspension
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs gap-1"
                style={{ borderColor: tag.color + "50", color: tag.color }}
              >
                {tag.name}
                {isAdmin && (
                  <button onClick={() => handleRemoveTag(tag.id)}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {isAdmin && availableTags.length > 0 && (
              <Select onValueChange={handleAddTag}>
                <SelectTrigger className="w-[130px] h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter tag
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <span style={{ color: tag.color }}>{tag.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Formations inscrites
              </span>
              <span className="font-medium">{enrollments.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" /> Certificats
              </span>
              <span className="font-medium">{certificates.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" /> Messages
              </span>
              <span className="font-medium">{messageCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Newspaper className="h-4 w-4" /> Posts
              </span>
              <span className="font-medium">{postCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Dernière connexion</span>
              <span className="text-xs">{student.last_seen_at ? timeAgo(student.last_seen_at) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Formations progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune formation</p>
            ) : (
              enrollments.map((e: any) => (
                <div key={e.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium truncate">{e.formation?.title}</span>
                    <span className="text-xs text-muted-foreground">{e.percent}%</span>
                  </div>
                  <Progress value={e.percent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.completed_modules}/{e.total_modules} modules
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {(isAdmin || warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Avertissements
              {warnings.length > 0 && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                  {warnings.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun avertissement</p>
            ) : (
              warnings.map((warning) => (
                <div key={warning.id} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{warning.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Par {(warning as any).issuer?.full_name || "Inconnu"} • {timeAgo(warning.created_at)}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteWarning(warning.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* CRM Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="min-h-[60px] resize-none bg-[#141414] border-0"
            />
            <Button
              size="icon"
              className="flex-shrink-0"
              onClick={handleAddNote}
              disabled={!newNote.trim() || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-[#1C1C1C] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{(note as any).author?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(note.created_at)}</span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
