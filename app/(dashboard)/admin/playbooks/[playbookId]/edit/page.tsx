import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlaybookEditor } from "./PlaybookEditor";

export default async function PlaybookEditPage({
  params,
}: {
  params: Promise<{ playbookId: string }>;
}) {
  const { playbookId } = await params;
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

  const { data: playbook } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", playbookId)
    .single();

  if (!playbook) redirect("/admin/playbooks");

  const { data: sections } = await supabase
    .from("playbook_sections")
    .select("*, playbook_pages(*)")
    .eq("playbook_id", playbookId)
    .order("order", { ascending: true });

  // Sort pages within each section
  const sortedSections = (sections || []).map((s: any) => ({
    ...s,
    playbook_pages: (s.playbook_pages || []).sort(
      (a: any, b: any) => a.order - b.order
    ),
  }));

  return <PlaybookEditor playbook={playbook} sections={sortedSections} />;
}
