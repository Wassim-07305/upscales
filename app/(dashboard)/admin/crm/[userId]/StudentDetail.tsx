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
  ChevronLeft,
  Send,
  Plus,
  X,
  BookOpen,
  MessageCircle,
  Newspaper,
  Award,
  Loader2,
} from "lucide-react";
import { Profile, Tag, Certificate, CrmNote, UserRole } from "@/lib/types/database";
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
  userTags: initialTags,
  allTags,
  messageCount,
  postCount,
  isAdmin,
}: StudentDetailProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState(initialTags);
  const [newNote, setNewNote] = useState("");
  const [role, setRole] = useState(student.role);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
              <h1 className="text-xl font-bold">{student.full_name || student.email}</h1>
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
