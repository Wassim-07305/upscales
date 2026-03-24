import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isModerator } from "@/lib/utils/roles";
import { ContentClient } from "./ContentClient";

export default async function ContentPage() {
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

  const { data: videos } = await supabase
    .from("video_content")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("publish_date", { ascending: true });

  return <ContentClient videos={videos || []} userId={user.id} />;
}
