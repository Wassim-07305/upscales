import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreatePost } from "@/components/community/CreatePost";
import { PostCard } from "@/components/community/PostCard";
import { isMember } from "@/lib/utils/roles";
import { CommunityFilters } from "./CommunityFilters";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = params?.filter || "recent";

  let query = supabase
    .from("posts")
    .select("*, author:profiles(*)")
    .limit(50);

  if (filter === "popular") {
    query = query.order("likes_count", { ascending: false });
  } else if (filter === "announcements") {
    query = query.eq("type", "announcement").order("created_at", { ascending: false });
  } else if (filter === "mine") {
    query = query.eq("author_id", user.id).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Parallelize profile and posts queries
  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    query,
  ]);

  if (!profile) redirect("/login");

  // Get user's likes (depends on posts result)
  const postIds = posts?.map((p) => p.id) || [];
  const { data: userLikes } = postIds.length > 0
    ? await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds)
    : { data: [] };

  const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

  // Separate pinned and regular posts
  const allPosts = posts || [];
  const pinnedPosts = allPosts.filter((p) => p.is_pinned);
  const regularPosts = allPosts.filter((p) => !p.is_pinned);

  const canPost = isMember(profile.role);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communauté</h1>
        <p className="text-muted-foreground">Échangez avec les autres membres</p>
      </div>

      {canPost && <CreatePost user={profile} />}

      <CommunityFilters currentFilter={filter} />

      <div className="space-y-4">
        {pinnedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={{ ...post, user_has_liked: likedPostIds.has(post.id) }}
            currentUserId={user.id}
            currentUserRole={profile.role}
          />
        ))}
        {regularPosts.map((post) => (
          <PostCard
            key={post.id}
            post={{ ...post, user_has_liked: likedPostIds.has(post.id) }}
            currentUserId={user.id}
            currentUserRole={profile.role}
          />
        ))}
      </div>

      {allPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun post pour le moment</p>
        </div>
      )}
    </div>
  );
}
