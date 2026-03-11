"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Pin,
  Trash2,
  MoreHorizontal,
  Pencil,
  Flag,
  Check,
  X,
  Share2,
  Link2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Post, Profile, UserRole } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";
import { getRoleBadgeColor, getRoleLabel, isModerator } from "@/lib/utils/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostCardProps {
  post: Post & { author: Profile; user_has_liked?: boolean };
  currentUserId: string;
  currentUserRole: UserRole;
  onDelete?: (postId: string) => void;
  onTogglePin?: (postId: string, pinned: boolean) => void;
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
  onDelete,
  onTogglePin,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [isEdited, setIsEdited] = useState(
    post.updated_at !== post.created_at
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  const handleLike = async () => {
    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikesCount((prev) => prev + 1);

      // Notifier l'auteur du like (sauf si c'est soi-même)
      if (post.author_id !== currentUserId) {
        const { data: likerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentUserId)
          .single();

        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "post",
          title: `${likerProfile?.full_name || "Quelqu'un"} a aimé votre post`,
          message: post.title || undefined,
          link: `/community/${post.id}`,
        });
      }
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({
        content: editContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("author_id", currentUserId);

    if (error) {
      toast.error("Erreur lors de la modification");
    } else {
      setCurrentContent(editContent.trim());
      setIsEdited(true);
      setEditing(false);
      toast.success("Post modifié");
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditContent(currentContent);
    setEditing(false);
  };

  const handleReport = async (reason: string) => {
    if (!reason) return;
    const { error } = await supabase.from("post_reports").insert({
      post_id: post.id,
      reporter_id: currentUserId,
      reason,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Vous avez déjà signalé ce post");
      } else {
        toast.error("Erreur lors du signalement");
      }
    } else {
      toast.success("Post signalé. Un modérateur l'examinera.");
    }
    setReportOpen(false);
    setReportReason("");
  };

  const canModerate = isModerator(currentUserRole);
  const isAuthor = post.author_id === currentUserId;

  return (
    <Card className={cn(post.is_pinned && "border-primary/30 bg-primary/5")}>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {getInitials(post.author?.full_name || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{post.author?.full_name}</span>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0", getRoleBadgeColor(post.author?.role))}
                >
                  {getRoleLabel(post.author?.role)}
                </Badge>
                {post.is_pinned && (
                  <Pin className="h-3 w-3 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">
                  {timeAgo(post.created_at)}
                </p>
                {isEdited && (
                  <span className="text-xs text-muted-foreground/60">
                    (modifié)
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              {canModerate && (
                <DropdownMenuItem
                  onClick={() => onTogglePin?.(post.id, !post.is_pinned)}
                >
                  <Pin className="mr-2 h-4 w-4" />
                  {post.is_pinned ? "Désépingler" : "Épingler"}
                </DropdownMenuItem>
              )}
              {!isAuthor && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setReportOpen(true)}
                    className="text-[#FFB800]"
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Signaler
                  </DropdownMenuItem>
                </>
              )}
              {(canModerate || isAuthor) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}

        {/* Content — editable or static */}
        {editing ? (
          <div className="mb-3 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/50 border-border text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={saving || !editContent.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed mb-3 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        )}

        {/* Media */}
        {post.media_url && (
          <div className="mb-3 rounded-xl overflow-hidden">
            {post.type === "video" ? (
              <video src={post.media_url} controls className="w-full max-h-96" />
            ) : (
              <img src={post.media_url} alt="" className="w-full max-h-96 object-cover" />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            <span>{likesCount}</span>
          </button>
          <Link
            href={`/community/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
                <Share2 className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/community/${post.id}`;
                  const text = post.title || post.content.slice(0, 100);
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                    "_blank",
                    "noopener,noreferrer,width=600,height=500"
                  );
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/community/${post.id}`;
                  const text = post.title || "Un post sur UPSCALE";
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                    "_blank",
                    "noopener,noreferrer,width=600,height=500"
                  );
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const url = `${window.location.origin}/community/${post.id}`;
                  await navigator.clipboard.writeText(url);
                  toast.success("Lien copié !");
                }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copier le lien
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-[#FFB800]" />
              Signaler ce post
            </DialogTitle>
            <DialogDescription>
              Choisissez la raison du signalement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { value: "inappropriate", label: "Contenu inapproprié" },
              { value: "spam", label: "Spam ou publicité" },
              { value: "harassment", label: "Harcèlement" },
              { value: "misinformation", label: "Désinformation" },
              { value: "other", label: "Autre" },
            ].map((reason) => (
              <button
                key={reason.value}
                onClick={() => setReportReason(reason.value)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm",
                  reportReason === reason.value
                    ? "border-[#FFB800]/50 bg-[#FFB800]/10 text-[#FFB800]"
                    : "border-border hover:bg-accent/50"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => handleReport(reportReason)}
            disabled={!reportReason}
            className="w-full"
            variant="outline"
          >
            <Flag className="mr-2 h-4 w-4" />
            Envoyer le signalement
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
