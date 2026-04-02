"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  staggerContainer,
  fadeInUp,
  defaultTransition,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AdminRewards } from "@/components/gamification/admin-rewards";
import { Gift, Trophy, Flame } from "lucide-react";
import dynamic from "next/dynamic";

const ChallengesContent = dynamic(() => import("@/app/admin/challenges/page"), {
  ssr: false,
});

type Tab = "recompenses" | "defis";

export default function AdminRewardsPage() {
  const [tab, setTab] = useState<Tab>("recompenses");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Gamification & Defis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerez les recompenses et les challenges de la communaute
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} transition={defaultTransition}>
        <div className="flex items-center gap-0 border-b border-border">
          <button
            onClick={() => setTab("recompenses")}
            className={cn(
              "h-10 flex items-center gap-2 px-4 text-sm font-medium transition-all relative",
              tab === "recompenses"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Gift className="w-4 h-4" />
            Recompenses
            {tab === "recompenses" && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setTab("defis")}
            className={cn(
              "h-10 flex items-center gap-2 px-4 text-sm font-medium transition-all relative",
              tab === "defis"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Flame className="w-4 h-4" />
            Defis
            {tab === "defis" && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div>
        {tab === "recompenses" && <AdminRewards />}
        {tab === "defis" && <ChallengesContent />}
      </div>
    </motion.div>
  );
}
