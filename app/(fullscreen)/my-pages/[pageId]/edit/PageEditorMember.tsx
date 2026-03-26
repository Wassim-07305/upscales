"use client";

import dynamic from "next/dynamic";
import type { Data } from "@measured/puck";
import "@measured/puck/puck.css";
import "@/lib/puck/puck-overrides.css";
import { puckConfig } from "@/lib/puck/config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface PageEditorMemberProps {
  pageId: string;
  initialData: Data;
  pageTitle: string;
}

export function PageEditorMember({
  pageId,
  initialData,
  pageTitle,
}: PageEditorMemberProps) {
  async function handlePublish(data: Data) {
    try {
      const res = await fetch(`/api/my-pages/${pageId}`, {
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
    <div className="h-screen puck-dark-theme">
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
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        headerTitle={pageTitle}
        headerPath="/my-pages"
      />
    </div>
  );
}
