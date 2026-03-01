"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Newspaper,
  CalendarDays,
  CalendarCheck,
  Bell,
  Award,
  User,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Brain,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Profile } from "@/lib/types/database";
import { isModerator, isAdmin, getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const mainNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/formations", icon: BookOpen, label: "Formations" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/ai", icon: Sparkles, label: "MateuzsIA" },
  { href: "/community", icon: Newspaper, label: "Communauté" },
  { href: "/calendar", icon: CalendarDays, label: "Calendrier" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/certificates", icon: Award, label: "Certificats" },
  { href: "/profile", icon: User, label: "Profil" },
];

const adminNavItems = [
  { href: "/admin", icon: BarChart3, label: "Analytics" },
  { href: "/admin/crm", icon: Users, label: "CRM" },
  { href: "/admin/formations", icon: BookOpen, label: "Formations" },
  { href: "/admin/pages", icon: FileText, label: "Pages" },
  { href: "/admin/booking", icon: CalendarCheck, label: "Booking" },
  { href: "/admin/channels", icon: MessageCircle, label: "Channels" },
  { href: "/admin/calendar", icon: CalendarDays, label: "Sessions" },
  { href: "/admin/ai", icon: Brain, label: "Base IA" },
  { href: "/admin/settings", icon: Settings, label: "Paramètres" },
];

interface SidebarProps {
  user: Profile;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-border/50",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Image src="/icons/icon-48x48.png" alt="UPSCALE" width={28} height={28} className="rounded-lg" />
          </button>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/icons/icon-48x48.png" alt="UPSCALE" width={32} height={32} className="rounded-lg flex-shrink-0" />
              <span className="font-display font-bold text-lg tracking-tight">UPSCALE</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          // Hide chat and AI for prospects
          if ((item.href === "/chat" || item.href === "/ai") && user.role === "prospect") return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary sidebar-glow-active"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isModerator(user.role) && (
          <>
            <div className="pt-4 pb-2">
              {!collapsed && (
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </span>
              )}
              {collapsed && <div className="border-t border-border mx-3" />}
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

              if (!isAdmin(user.role) && item.href === "/admin/settings") return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary sidebar-glow-active"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getRoleBadgeColor(user.role))}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
