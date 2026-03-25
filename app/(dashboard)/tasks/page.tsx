import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksClient } from "./TasksClient";
import { SubNav } from "@/components/layout/sub-nav";
import { isModerator } from "@/lib/utils/roles";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: tasks }, { data: profile }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("is_top_priority", { ascending: false })
      .order("order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isAdmin = profile && isModerator(profile.role);

  return (
    <>
      {isAdmin && (
        <SubNav tabs={[{ label: "Tâches", href: "/tasks" }, { label: "OKRs", href: "/admin/okrs" }]} />
      )}
      <TasksClient tasks={tasks || []} userId={user.id} />
    </>
  );
}
