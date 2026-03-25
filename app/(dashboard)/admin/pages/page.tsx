import { createClient } from "@/lib/supabase/server";
import { SubNav } from "@/components/layout/sub-nav";
import { PagesAdminClient } from "./PagesAdminClient";

const formationsTabs = [
  { label: "Formations", href: "/admin/formations" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Ressources", href: "/ressources" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
];

export default async function AdminPagesPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <SubNav tabs={formationsTabs} />
      <PagesAdminClient pages={pages || []} />
    </>
  );
}
