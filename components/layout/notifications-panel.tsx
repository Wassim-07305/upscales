"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { toast } from "sonner";
import type { Notification } from "@/lib/types/database";

// ─── Mapping type → emoji pour Upscale ──────────────────────
const DEFAULT_TYPE_ICONS: Record<string, string> = {
  message: "\u{1F4AC}",
  post: "\u{1F4DD}",
  formation: "\u{1F4DA}",
  session: "\u{1F4C5}",
  certificate: "\u{1F3C5}",
  system: "\u{1F514}",
};

// ─── Props ──────────────────────────────────────────────────

interface NotificationsPanelProps {
  userId: string;
  onUnreadCountChange: (count: number) => void;
  /** Mapping type → emoji personnalise. Fusionne avec les valeurs par defaut. */
  typeIcons?: Record<string, string>;
}

// ─── Component ──────────────────────────────────────────────

export function NotificationsPanel({
  userId,
  onUnreadCountChange,
  typeIcons,
}: NotificationsPanelProps) {
  const { notificationsPanelOpen, setNotificationsPanelOpen } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const icons = { ...DEFAULT_TYPE_ICONS, ...typeIcons };

  useEffect(() => {
    const supabase = createClient();

    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (data) {
        setNotifications(data);
        const count = data.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(count);
        onUnreadCountChange(count);
      }
    }

    fetchNotifications();

    // Abonnement temps reel
    const channel = supabase
      .channel("notifications-panel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
          setUnreadCount((prev) => {
            const next = prev + 1;
            onUnreadCountChange(next);
            return next;
          });
          toast(newNotif.title, { description: newNotif.message || undefined });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUnreadCountChange]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      onUnreadCountChange(next);
      return next;
    });
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    onUnreadCountChange(0);
  }

  return (
    <Sheet
      open={notificationsPanelOpen}
      onOpenChange={setNotificationsPanelOpen}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={handleMarkAllRead}
              >
                <Check className="mr-1 h-3 w-3" />
                Tout marquer lu
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune notification
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) handleMarkRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                    !n.is_read
                      ? "bg-brand/5 hover:bg-brand/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className="mt-0.5 text-lg shrink-0">
                    {icons[n.type || ""] || "\u{1F514}"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !n.is_read
                            ? "font-semibold text-foreground"
                            : "text-foreground"
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      )}
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
