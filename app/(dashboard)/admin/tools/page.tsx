import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubNav } from "@/components/layout/sub-nav";
import { ToolsAdminClient } from "./ToolsAdminClient";

const parametresTabs = [
  { label: "Paramètres", href: "/admin/settings" },
  { label: "Équipe", href: "/admin/team" },
  { label: "Channels", href: "/admin/channels" },
  { label: "Modération", href: "/admin/moderation" },
  { label: "Base IA", href: "/admin/ai" },
  { label: "SOPs", href: "/admin/sops" },
  { label: "Outils", href: "/admin/tools" },
  { label: "Audit", href: "/admin/audit" },
  { label: "Logs", href: "/admin/error-logs" },
  { label: "Profil", href: "/profile" },
];

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

  return (
    <>
      <SubNav tabs={parametresTabs} />
      <ToolsAdminClient tools={tools || []} />
    </>
  );
}
