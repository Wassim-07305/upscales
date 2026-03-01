"use client";

import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./puck-overrides.css";

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
    <div className="h-screen">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        headerTitle={pageTitle}
        headerPath={`/admin/pages`}
      />
    </div>
  );
}
