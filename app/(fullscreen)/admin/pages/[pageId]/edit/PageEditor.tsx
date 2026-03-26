"use client";

import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import "@/lib/puck/puck-overrides.css";

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
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1C1C1C] bg-[#0D0D0D] shrink-0">
        <button
          onClick={() => router.push("/admin/pages")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Pages
        </button>
        <span className="text-sm text-muted-foreground/50">•</span>
        <span className="text-sm font-medium truncate">{pageTitle}</span>
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
