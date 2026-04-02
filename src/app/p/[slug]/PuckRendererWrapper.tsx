"use client";

import dynamic from "next/dynamic";
import type { Data } from "@measured/puck";

const PuckRenderer = dynamic(
  () => import("./PuckRenderer").then((m) => m.PuckRenderer),
  { ssr: false },
);

export function PuckRendererWrapper({ data }: { data: Data }) {
  return <PuckRenderer data={data} />;
}
