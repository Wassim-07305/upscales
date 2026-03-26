"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { LandingPage } from "@/lib/types/database";

const MyPagesClient = dynamic(
  () => import("./MyPagesClient").then((m) => m.MyPagesClient),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    ),
  }
);

export function MyPagesWrapper({ pages }: { pages: LandingPage[] }) {
  return <MyPagesClient pages={pages} />;
}
