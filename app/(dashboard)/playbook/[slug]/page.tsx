import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlaybookViewer } from "./PlaybookViewer";

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: playbook } = await supabase
    .from("playbooks")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!playbook) redirect("/dashboard");

  const { data: sections } = await supabase
    .from("playbook_sections")
    .select("*, playbook_pages(*)")
    .eq("playbook_id", playbook.id)
    .order("order", { ascending: true });

  const sortedSections = (sections || []).map((s: any) => ({
    ...s,
    playbook_pages: (s.playbook_pages || [])
      .filter((p: any) => p.is_published)
      .sort((a: any, b: any) => a.order - b.order),
  }));

  return <PlaybookViewer playbook={playbook} sections={sortedSections} />;
}
