import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { SubNav } from "@/components/layout/sub-nav";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  const [{ data: profiles }, { data: tags }, { data: userTags }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("tags").select("*").order("name"),
    supabase.from("user_tags").select("*, tag:tags(*)"),
  ]);

  return (
    <>
      <SubNav tabs={[
        { label: "Paramètres", href: "/admin/settings" },
        { label: "Utilisateurs", href: "/admin/users" },
        { label: "Équipe", href: "/admin/team" },
        { label: "Channels", href: "/admin/channels" },
        { label: "Modération", href: "/admin/moderation" },
        { label: "Base IA", href: "/admin/ai" },
        { label: "SOPs", href: "/admin/sops" },
        { label: "Outils", href: "/admin/tools" },
        { label: "Audit", href: "/admin/audit" },
        { label: "Logs", href: "/admin/error-logs" },
      ]} />
      <UsersClient
        profiles={profiles || []}
        allTags={tags || []}
        userTags={userTags || []}
        isAdmin={profile.role === "admin"}
      />
    </>
  );
}
