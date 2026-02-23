"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Lock,
  MessageCircle,
  Send,
  Plus,
  Users,
  Search,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Channel, Message, Profile } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatMessageDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatLayoutProps {
  user: Profile;
  publicChannels: Channel[];
  privateChannels: Channel[];
  dmChannels: Channel[];
  memberChannelIds: string[];
  allUsers: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_online">[];
}

export function ChatLayout({
  user,
  publicChannels,
  privateChannels,
  dmChannels,
  memberChannelIds,
  allUsers,
}: ChatLayoutProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<(Message & { sender?: Profile })[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChannelList, setShowChannelList] = useState(true);
  const [dmSearchOpen, setDmSearchOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      setLoading(true);
      // Join channel if not member
      if (!memberChannelIds.includes(activeChannel.id) && activeChannel.type === "public") {
        await supabase.from("channel_members").insert({
          channel_id: activeChannel.id,
          user_id: user.id,
        });
      }

      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles(*)")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(100);

      setMessages(data || []);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from("messages")
            .select("*, sender:profiles(*)")
            .eq("id", payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return;

    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const optimisticMsg: Message & { sender?: Profile } = {
      id: `temp-${Date.now()}`,
      channel_id: activeChannel.id,
      sender_id: user.id,
      content,
      media_url: null,
      is_edited: false,
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    await supabase.from("messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const createDM = async (otherUserId: string) => {
    // Check if DM already exists
    const otherUser = allUsers.find((u) => u.id === otherUserId);
    if (!otherUser) return;

    const { data: existingDMs } = await supabase
      .from("channels")
      .select("*, channel_members(*)")
      .eq("type", "dm");

    const existingDM = existingDMs?.find((ch) => {
      const members = ch.channel_members || [];
      return (
        members.length === 2 &&
        members.some((m: any) => m.user_id === user.id) &&
        members.some((m: any) => m.user_id === otherUserId)
      );
    });

    if (existingDM) {
      setActiveChannel(existingDM);
      setShowChannelList(false);
      setDmSearchOpen(false);
      return;
    }

    // Create new DM channel
    const { data: newChannel } = await supabase
      .from("channels")
      .insert({
        name: `${user.full_name} & ${otherUser.full_name}`,
        type: "dm",
        created_by: user.id,
      })
      .select()
      .single();

    if (newChannel) {
      await supabase.from("channel_members").insert([
        { channel_id: newChannel.id, user_id: user.id },
        { channel_id: newChannel.id, user_id: otherUserId },
      ]);

      setActiveChannel(newChannel);
      setShowChannelList(false);
    }
    setDmSearchOpen(false);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.full_name?.toLowerCase().includes(dmSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] -m-4 md:-m-6 rounded-xl overflow-hidden border border-border">
      {/* Channel list */}
      <div
        className={cn(
          "w-full md:w-[260px] bg-card border-r border-border flex flex-col flex-shrink-0",
          !showChannelList && "hidden md:flex"
        )}
      >
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Messages</h2>
          <Dialog open={dmSearchOpen} onOpenChange={setDmSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Rechercher un utilisateur..."
                value={dmSearch}
                onChange={(e) => setDmSearch(e.target.value)}
              />
              <ScrollArea className="max-h-[300px]">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => createDM(u.id)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(u.full_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      {u.is_online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
                    <span className="text-sm">{u.full_name}</span>
                  </button>
                ))}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          {/* Public channels */}
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Channels
            </p>
            {publicChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChannel(ch);
                  setShowChannelList(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors",
                  activeChannel?.id === ch.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="text-base">{ch.icon || "#"}</span>
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
            {privateChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChannel(ch);
                  setShowChannelList(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors",
                  activeChannel?.id === ch.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* DMs */}
          {dmChannels.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Messages privés
              </p>
              {dmChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch);
                    setShowChannelList(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors",
                    activeChannel?.id === ch.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          showChannelList && !activeChannel && "hidden md:flex"
        )}
      >
        {activeChannel ? (
          <>
            {/* Chat header */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setShowChannelList(true)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg">{activeChannel.icon || "#"}</span>
              <div>
                <p className="font-medium text-sm">{activeChannel.name}</p>
                {activeChannel.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {activeChannel.description}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id;

                  return (
                    <div key={msg.id} className="flex items-start gap-3">
                      {!isOwn && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(msg.sender?.full_name || "")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("flex-1", isOwn && "flex flex-col items-end")}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">
                            {isOwn ? "Vous" : msg.sender?.full_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageDate(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "inline-block px-3 py-2 rounded-2xl text-sm max-w-[80%]",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  className="bg-secondary/50 border-0"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
