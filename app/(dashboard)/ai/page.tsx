import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AIChat } from "./AIChat";

export default async function AIPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Block prospects
  if (!profile || profile.role === "prospect") {
    redirect("/dashboard");
  }

  // Fetch user's conversations
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <AIChat userId={user.id} conversations={conversations || []} />;
}
