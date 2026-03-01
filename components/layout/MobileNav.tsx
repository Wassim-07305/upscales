"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageCircle, Newspaper, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile } from "@/lib/types/database";

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { href: "/formations", icon: BookOpen, label: "Formations" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/ai", icon: Sparkles, label: "IA" },
  { href: "/community", icon: Newspaper, label: "Feed" },
];

interface MobileNavProps {
  user: Profile;
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          if ((item.href === "/chat" || item.href === "/ai") && user.role === "prospect") return null;

          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
