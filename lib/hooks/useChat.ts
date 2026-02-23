"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Channel, Message, ChannelMember } from "@/lib/types/database";

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchChannels() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberOf } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", user.id);

      const channelIds = memberOf?.map((m) => m.channel_id) || [];

      const { data: allChannels } = await supabase
        .from("channels")
        .select("*")
        .eq("is_archived", false)
        .order("created_at");

      if (allChannels) {
        setChannels(allChannels.filter((c) => c.type !== "dm"));
        setDmChannels(
          allChannels.filter((c) => c.type === "dm" && channelIds.includes(c.id))
        );
      }
      setLoading(false);
    }
    fetchChannels();
  }, []);

  return { channels, dmChannels, loading };
}

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(data || []);
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("messages")
            .select("*, sender:profiles(*)")
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchMessages]);

  const sendMessage = async (content: string, mediaUrl?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("messages").insert({
      channel_id: channelId,
      sender_id: user.id,
      content,
      media_url: mediaUrl || null,
    });
  };

  return { messages, loading, sendMessage };
}
