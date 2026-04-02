"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSupabase } from "./use-supabase";
import { useAuth } from "./use-auth";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Track online users via Supabase Presence.
 * Returns a Set of online user IDs + broadcast my own presence.
 * Heartbeat toutes les 30s pour maintenir la presence meme si la connexion est instable.
 */
export function useOnlineStatus() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        for (const key of Object.keys(state)) {
          ids.add(key);
        }
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Heartbeat : re-track toutes les 30s pour maintenir la presence
    const heartbeat = setInterval(async () => {
      if (channelRef.current) {
        try {
          await channelRef.current.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        } catch {
          // Ignorer les erreurs de heartbeat (reconnexion en cours)
        }
      }
    }, 30_000);

    // Re-track quand l'onglet redevient visible
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && channelRef.current) {
        try {
          await channelRef.current.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        } catch {
          // Ignorer
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, user]);

  const isOnline = useCallback(
    (userId: string) => onlineUserIds.has(userId),
    [onlineUserIds],
  );

  return { onlineUserIds, isOnline };
}
