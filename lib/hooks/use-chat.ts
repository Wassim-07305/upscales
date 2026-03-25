"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Channel, Message, Profile } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrichedMessage extends Message {
  sender?: Profile;
  is_pinned?: boolean;
  reactions?: { emoji: string; user_id: string }[];
}

export interface ChannelWithMeta extends Channel {
  unreadCount: number;
  dmPartner?: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_online"> | null;
}

// ---------------------------------------------------------------------------
// useMessages — fetch, subscribe, send, edit, delete, pin, react
// ---------------------------------------------------------------------------

export function useMessages(channelId: string | null, userId: string) {
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Fetch messages + reactions for a channel
  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(200);

    const msgs = (data || []) as EnrichedMessage[];
    setMessages(msgs);
    setLoading(false);

    // Fetch reactions for these messages
    if (msgs.length > 0) {
      const msgIds = msgs.map((m) => m.id);
      const { data: rxns } = await supabase
        .from("message_reactions")
        .select("message_id, emoji, user_id")
        .in("message_id", msgIds);

      if (rxns) {
        const grouped: Record<string, { emoji: string; user_id: string }[]> = {};
        rxns.forEach((r) => {
          if (!grouped[r.message_id]) grouped[r.message_id] = [];
          grouped[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
        });
        setReactions(grouped);
      }
    } else {
      setReactions({});
    }
  }, [channelId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setReactions({});
      return;
    }

    fetchMessages();

    // Subscribe to messages INSERT/UPDATE/DELETE
    const msgChannel = supabase
      .channel(`chat-msg-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the full message with sender
            const { data: newMsg } = await supabase
              .from("messages")
              .select("*, sender:profiles(*)")
              .eq("id", payload.new.id)
              .single();
            if (newMsg) {
              setMessages((prev) => {
                // Remove optimistic message if exists
                const filtered = prev.filter((m) => !m.id.startsWith("optimistic-"));
                // Avoid duplicates
                if (filtered.some((m) => m.id === newMsg.id)) return filtered;
                return [...filtered, newMsg as EnrichedMessage];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? { ...m, content: payload.new.content, is_edited: payload.new.is_edited, is_pinned: payload.new.is_pinned }
                  : m
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to reactions changes
    const rxnChannel = supabase
      .channel(`chat-rxn-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => {
          // Refetch reactions on any change
          const msgIds = messages.map((m) => m.id);
          if (msgIds.length > 0) {
            supabase
              .from("message_reactions")
              .select("message_id, emoji, user_id")
              .in("message_id", msgIds)
              .then(({ data: rxns }) => {
                if (rxns) {
                  const grouped: Record<string, { emoji: string; user_id: string }[]> = {};
                  rxns.forEach((r) => {
                    if (!grouped[r.message_id]) grouped[r.message_id] = [];
                    grouped[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
                  });
                  setReactions(grouped);
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(rxnChannel);
    };
  }, [channelId]);

  // Send message (with optimistic update)
  const sendMessage = useCallback(
    async (content: string, parentId?: string | null, mediaUrl?: string | null) => {
      if (!channelId || !userId) return;

      // Optimistic message
      const optimistic: EnrichedMessage = {
        id: `optimistic-${Date.now()}`,
        channel_id: channelId,
        sender_id: userId,
        content,
        media_url: mediaUrl || null,
        is_edited: false,
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        sender_id: userId,
        content,
        media_url: mediaUrl || null,
        parent_id: parentId || null,
      });

      if (error) {
        // Remove optimistic on error
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    },
    [channelId, userId]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      // Optimistic
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content, is_edited: true } : m))
      );
      await supabase
        .from("messages")
        .update({ content, is_edited: true })
        .eq("id", messageId);
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await supabase.from("messages").delete().eq("id", messageId);
    },
    []
  );

  const togglePin = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      const newPinned = !msg.is_pinned;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: newPinned } : m))
      );
      await supabase.from("messages").update({ is_pinned: newPinned }).eq("id", messageId);
    },
    [messages]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const msgReactions = reactions[messageId] || [];
      const existing = msgReactions.find((r) => r.emoji === emoji && r.user_id === userId);

      if (existing) {
        // Optimistic remove
        setReactions((prev) => ({
          ...prev,
          [messageId]: (prev[messageId] || []).filter(
            (r) => !(r.emoji === emoji && r.user_id === userId)
          ),
        }));
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId)
          .eq("emoji", emoji);
      } else {
        // Optimistic add
        setReactions((prev) => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), { emoji, user_id: userId }],
        }));
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        });
      }
    },
    [reactions, userId]
  );

  return {
    messages,
    reactions,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
    refetch: fetchMessages,
  };
}

// ---------------------------------------------------------------------------
// useChannels — fetch channels, create DM, mark read, unread counts
// ---------------------------------------------------------------------------

export function useChannels(userId: string) {
  const [publicChannels, setPublicChannels] = useState<ChannelWithMeta[]>([]);
  const [privateChannels, setPrivateChannels] = useState<ChannelWithMeta[]>([]);
  const [dmChannels, setDmChannels] = useState<ChannelWithMeta[]>([]);
  const [memberChannelIds, setMemberChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchChannels = useCallback(async () => {
    if (!userId) return;

    // Fetch membership + channels in parallel
    const [{ data: memberships }, { data: channels }, { data: allProfiles }] = await Promise.all([
      supabase.from("channel_members").select("channel_id, last_read_at").eq("user_id", userId),
      supabase.from("channels").select("*").eq("is_archived", false).order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase.from("profiles").select("id, full_name, avatar_url, is_online").neq("id", userId),
    ]);

    const memberMap = new Map<string, string | null>();
    (memberships || []).forEach((m) => memberMap.set(m.channel_id, m.last_read_at));
    const memberIds = Array.from(memberMap.keys());
    setMemberChannelIds(memberIds);

    if (!channels) {
      setLoading(false);
      return;
    }

    // Compute unread counts for member channels
    const unreadCounts: Record<string, number> = {};
    for (const chId of memberIds) {
      const lastRead = memberMap.get(chId);
      let query = supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", chId)
        .neq("sender_id", userId);
      if (lastRead) {
        query = query.gt("created_at", lastRead);
      }
      const { count } = await query;
      unreadCounts[chId] = count || 0;
    }

    // Build DM partner map
    const dmPartnerMap: Record<string, Pick<Profile, "id" | "full_name" | "avatar_url" | "is_online">> = {};
    const dmChs = channels.filter((c) => c.type === "dm" && memberIds.includes(c.id));
    if (dmChs.length > 0) {
      const { data: dmMembers } = await supabase
        .from("channel_members")
        .select("channel_id, user_id")
        .in("channel_id", dmChs.map((c) => c.id))
        .neq("user_id", userId);

      (dmMembers || []).forEach((dm) => {
        const profile = (allProfiles || []).find((p) => p.id === dm.user_id);
        if (profile) {
          dmPartnerMap[dm.channel_id] = profile;
        }
      });
    }

    // Enrich channels
    const enrich = (ch: Channel): ChannelWithMeta => ({
      ...ch,
      unreadCount: unreadCounts[ch.id] || 0,
      dmPartner: dmPartnerMap[ch.id] || null,
    });

    setPublicChannels(channels.filter((c) => c.type === "public").map(enrich));
    setPrivateChannels(channels.filter((c) => c.type === "private" && memberIds.includes(c.id)).map(enrich));
    setDmChannels(dmChs.map(enrich));
    setLoading(false);
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Realtime: refresh channels on new messages (for unread counts + ordering)
  useEffect(() => {
    const channel = supabase
      .channel("chat-channel-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          // Debounce refetch
          setTimeout(() => fetchChannels(), 500);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channels" },
        () => fetchChannels()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChannels]);

  // Mark channel as read
  const markAsRead = useCallback(
    async (channelId: string) => {
      if (!userId || !memberChannelIds.includes(channelId)) return;
      await supabase
        .from("channel_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", channelId)
        .eq("user_id", userId);
    },
    [userId, memberChannelIds]
  );

  // Create or open DM (via API route to bypass RLS for member insertion)
  const openOrCreateDM = useCallback(
    async (otherUserId: string): Promise<Channel | null> => {
      if (!userId) return null;

      // Check existing DM in local state
      const existingLocal = dmChannels.find((ch) => ch.dmPartner?.id === otherUserId);
      if (existingLocal) return existingLocal;

      // Use API route (admin client) to handle DM creation
      const res = await fetch("/api/chat/create-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });

      if (!res.ok) return null;

      const { channel } = await res.json();

      // Refresh channels
      await fetchChannels();
      return channel as Channel;
    },
    [userId, dmChannels, fetchChannels]
  );

  // Join public channel
  const joinChannel = useCallback(
    async (channelId: string) => {
      if (memberChannelIds.includes(channelId)) return;
      await supabase.from("channel_members").insert({
        channel_id: channelId,
        user_id: userId,
      });
      setMemberChannelIds((prev) => [...prev, channelId]);
    },
    [userId, memberChannelIds]
  );

  return {
    publicChannels,
    privateChannels,
    dmChannels,
    memberChannelIds,
    loading,
    markAsRead,
    openOrCreateDM,
    joinChannel,
    refetch: fetchChannels,
  };
}

// ---------------------------------------------------------------------------
// useTypingIndicator — broadcast & listen for typing events
// ---------------------------------------------------------------------------

export function useTypingIndicator(channelId: string | null, userId: string, userName: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastTypingRef = useRef<number>(0);
  const supabase = createClient();

  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }

    const channel = supabase.channel(`typing-${channelId}`);
    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id === userId) return;
        const name = payload.user_name || "Quelqu'un";
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, userId]);

  const broadcastTyping = useCallback(() => {
    if (!channelId) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 2000) return;
    lastTypingRef.current = now;

    supabase.channel(`typing-${channelId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId, user_name: userName },
    });
  }, [channelId, userId, userName]);

  return { typingUsers, broadcastTyping };
}

// ---------------------------------------------------------------------------
// useBlockedUsers
// ---------------------------------------------------------------------------

export function useBlockedUsers(userId: string) {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", userId)
      .then(({ data }) => {
        if (data) setBlockedIds(data.map((b) => b.blocked_id));
      });
  }, [userId]);

  const toggleBlock = useCallback(
    async (targetId: string) => {
      if (blockedIds.includes(targetId)) {
        await supabase.from("blocked_users").delete().eq("blocker_id", userId).eq("blocked_id", targetId);
        setBlockedIds((prev) => prev.filter((id) => id !== targetId));
        return false; // now unblocked
      } else {
        await supabase.from("blocked_users").insert({ blocker_id: userId, blocked_id: targetId });
        setBlockedIds((prev) => [...prev, targetId]);
        return true; // now blocked
      }
    },
    [userId, blockedIds]
  );

  return { blockedIds, toggleBlock };
}
