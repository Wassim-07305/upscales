"use client";

import dynamic from "next/dynamic";
import type { Data } from "@measured/puck";
import { Loader2 } from "lucide-react";

const PageEditor = dynamic(
  () => import("./PageEditor").then((m) => m.PageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    ),
  }
);

interface AdminEditorWrapperProps {
  pageId: string;
  initialData: Data;
  pageTitle: string;
}

export function AdminEditorWrapper(props: AdminEditorWrapperProps) {
  return <PageEditor {...props} />;
}
