import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { AIAdminClient } from "./AIAdminClient";
import { SubNav } from "@/components/layout/sub-nav";

export default async function AdminAIPage() {
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

  if (!profile || !isAdmin(profile.role)) redirect("/admin");

  const [{ data: documents }, { data: formations }] = await Promise.all([
    supabase
      .from("ai_documents")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("formations")
      .select("id, title, status")
      .eq("status", "published")
      .order("title"),
  ]);

  return (
    <>
      <SubNav tabs={[
        { label: "Paramètres", href: "/admin/settings" },
        { label: "Équipe", href: "/admin/team" },
        { label: "Channels", href: "/admin/channels" },
        { label: "Modération", href: "/admin/moderation" },
        { label: "Base IA", href: "/admin/ai" },
        { label: "Profil", href: "/profile" },
      ]} />
      <AIAdminClient
        documents={documents || []}
        formations={formations || []}
      />
    </>
  );
}
