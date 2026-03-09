"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Pin, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Post, Profile, UserRole } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";
import { getRoleBadgeColor, getRoleLabel, isModerator } from "@/lib/utils/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  const supabase = createClient();

  const handleLike = async () => {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
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
              <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          {(canModerate || isAuthor) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canModerate && (
                  <DropdownMenuItem onClick={() => onTogglePin?.(post.id, !post.is_pinned)}>
                    <Pin className="mr-2 h-4 w-4" />
                    {post.is_pinned ? "Désépingler" : "Épingler"}
                  </DropdownMenuItem>
                )}
                {(canModerate || isAuthor) && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}

        {/* Content */}
        <div
          className="text-sm leading-relaxed mb-3 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

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
        </div>
      </CardContent>
    </Card>
  );
}
