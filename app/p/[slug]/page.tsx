import { notFound } from "next/navigation";
import { Render, type Data } from "@measured/puck";
import { createClient } from "@/lib/supabase/server";
import { puckConfig } from "@/lib/puck/config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_landing_page_by_slug", { _slug: slug });

  if (!data) {
    return { title: "Page introuvable" };
  }

  return {
    title: data.title,
    description: data.description || undefined,
    openGraph: {
      title: data.title,
      description: data.description || undefined,
      images: data.og_image_url ? [data.og_image_url] : undefined,
    },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase.rpc("get_landing_page_by_slug", { _slug: slug });

  if (!page) {
    notFound();
  }

  const puckData = page.puck_data as Data;

  if (!puckData || !puckData.content || puckData.content.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-gray-500">
        <p>Cette page est en cours de construction.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <Render config={puckConfig} data={puckData} />
    </main>
  );
}
