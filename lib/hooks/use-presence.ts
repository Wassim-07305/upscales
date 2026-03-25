"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

/**
 * Tracks user online presence.
 * - Sets is_online=true + last_seen_at on mount
 * - Heartbeat every 60s to update last_seen_at
 * - Sets is_online=false on unmount / tab close
 */
export function usePresence(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const setOnline = () => {
      supabase
        .from("profiles")
        .update({ is_online: true, last_seen_at: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});
    };

    const setOffline = () => {
      supabase
        .from("profiles")
        .update({ is_online: false, last_seen_at: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});
    };

    // Go online
    setOnline();

    // Heartbeat
    intervalRef.current = setInterval(setOnline, HEARTBEAT_INTERVAL);

    // Go offline on tab close / navigation away
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page unload
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
      const body = JSON.stringify({ is_online: false, last_seen_at: new Date().toISOString() });
      navigator.sendBeacon?.(
        url,
        new Blob([body], { type: "application/json" })
      );
    };

    // Also handle visibility change (tab hidden = might close)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setOffline();
    };
  }, [userId]);
}
