"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Reply, Trash2, Send, Loader2 } from "lucide-react";
import { Comment, Profile, UserRole } from "@/lib/types/database";
import { timeAgo } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";
import { isModerator } from "@/lib/utils/roles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CommentWithAuthor = Omit<Comment, 'replies'> & {
  author: Profile;
  replies?: (Omit<Comment, 'replies'> & { author: Profile })[];
};

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  currentUserRole: UserRole;
  userLikes: string[];
}

export function CommentSection({
  postId,
  comments,
  currentUserId,
  currentUserRole,
  userLikes,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set(userLikes));
  const router = useRouter();
  const supabase = createClient();

  const handleComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: currentUserId,
      content: content.trim(),
      parent_id: parentId || null,
    });

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      if (parentId) {
        setReplyContent("");
        setReplyTo(null);
      } else {
        setNewComment("");
      }
      router.refresh();
    }
    setLoading(false);
  };

  const handleLike = async (commentId: string) => {
    if (likedComments.has(commentId)) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", currentUserId);
      setLikedComments((prev) => { const next = new Set(prev); next.delete(commentId); return next; });
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: currentUserId });
      setLikedComments((prev) => new Set(prev).add(commentId));
    }
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    router.refresh();
  };

  const renderComment = (comment: Omit<Comment, 'replies'> & { author: Profile }, isReply = false) => (
    <div key={comment.id} className={cn("flex gap-3", isReply && "ml-12")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {getInitials(comment.author?.full_name || "")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-secondary/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.author?.full_name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <button
            onClick={() => handleLike(comment.id)}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              likedComments.has(comment.id) ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("h-3 w-3", likedComments.has(comment.id) && "fill-current")} />
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              Répondre
            </button>
          )}
          {(isModerator(currentUserRole) || comment.author_id === currentUserId) && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyTo === comment.id && (
          <div className="flex gap-2 mt-2 ml-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Votre réponse..."
              className="min-h-[60px] resize-none text-sm bg-secondary/50 border-0"
            />
            <Button
              size="icon"
              className="flex-shrink-0"
              onClick={() => handleComment(comment.id)}
              disabled={!replyContent.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* New comment */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Écrire un commentaire..."
          className="min-h-[60px] resize-none text-sm bg-secondary/50 border-0"
        />
        <Button
          size="icon"
          className="flex-shrink-0"
          onClick={() => handleComment()}
          disabled={!newComment.trim() || loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id}>
            {renderComment(comment)}
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </div>
        ))}
      </div>
    </div>
  );
}
