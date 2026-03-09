import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageEditor } from "./PageEditor";
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

  return <PageEditor pageId={page.id} initialData={initialData} pageTitle={page.title} />;
}
