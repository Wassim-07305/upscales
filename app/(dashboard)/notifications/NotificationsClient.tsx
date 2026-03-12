"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { CheckCheck, Trash2, Bell, BellOff, Loader2 } from "lucide-react";
import { Notification, NotificationType } from "@/lib/types/database";
import { toast } from "sonner";

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

const TYPE_LABELS: Record<NotificationType, string> = {
  message: "Messages",
  post: "Publications",
  formation: "Formations",
  session: "Sessions",
  certificate: "Certificats",
  system: "Système",
};

type FilterMode = "all" | "unread" | "read";

const PAGE_SIZE = 30;

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 100);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingMore(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(notifications.length, notifications.length + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      setNotifications((prev) => [...prev, ...data]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [notifications.length, loadingMore, hasMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Get available types from actual notifications
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types) as NotificationType[];
  }, [notifications]);

  const filtered = useMemo(() => {
    let result = notifications;
    if (filterMode === "unread") result = result.filter((n) => !n.is_read);
    if (filterMode === "read") result = result.filter((n) => n.is_read);
    if (typeFilter !== "all") result = result.filter((n) => n.type === typeFilter);
    return result;
  }, [notifications, filterMode, typeFilter]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Toutes les notifications marquées comme lues");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const deleteAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("is_read", true);

    setNotifications((prev) => prev.filter((n) => !n.is_read));
    toast.success("Notifications lues supprimées");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Toutes lues"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.some((n) => n.is_read) && (
            <Button variant="outline" size="sm" onClick={deleteAllRead} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer les lues
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          {(["all", "unread", "read"] as FilterMode[]).map((mode) => (
            <Button
              key={mode}
              variant={filterMode === mode ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode(mode)}
              className="text-xs"
            >
              {mode === "all" && <Bell className="mr-1.5 h-3.5 w-3.5" />}
              {mode === "unread" && <BellOff className="mr-1.5 h-3.5 w-3.5" />}
              {mode === "all" ? "Toutes" : mode === "unread" ? "Non lues" : "Lues"}
              {mode === "unread" && unreadCount > 0 && (
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        {availableTypes.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={typeFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              className="text-xs"
            >
              Tous les types
            </Button>
            {availableTypes.map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className="text-xs"
              >
                {TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {notifications.length === 0
                ? "Aucune notification"
                : "Aucune notification correspondant aux filtres"}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {filtered.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
