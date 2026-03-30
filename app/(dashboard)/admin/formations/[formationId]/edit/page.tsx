import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
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

  if (!profile || !isModerator(profile.role)) redirect("/dashboard");

  const { data: formation } = await supabase
    .from("formations")
    .select("*")
    .eq("id", formationId)
    .single();

  if (!formation) notFound();

  const [modulesRes, prerequisitesRes] = await Promise.all([
    supabase.from("modules").select("*").eq("formation_id", formationId).order("order"),
    supabase
      .from("module_prerequisites")
      .select("*")
      .in(
        "module_id",
        (
          await supabase.from("modules").select("id").eq("formation_id", formationId)
        ).data?.map((m) => m.id) || []
      ),
  ]);

  return (
    <FormationEditor
      formation={formation}
      initialModules={modulesRes.data || []}
      initialPrerequisites={prerequisitesRes.data || []}
    />
  );
}
