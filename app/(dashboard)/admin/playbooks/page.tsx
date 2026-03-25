import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPlaybooksClient } from "./AdminPlaybooksClient";
import { SubNav } from "@/components/layout/sub-nav";

export default async function AdminPlaybooksPage() {
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

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("*, playbook_sections(id)")
    .order("order", { ascending: true });

  return (
    <>
      <SubNav tabs={[{ label: "Ressources", href: "/ressources" }, { label: "Playbooks", href: "/admin/playbooks" }, { label: "Pages", href: "/admin/pages" }, { label: "Exercices", href: "/admin/exercises" }, { label: "Contenu", href: "/admin/content" }, { label: "SOPs", href: "/admin/sops" }]} />
      <AdminPlaybooksClient playbooks={playbooks || []} />
    </>
  );
}
