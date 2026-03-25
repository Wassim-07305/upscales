import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { SubNav } from "@/components/layout/sub-nav";
import { ContentClient } from "./ContentClient";

const formationsTabs = [
  { label: "Formations", href: "/admin/formations" },
  { label: "Playbooks", href: "/admin/playbooks" },
  { label: "Ressources", href: "/ressources" },
  { label: "Pages", href: "/admin/pages" },
  { label: "Exercices", href: "/admin/exercises" },
  { label: "Contenu", href: "/admin/content" },
];

export default async function ContentPage() {
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

  const { data: videos } = await supabase
    .from("video_content")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("publish_date", { ascending: true });

  return (
    <>
      <SubNav tabs={formationsTabs} />
      <ContentClient videos={videos || []} userId={user.id} />
    </>
  );
}
