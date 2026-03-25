import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import { RessourcesClient } from "./RessourcesClient";

const ressourcesTabs = [
  { label: "Ressources", href: "/ressources" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
  { label: "SOPs", href: "/admin/sops" },
];

export default async function RessourcesPage() {
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

  if (!profile) redirect("/login");

  // RLS filters by role automatically
  const { data: sops } = await supabase
    .from("sops")
    .select("*")
    .eq("is_published", true)
    .order("department", { ascending: true })
    .order("order", { ascending: true });

  return (
    <>
      <SubNav tabs={ressourcesTabs} />
      <RessourcesClient sops={sops || []} />
    </>
  );
}
