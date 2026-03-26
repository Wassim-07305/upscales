"use client";

import dynamic from "next/dynamic";
import type { Data } from "@measured/puck";
import { Loader2 } from "lucide-react";

const PageEditorMember = dynamic(
  () => import("./PageEditorMember").then((m) => m.PageEditorMember),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-neon" />
      </div>
    ),
  }
);

interface EditorWrapperProps {
  pageId: string;
  initialData: Data;
  pageTitle: string;
}

export function EditorWrapper(props: EditorWrapperProps) {
  return <PageEditorMember {...props} />;
}
