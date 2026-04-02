"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import FeedContent from "@/app/_shared-pages/feed/page";
import MembersContent from "@/app/_shared-pages/community/members/page";

type CommunityTab = "feed" | "members";

const TABS: { key: CommunityTab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "members", label: "Membres" },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-heading)] font-bold text-foreground tracking-tight">
          Communaute
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
          Partagez vos victoires et echangez avec la communaute
        </p>
      </div>

      {/* Tabs — style Finances (underline) */}
      <div className="flex items-center gap-0 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "h-10 px-4 text-sm font-medium transition-all relative",
              activeTab === tab.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "feed" ? <FeedContent /> : <MembersContent />}
    </div>
  );
}
