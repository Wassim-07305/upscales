"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminRewards } from "@/components/gamification/admin-rewards";
import { ChallengesContent } from "@/components/gamification/challenges-content";

type Tab = "recompenses" | "defis";

export default function CoachGamificationPage() {
  const [tab, setTab] = useState<Tab>("recompenses");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Gamification & Défis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérer les récompenses et défis de tes élèves
        </p>
      </div>

      <div className="flex items-center gap-0 border-b border-border">
        {(
          [
            { key: "recompenses" as Tab, label: "Récompenses" },
            { key: "defis" as Tab, label: "Défis" },
          ] as const
        ).map((t) => (
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

      {tab === "recompenses" && <AdminRewards />}
      {tab === "defis" && <ChallengesContent />}
    </div>
  );
}
