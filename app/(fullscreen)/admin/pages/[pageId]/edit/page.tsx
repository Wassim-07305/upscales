import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminEditorWrapper } from "./AdminEditorWrapper";
import type { Data } from "@measured/puck";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditLandingPage({ params }: PageProps) {
  const { pageId } = await params;
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error || !page) {
    notFound();
  }

  const initialData: Data = (page.puck_data as Data) || {
    content: [],
    root: { props: {} },
  };

  return <AdminEditorWrapper pageId={page.id} initialData={initialData} pageTitle={page.title} />;
}
