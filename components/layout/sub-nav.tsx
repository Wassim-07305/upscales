"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SubNavTab {
  label: string;
  href: string;
}

export function SubNav({ tabs }: { tabs: SubNavTab[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg bg-muted/50 p-1 mb-6 overflow-x-auto max-w-full scrollbar-none">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
