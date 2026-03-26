import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageEditorMember } from "./PageEditorMember";
import type { Data } from "@measured/puck";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function MyPageEditPage({ params }: PageProps) {
  const { pageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", pageId)
    .eq("created_by", user.id)
    .single();

  if (error || !page) {
    notFound();
  }

  const initialData: Data = (page.puck_data as Data) || {
    content: [],
    root: { props: {} },
  };

  return (
    <PageEditorMember
      pageId={page.id}
      initialData={initialData}
      pageTitle={page.title}
    />
  );
}
