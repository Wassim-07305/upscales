"use client";

import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import type {
  FeedPost,
  FeedComment,
  PostType,
  FeedSortMode,
} from "@/types/feed";

const PAGE_SIZE = 10;
const MAX_THREAD_DEPTH = 3;

export function useFeed(
  postType?: PostType,
  sortMode: FeedSortMode = "recent",
) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const postsQuery = useInfiniteQuery({
    queryKey: ["feed-posts", postType, sortMode],
    enabled: !!user,
    // pageParam = cursor (created_at) pour recent/trending, offset (number) pour most_liked
    initialPageParam:
      sortMode === "most_liked"
        ? (0 as number | string | null)
        : (null as number | string | null),
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from("feed_posts")
        .select(
          "*, author:profiles!feed_posts_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .order("is_pinned", { ascending: false });

      if (postType) query = query.eq("post_type", postType);

      // Apply sort order + pagination strategy
      switch (sortMode) {
        case "trending":
          query = query.order("created_at", { ascending: false });
          if (pageParam && typeof pageParam === "string") {
            query = query.lt("created_at", pageParam);
          }
          break;
        case "most_liked":
          query = query
            .order("likes_count", { ascending: false })
            .order("created_at", { ascending: false });
          // Offset-based pagination pour most_liked
          if (typeof pageParam === "number" && pageParam > 0) {
            query = query.range(pageParam, pageParam + PAGE_SIZE - 1);
          } else {
            query = query.limit(PAGE_SIZE);
          }
          break;
        case "recent":
        default:
          query = query.order("created_at", { ascending: false });
          if (pageParam && typeof pageParam === "string") {
            query = query.lt("created_at", pageParam);
          }
          break;
      }

      if (sortMode !== "most_liked") {
        query = query.limit(PAGE_SIZE);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user's likes to mark is_liked
      let posts: FeedPost[];
      if (user && data.length > 0) {
        const postIds = data.map((p: FeedPost) => p.id);
        const { data: likes } = await supabase
          .from("feed_likes")
          .select("post_id")
          .eq("profile_id", user.id)
          .in("post_id", postIds);

        const likedSet = new Set(
          (likes ?? []).map((l: { post_id: string }) => l.post_id),
        );
        posts = data.map((p: FeedPost) => ({
          ...p,
          is_liked: likedSet.has(p.id),
        })) as FeedPost[];
      } else {
        posts = data as FeedPost[];
      }

      // Client-side trending sort (DB column may not exist)
      if (sortMode === "trending") {
        posts.sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a));
      }

      return posts;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      if (sortMode === "most_liked") {
        return allPages.flat().length;
      }
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_posts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  const createPost = useMutation({
    mutationFn: async (post: {
      content: string;
      post_type: PostType;
      media_urls?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("feed_posts")
        .insert({ ...post, author_id: user.id })
        .select(
          "*, author:profiles!feed_posts_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .single();
      if (error) throw error;
      return data as FeedPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Publication creee");
    },
    onError: () => toast.error("Erreur lors de la publication"),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Publication supprimee");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const togglePin = useMutation({
    mutationFn: async ({
      postId,
      isPinned,
    }: {
      postId: string;
      isPinned: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from("feed_posts")
        .update({ is_pinned: !isPinned })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
    onError: () => toast.error("Erreur lors de l'epinglage"),
  });

  const toggleLike = useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: string;
      isLiked: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (isLiked) {
        const { error } = await supabase
          .from("feed_likes")
          .delete()
          .eq("post_id", postId)
          .eq("profile_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("feed_likes")
          .insert({ post_id: postId, profile_id: user.id });
        if (error) throw error;
      }
    },
    // Optimistic update — mise a jour instantanee du like
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["feed-posts"] });
      const previous = queryClient.getQueryData([
        "feed-posts",
        postType,
        sortMode,
      ]);
      queryClient.setQueryData(
        ["feed-posts", postType, sortMode],
        (old: { pages: FeedPost[][]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      is_liked: !isLiked,
                      likes_count: p.likes_count + (isLiked ? -1 : 1),
                    }
                  : p,
              ),
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["feed-posts", postType, sortMode],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });

  return {
    posts: postsQuery.data?.pages.flat() ?? [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    hasNextPage: postsQuery.hasNextPage,
    isFetchingNextPage: postsQuery.isFetchingNextPage,
    fetchNextPage: postsQuery.fetchNextPage,
    createPost,
    deletePost,
    togglePin,
    toggleLike,
  };
}

export function useComments(postId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const commentsQuery = useQuery({
    queryKey: ["feed-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_comments")
        .select(
          "*, author:profiles!feed_comments_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Build deep threaded structure (up to MAX_THREAD_DEPTH levels)
      const comments = data as FeedComment[];
      const byId = new Map<string, FeedComment>();
      const childrenMap = new Map<string, FeedComment[]>();

      comments.forEach((c) => {
        c.replies = [];
        byId.set(c.id, c);
      });

      comments.forEach((c) => {
        if (c.parent_id) {
          const children = childrenMap.get(c.parent_id) ?? [];
          children.push(c);
          childrenMap.set(c.parent_id, children);
        }
      });

      // Recursive tree builder with depth limit
      function attachReplies(comment: FeedComment, depth: number) {
        if (depth >= MAX_THREAD_DEPTH) return;
        const children = childrenMap.get(comment.id) ?? [];
        comment.replies = children;
        children.forEach((child) => attachReplies(child, depth + 1));
      }

      const topLevel = comments.filter((c) => !c.parent_id);
      topLevel.forEach((c) => attachReplies(c, 0));

      return topLevel;
    },
    enabled: !!postId,
  });

  // Realtime for comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feed_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["feed-comments", postId],
          });
          queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, postId]);

  const addComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("feed_comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
          parent_id: parentId ?? null,
        })
        .select(
          "*, author:profiles!feed_comments_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .single();
      if (error) throw error;
      return data as FeedComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("feed_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    addComment,
    deleteComment,
  };
}

/** Fetch replies for a specific comment (lazy loading for deep threads) */
export function useCommentReplies(commentId: string, postId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["feed-comment-replies", commentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_comments")
        .select(
          "*, author:profiles!feed_comments_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .eq("parent_id", commentId)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as FeedComment[];
    },
    enabled: !!commentId && !!postId,
  });
}

/** Calcule un score de tendance en temps reel (meme formule que le trigger DB) */
function computeTrendingScore(post: FeedPost): number {
  const ageHours =
    (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;
  const recencyFactor = 100 * Math.exp(-0.1 * ageHours);
  return post.likes_count * 2 + post.comments_count * 3 + recencyFactor;
}

export function useTrendingPosts(limit = 5) {
  const supabase = useSupabase();
  const { user } = useAuth();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingQuery = useQuery({
    queryKey: ["feed-trending", limit],
    enabled: !!user,
    queryFn: async () => {
      // Recupere un pool plus large pour trier cote client avec la formule de recence actuelle
      const fetchLimit = Math.max(limit * 4, 20);
      const { data, error } = await supabase
        .from("feed_posts")
        .select(
          "*, author:profiles!feed_posts_author_id_fkey(id, full_name, avatar_url, role)",
        )
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(fetchLimit);
      if (error) throw error;

      // Tri cote client avec le score de tendance calcule en temps reel
      const posts = (data as FeedPost[])
        .map((p) => ({ ...p, trending_score: computeTrendingScore(p) }))
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, limit);

      return posts;
    },
  });

  return {
    trendingPosts: trendingQuery.data ?? [],
    isLoading: trendingQuery.isLoading,
  };
}
