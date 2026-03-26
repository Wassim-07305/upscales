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

interface PageEditorProps {
  pageId: string;
  initialData: Data;
  pageTitle: string;
}

export function PageEditor({ pageId, initialData, pageTitle }: PageEditorProps) {
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
    <div className="h-screen">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        headerTitle={pageTitle}
        headerPath="/admin/pages"
      />
    </div>
  );
}
