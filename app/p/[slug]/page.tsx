import { notFound } from "next/navigation";
import { Render, type Data } from "@measured/puck";
import { createClient } from "@/lib/supabase/server";
import { puckConfig } from "@/lib/puck/config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

async function getPage(slug: string, isPreview: boolean) {
  const supabase = await createClient();

  // Preview mode: admin can see draft pages
  if (isPreview) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        const { data } = await supabase
          .from("landing_pages")
          .select("id, slug, title, description, og_image_url, puck_data, is_active")
          .eq("slug", slug)
          .single();
        return data;
      }
    }
  }

  // Normal: only active pages via RPC
  const { data } = await supabase.rpc("get_landing_page_by_slug", { _slug: slug });
  return data;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;

  const data = await getPage(slug, preview === "true");

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

export default async function LandingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const page = await getPage(slug, isPreview);

  if (!page) {
    notFound();
  }

  let puckData: Data;
  try {
    puckData = page.puck_data as Data;
    if (!puckData || !puckData.content) throw new Error("No content");
  } catch {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-gray-500">
        <p>Cette page est en cours de construction.</p>
      </div>
    );
  }

  if (puckData.content.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-gray-500">
        <p>Cette page est en cours de construction.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#FFB800] text-black text-center text-sm py-1.5 font-medium">
          Mode prévisualisation — Cette page n&apos;est pas encore publiée
        </div>
      )}
      <div className={isPreview ? "pt-8" : ""}>
        <Render config={puckConfig} data={puckData} />
      </div>
    </main>
  );
}
