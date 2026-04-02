"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
    ))}
  </div>
);

const JournalContent = dynamic(
  () => import("@/app/client/journal/journal-content"),
  { ssr: false, loading: LoadingSkeleton },
);
const CheckinContent = dynamic(() => import("@/app/client/checkin/page"), {
  ssr: false,
  loading: LoadingSkeleton,
});

type Tab = "journal" | "checkin";

const TABS: { key: Tab; label: string }[] = [
  { key: "journal", label: "Journal" },
  { key: "checkin", label: "Check-in" },
];

export default function JournalSuiviPage() {
  const [tab, setTab] = useState<Tab>("journal");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Journal & Suivi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reflexions quotidiennes et bilan hebdomadaire
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
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
      </motion.div>

      <motion.div variants={staggerItem}>
        {tab === "journal" && <JournalContent />}
        {tab === "checkin" && <CheckinContent />}
      </motion.div>
    </motion.div>
  );
}
