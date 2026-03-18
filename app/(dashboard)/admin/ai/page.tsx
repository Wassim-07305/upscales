import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { AIAdminClient } from "./AIAdminClient";

export default async function AdminAIPage() {
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

  if (!profile || !isAdmin(profile.role)) redirect("/admin");

  const [{ data: documents }, { data: formations }] = await Promise.all([
    supabase
      .from("ai_documents")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("formations")
      .select("id, title, status")
      .eq("status", "published")
      .order("title"),
  ]);

  return (
    <AIAdminClient
      documents={documents || []}
      formations={formations || []}
    />
  );
}
