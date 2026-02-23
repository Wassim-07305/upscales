import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PostCard } from "@/components/community/PostCard";
import { CommentSection } from "@/components/community/CommentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: post } = await supabase
    .from("posts")
    .select("*, author:profiles(*)")
    .eq("id", postId)
    .single();

  if (!post) notFound();

  // Check if user liked the post
  const { data: userLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  // Fetch comments with authors
  const { data: comments } = await supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  // Fetch replies
  const commentIds = comments?.map((c) => c.id) || [];
  const { data: replies } = commentIds.length > 0
    ? await supabase
        .from("comments")
        .select("*, author:profiles(*)")
        .in("parent_id", commentIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Fetch user's comment likes
  const allCommentIds = [
    ...(comments?.map((c) => c.id) || []),
    ...(replies?.map((r) => r.id) || []),
  ];
  const { data: userCommentLikes } = allCommentIds.length > 0
    ? await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", allCommentIds)
    : { data: [] };

  const commentsWithReplies = comments?.map((c) => ({
    ...c,
    replies: replies?.filter((r) => r.parent_id === c.id) || [],
  })) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/community"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour au feed
      </Link>

      <PostCard
        post={{ ...post, user_has_liked: !!userLike }}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Commentaires ({post.comments_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentSection
            postId={postId}
            comments={commentsWithReplies}
            currentUserId={user.id}
            currentUserRole={profile.role}
            userLikes={userCommentLikes?.map((l) => l.comment_id) || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
