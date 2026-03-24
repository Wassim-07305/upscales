import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ToolsAdminClient } from "./ToolsAdminClient";

export default async function ToolsAdminPage() {
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

  const { data: tools } = await supabase
    .from("tool_links")
    .select("*")
    .order("category")
    .order("order", { ascending: true });

  return <ToolsAdminClient tools={tools || []} />;
}
