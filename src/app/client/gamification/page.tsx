"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const XpBadges = dynamic(() => import("./xp-badges"), { ssr: false });
const Challenges = dynamic(() => import("@/app/client/challenges/page"), {
  ssr: false,
});
const Certificates = dynamic(() => import("@/app/client/certificates/page"), {
  ssr: false,
});
const HallOfFame = dynamic(
  () => import("@/app/_shared-pages/hall-of-fame/page"),
  { ssr: false },
);

type ProgressionTab = "xp" | "defis" | "certificats" | "hall-of-fame";

const TABS: { key: ProgressionTab; label: string }[] = [
  { key: "xp", label: "Progression" },
  { key: "defis", label: "Défis" },
  { key: "certificats", label: "Certificats" },
  { key: "hall-of-fame", label: "Hall of Fame" },
];

export default function ProgressionPage() {
  const [tab, setTab] = useState<ProgressionTab>("xp");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Progression
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ton niveau, tes défis, certificats et récompenses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-10 px-4 text-sm font-medium transition-all relative",
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "xp" && <XpBadges />}
      {tab === "defis" && <Challenges />}
      {tab === "certificats" && <Certificates />}
      {tab === "hall-of-fame" && <HallOfFame />}
    </div>
  );
}
