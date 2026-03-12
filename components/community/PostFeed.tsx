"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";
import { Post, Profile, UserRole } from "@/lib/types/database";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface PostFeedProps {
  initialPosts: (Post & { author: Profile; user_has_liked?: boolean })[];
  currentUserId: string;
  currentUserRole: UserRole;
  filter: string;
  totalInitial: number;
}

export function PostFeed({
  initialPosts,
  currentUserId,
  currentUserRole,
  filter,
  totalInitial,
}: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const observerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    let query = supabase
      .from("posts")
      .select("*, author:profiles(*)")
      .range(posts.length, posts.length + PAGE_SIZE - 1);

    if (filter === "popular") {
      query = query.order("likes_count", { ascending: false });
    } else if (filter === "announcements") {
      query = query.eq("type", "announcement").order("created_at", { ascending: false });
    } else if (filter === "mine") {
      query = query.eq("author_id", currentUserId).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: newPosts } = await query;

    if (newPosts && newPosts.length > 0) {
      // Fetch likes for new posts
      const newIds = newPosts.map((p) => p.id);
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", newIds);

      const likedSet = new Set(likes?.map((l) => l.post_id) || []);

      const enriched = newPosts.map((p) => ({
        ...p,
        user_has_liked: likedSet.has(p.id),
      }));

      setPosts((prev) => [...prev, ...enriched]);
      setHasMore(newPosts.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }

    setLoading(false);
  }, [posts.length, loading, hasMore, filter, currentUserId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  const handleDelete = useCallback(async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post supprimé");
  }, []);

  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);

  return (
    <>
      <div className="space-y-4">
        {pinnedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDelete={handleDelete}
          />
        ))}
        {regularPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="py-4 flex justify-center">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {!hasMore && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">Tous les posts ont été chargés</p>
        )}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun post pour le moment</p>
        </div>
      )}
    </>
  );
}
