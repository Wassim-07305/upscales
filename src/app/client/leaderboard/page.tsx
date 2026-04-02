"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useHallOfFame } from "@/hooks/use-hall-of-fame";
import type { HallOfFameEntry } from "@/hooks/use-hall-of-fame";
import { cn, formatCurrency } from "@/lib/utils";
import { Crown, Star, Trophy } from "lucide-react";

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
    ))}
  </div>
);

const LeaderboardContent = dynamic(() => import("./leaderboard-content"), {
  ssr: false,
  loading: LoadingSkeleton,
});
const ChallengesContent = dynamic(
  () => import("@/app/client/challenges/page"),
  { ssr: false, loading: LoadingSkeleton },
);

type Tab = "classement" | "defis";

const TABS: { value: Tab; label: string; icon: typeof Trophy }[] = [
  { value: "classement", label: "Classement", icon: Trophy },
  { value: "defis", label: "Defis", icon: Star },
];

// ─── Hall of Fame Banner ──────────────────────────────────
function HallOfFameBanner({ entries }: { entries: HallOfFameEntry[] }) {
  // Trier par revenu mensuel decroissant et prendre les 5 premiers
  const topPerformers = [...entries]
    .sort((a, b) => b.monthly_revenue - a.monthly_revenue)
    .slice(0, 5);

  if (topPerformers.length === 0) return null;

  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface border border-border rounded-[14px] p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-amber-500" />
        <h2 className="text-sm font-semibold text-foreground">Hall of Fame</h2>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        {topPerformers.map((entry, index) => (
          <div
            key={entry.id}
            className="flex flex-col items-center gap-1.5 min-w-[80px] shrink-0"
          >
            {/* Avatar */}
            <div className="relative">
              {index === 0 && (
                <Crown className="w-3.5 h-3.5 text-amber-500 absolute -top-2 left-1/2 -translate-x-1/2 z-10" />
              )}
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden",
                  index === 0
                    ? "ring-2 ring-amber-500/40 bg-amber-500/10"
                    : "ring-1 ring-border bg-muted",
                )}
              >
                {entry.profile?.avatar_url ? (
                  <Image
                    src={entry.profile.avatar_url}
                    alt={entry.profile.full_name}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-foreground">
                    {entry.profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            </div>

            {/* Nom */}
            <p className="text-xs font-medium text-foreground truncate max-w-[80px] text-center">
              {entry.profile?.full_name ?? "Anonyme"}
            </p>

            {/* Revenu */}
            <p className="text-[10px] font-semibold text-amber-600 tabular-nums">
              {formatCurrency(entry.monthly_revenue)}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function ClientLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("classement");
  const { entries: hallEntries } = useHallOfFame();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Classement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ton rang parmi les autres freelances et les defis en cours
        </p>
      </motion.div>

      {/* Hall of Fame Banner */}
      {hallEntries.length > 0 && <HallOfFameBanner entries={hallEntries} />}

      {/* Onglets */}
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer",
                activeTab === tab.value
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Contenu de l'onglet actif */}
      <motion.div variants={staggerItem}>
        {activeTab === "classement" && <LeaderboardContent />}
        {activeTab === "defis" && <ChallengesContent />}
      </motion.div>
    </motion.div>
  );
}
