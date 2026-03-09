import { createClient } from "@/lib/supabase/server";
import { AIAdminClient } from "./AIAdminClient";

export default async function AdminAIPage() {
  const supabase = await createClient();

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
