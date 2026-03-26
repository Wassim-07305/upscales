"use client";

import dynamic from "next/dynamic";
import type { Data } from "@measured/puck";
import "@measured/puck/puck.css";
import "@/lib/puck/puck-overrides.css";
import { puckConfig } from "@/lib/puck/config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const Puck = dynamic(
  () => import("@measured/puck").then((mod) => mod.Puck),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    ),
  }
);

interface PageEditorProps {
  pageId: string;
  initialData: Data;
  pageTitle: string;
}

export function PageEditor({ pageId, initialData, pageTitle }: PageEditorProps) {
  const router = useRouter();

  async function handlePublish(data: Data) {
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puck_data: data }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Page sauvegardée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  return (
    <div className="h-screen puck-dark-theme flex flex-col">
      <style>{`
        .puck-dark-theme [class*="SidebarSection-title"] [class*="Heading"] { color: #aaaaaa !important; }
        .puck-dark-theme [class*="Heading"][class*="Heading"] { color: #ffffff !important; }
        .puck-dark-theme [class*="Input-label"] [class*="Heading"] { color: #cccccc !important; }
        .puck-dark-theme [class*="Input-label"] { color: #cccccc !important; }
        .puck-dark-theme [class*="ViewportControls-zoomSelect"] { background-color: #1C1C1C !important; color: #cccccc !important; border-color: #333 !important; }
        .puck-dark-theme [class*="ViewportButton"] svg { color: #cccccc !important; }
        .puck-dark-theme [class*="ViewportButton"]:hover svg { color: #fff !important; }
        .puck-dark-theme [class*="IconButton"] svg { color: #cccccc !important; }
        .puck-dark-theme [class*="IconButton"]:hover svg { color: #fff !important; }
      `}</style>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2A2A2A] bg-[#111111] shrink-0">
        <button
          onClick={() => router.push("/admin/pages")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[#C6FF00] hover:bg-[#C6FF00]/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Pages
        </button>
        <span className="text-[#333]">|</span>
        <span className="text-sm font-semibold text-white truncate">{pageTitle}</span>
      </div>
      <div className="flex-1">
        <Puck
          config={puckConfig}
          data={initialData}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}
