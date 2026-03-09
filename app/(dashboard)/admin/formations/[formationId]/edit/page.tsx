import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/utils/roles";
import { FormationEditor } from "./FormationEditor";

export default async function EditFormationPage({
  params,
}: {
  params: Promise<{ formationId: string }>;
}) {
  const { formationId } = await params;
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

  if (!profile || !isAdmin(profile.role)) redirect("/dashboard");

  const { data: formation } = await supabase
    .from("formations")
    .select("*")
    .eq("id", formationId)
    .single();

  if (!formation) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("formation_id", formationId)
    .order("order");

  return <FormationEditor formation={formation} initialModules={modules || []} />;
}
