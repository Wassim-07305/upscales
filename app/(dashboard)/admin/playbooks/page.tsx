import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPlaybooksClient } from "./AdminPlaybooksClient";

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

  return <AdminPlaybooksClient playbooks={playbooks || []} />;
}
