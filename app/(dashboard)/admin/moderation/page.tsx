import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { ModerationClient } from "./ModerationClient";
import { SubNav } from "@/components/layout/sub-nav";

export default async function ModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  const [{ data: reports }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("post_reports")
      .select(
        "*, post:posts(id, content, title, type, media_url, author_id, created_at, author:profiles(full_name, avatar_url, role)), reporter:profiles!post_reports_reporter_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("post_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <>
      <SubNav tabs={[{ label: "Paramètres", href: "/admin/settings" }, { label: "Utilisateurs", href: "/admin/users" }, { label: "Équipe", href: "/admin/team" }, { label: "Channels", href: "/admin/channels" }, { label: "Modération", href: "/admin/moderation" }, { label: "Outils", href: "/admin/tools" }, { label: "Audit", href: "/admin/audit" }, { label: "Logs", href: "/admin/error-logs" }]} />
      <ModerationClient
        initialReports={reports || []}
        pendingCount={pendingCount || 0}
        moderatorId={user.id}
      />
    </>
  );
}
