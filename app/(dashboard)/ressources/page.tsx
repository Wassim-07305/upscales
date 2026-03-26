import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import { RessourcesHub } from "./RessourcesHub";
import { isModerator } from "@/lib/utils/roles";

const adminTabs = [
  { label: "Ressources", href: "/ressources" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
  { label: "SOPs", href: "/admin/sops" },
];

export default async function RessourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isAdmin = isModerator(profile.role);

  const [{ data: sops }, { data: playbooks }, { data: tools }] = await Promise.all([
    supabase
      .from("sops")
      .select("*")
      .eq("is_published", true)
      .order("department", { ascending: true })
      .order("order", { ascending: true }),
    supabase
      .from("playbooks")
      .select("id, title, slug, description, target_role, icon")
      .eq("is_published", true)
      .order("order", { ascending: true }),
    supabase
      .from("tool_links")
      .select("*")
      .eq("is_published", true)
      .order("category")
      .order("order", { ascending: true }),
  ]);

  return (
    <>
      {isAdmin && <SubNav tabs={adminTabs} />}
      <RessourcesHub
        sops={sops || []}
        playbooks={playbooks || []}
        tools={tools || []}
        isAdmin={isAdmin}
      />
    </>
  );
}
