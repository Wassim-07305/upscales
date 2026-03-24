import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("is_top_priority", { ascending: false })
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });

  return <TasksClient tasks={tasks || []} userId={user.id} />;
}
