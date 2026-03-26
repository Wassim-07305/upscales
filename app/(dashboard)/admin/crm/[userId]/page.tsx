import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { ClientDetail } from "./ClientDetail";

export default async function ClientDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  return <ClientDetail clientId={userId} />;
}
