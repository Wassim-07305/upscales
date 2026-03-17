"use client";

import { Render, type Data } from "@measured/puck";
import { puckConfig } from "@/lib/puck/config";

export function ScalingPageClient({ data }: { data: Data }) {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <Render config={puckConfig} data={data} />
    </main>
  );
}
