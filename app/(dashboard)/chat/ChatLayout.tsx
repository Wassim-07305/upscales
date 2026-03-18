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
  Pencil,
  Trash2,
  Reply,
  X,
  Check,
  ImageIcon,
  Loader2,
  FileIcon,
  Smile,
  Pin,
  Ban,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);
  const [replyTo, setReplyTo] = useState<(Message & { sender?: Profile }) | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [archivedChannelIds, setArchivedChannelIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch blocked users and archived channels
  useEffect(() => {
    const fetchBlocksAndArchives = async () => {
      const [{ data: blocks }, { data: archives }] = await Promise.all([
        supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id),
        supabase.from("channel_archives").select("channel_id").eq("user_id", user.id),
      ]);
      if (blocks) setBlockedUserIds(blocks.map((b) => b.blocked_id));
      if (archives) setArchivedChannelIds(archives.map((a) => a.channel_id));
    };
    fetchBlocksAndArchives();
  }, [user.id]);

  const handleBlockUser = async (targetUserId: string) => {
    if (blockedUserIds.includes(targetUserId)) {
      await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId);
      setBlockedUserIds((prev) => prev.filter((id) => id !== targetUserId));
      toast.success("Utilisateur débloqué");
    } else {
      await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: targetUserId,
      });
      setBlockedUserIds((prev) => [...prev, targetUserId]);
      toast.success("Utilisateur bloqué");
    }
  };

  const handleToggleArchive = async (channelId: string) => {
    if (archivedChannelIds.includes(channelId)) {
      await supabase
        .from("channel_archives")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
      setArchivedChannelIds((prev) => prev.filter((id) => id !== channelId));
      toast.success("Conversation désarchivée");
    } else {
      await supabase.from("channel_archives").insert({
        channel_id: channelId,
        user_id: user.id,
      });
      setArchivedChannelIds((prev) => [...prev, channelId]);
      if (activeChannel?.id === channelId) {
        setActiveChannel(null);
        setShowChannelList(true);
      }
      toast.success("Conversation archivée");
    }
  };

  // Get the other user in a DM channel
  const getDmOtherUserId = (channel: Channel): string | null => {
    if (channel.type !== "dm") return null;
    const parts = channel.name.split(" & ");
    const otherName = parts.find((p) => p !== user.full_name) || parts[1];
    const otherUser = allUsers.find((u) => u.full_name === otherName);
    return otherUser?.id || null;
  };

  // Fetch messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      setLoading(true);
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
      fetchReactions(activeChannel.id);
    };

    fetchMessages();

    // Subscribe to message changes (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(`chat:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: newMsg } = await supabase
              .from("messages")
              .select("*, sender:profiles(*)")
              .eq("id", payload.new.id)
              .single();
            if (newMsg) {
              setMessages((prev) => {
                // Remove optimistic message if present
                const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
                return [...filtered, newMsg];
              });
              setTimeout(scrollToBottom, 100);
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? { ...m, content: payload.new.content, is_edited: payload.new.is_edited }
                  : m
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Typing indicator channel
    const presenceChannel = supabase.channel(`typing:${activeChannel.id}`);
    presenceChannel
      .on("broadcast", { event: "typing" }, ({ payload: p }) => {
        if (p.user_id === user.id) return;
        const name = p.user_name || "Quelqu'un";
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
        // Clear after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [activeChannel?.id]);

  // Broadcast typing
  const broadcastTyping = useCallback(() => {
    if (!activeChannel) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 2000) return;
    lastTypingRef.current = now;

    supabase.channel(`typing:${activeChannel.id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id, user_name: user.full_name },
    });
  }, [activeChannel?.id, user.id, user.full_name]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return;

    const content = newMessage.trim();
    setNewMessage("");

    const parentId = replyTo?.id?.startsWith("temp-") ? null : replyTo?.id || null;

    // Optimistic update
    const optimisticMsg: Message & { sender?: Profile; reply_to?: Message & { sender?: Profile } } = {
      id: `temp-${Date.now()}`,
      channel_id: activeChannel.id,
      sender_id: user.id,
      content,
      media_url: null,
      is_edited: false,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
      reply_to: replyTo || undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyTo(null);
    setTimeout(scrollToBottom, 50);

    await supabase.from("messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content,
      parent_id: parentId,
    });
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    await supabase
      .from("messages")
      .update({ content: editContent.trim(), is_edited: true })
      .eq("id", messageId);
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDeleteMessage = async (messageId: string) => {
    await supabase.from("messages").delete().eq("id", messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleTogglePin = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const newPinned = !(msg as any).is_pinned;
    await supabase
      .from("messages")
      .update({ is_pinned: newPinned })
      .eq("id", messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, is_pinned: newPinned } : m
      )
    );
    toast.success(newPinned ? "Message épinglé" : "Message désépinglé");
  };

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀"];

  const ALL_EMOJIS = [
    "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
    "😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
    "😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕",
    "🤢","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁",
    "☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣",
    "😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹",
    "👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
    "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
    "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏",
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖",
    "💝","💘","💟","☮️","✝️","☪️","🕉️","🔥","💫","⭐","🌟","✨","🎉","🎊","🎈","🎁",
    "🏆","🥇","🎯","🎪","🎭","🎨","🎬","🎤","🎧","🎸","🎺","🎻","🥁","🎷","🎮","🎲",
    "🚀","🛸","🌈","☀️","🌙","⭐","🌊","🌺","🌸","🌼","🌻","🍕","🍔","🍦","🍰","🎂",
    "☕","🍵","🥂","🍾","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐸",
  ];

  const fetchReactions = async (channelId: string) => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id")
      .eq("channel_id", channelId)
      .limit(100);
    if (!msgs || msgs.length === 0) return;
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
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const msgReactions = reactions[messageId] || [];
    const existing = msgReactions.find(
      (r) => r.emoji === emoji && r.user_id === user.id
    );

    if (existing) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
      setReactions((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter(
          (r) => !(r.emoji === emoji && r.user_id === user.id)
        ),
      }));
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
      setReactions((prev) => ({
        ...prev,
        [messageId]: [
          ...(prev[messageId] || []),
          { emoji, user_id: user.id },
        ],
      }));
    }
    setShowEmojiPicker(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  const handleFileUpload = async (file: File) => {
    if (!activeChannel) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "media");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erreur d'upload");
      const { url } = await res.json();

      const isImage = file.type.startsWith("image/");
      const content = isImage ? "" : `📎 ${file.name}`;

      await supabase.from("messages").insert({
        channel_id: activeChannel.id,
        sender_id: user.id,
        content: content,
        media_url: url,
        parent_id: replyTo?.id?.startsWith("temp-") ? null : replyTo?.id || null,
      });

      setReplyTo(null);
    } catch {
      toast.error("Erreur lors de l'envoi du fichier");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const createDM = async (otherUserId: string) => {
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
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-neon border-2 border-card" />
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
              {dmChannels
                .filter((ch) => !archivedChannelIds.includes(ch.id))
                .map((ch) => (
                <div key={ch.id} className="group/dm flex items-center">
                  <button
                    onClick={() => {
                      setActiveChannel(ch);
                      setShowChannelList(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      activeChannel?.id === ch.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                  <button
                    onClick={() => handleToggleArchive(ch.id)}
                    className="hidden group-hover/dm:block p-1 text-muted-foreground hover:text-foreground"
                    title="Archiver"
                  >
                    <Archive className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Archived toggle */}
              {dmChannels.some((ch) => archivedChannelIds.includes(ch.id)) && (
                <>
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Archive className="h-3 w-3" />
                    <span>
                      {showArchived ? "Masquer archivés" : `Archivés (${dmChannels.filter((ch) => archivedChannelIds.includes(ch.id)).length})`}
                    </span>
                  </button>
                  {showArchived &&
                    dmChannels
                      .filter((ch) => archivedChannelIds.includes(ch.id))
                      .map((ch) => (
                        <div key={ch.id} className="group/dm flex items-center opacity-60">
                          <button
                            onClick={() => {
                              setActiveChannel(ch);
                              setShowChannelList(false);
                            }}
                            className={cn(
                              "flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors",
                              activeChannel?.id === ch.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="truncate">{ch.name}</span>
                          </button>
                          <button
                            onClick={() => handleToggleArchive(ch.id)}
                            className="hidden group-hover/dm:block p-1 text-muted-foreground hover:text-foreground"
                            title="Désarchiver"
                          >
                            <ArchiveRestore className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                </>
              )}
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
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activeChannel.name}</p>
                {activeChannel.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {activeChannel.description}
                  </p>
                )}
              </div>
              {activeChannel.type === "dm" && (() => {
                const otherUserId = getDmOtherUserId(activeChannel);
                if (!otherUserId) return null;
                const isBlocked = blockedUserIds.includes(otherUserId);
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBlockUser(otherUserId)}
                    className={cn(
                      "text-xs gap-1.5",
                      isBlocked ? "text-destructive hover:text-destructive" : "text-muted-foreground"
                    )}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {isBlocked ? "Débloquer" : "Bloquer"}
                  </Button>
                );
              })()}
            </div>

            {/* Pinned messages bar */}
            {messages.some((m) => (m as any).is_pinned) && (
              <div className="px-4 py-2 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2 text-xs">
                  <Pin className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-primary font-medium">Épinglé :</span>
                  <span className="text-muted-foreground truncate">
                    {messages.find((m) => (m as any).is_pinned)?.content.slice(0, 80)}
                    {(messages.find((m) => (m as any).is_pinned)?.content.length || 0) > 80 ? "…" : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.filter((m) => !m.parent_id).map((msg) => {
                  const isOwn = msg.sender_id === user.id;
                  const isEditing = editingMessageId === msg.id;
                  const replies = messages.filter((m) => m.parent_id === msg.id);

                  return (
                    <div key={msg.id}>
                      <div className="group flex items-start gap-3">
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
                            {(msg as any).is_pinned && (
                              <Pin className="h-2.5 w-2.5 text-primary" />
                            )}
                            {msg.is_edited && (
                              <span className="text-[10px] text-muted-foreground italic">(modifié)</span>
                            )}
                            <button
                              onClick={() => {
                                setReplyTo(msg);
                                inputRef.current?.focus();
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              title="Répondre"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-2 max-w-[80%]">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditMessage(msg.id);
                                  if (e.key === "Escape") setEditingMessageId(null);
                                }}
                                className="text-sm bg-muted border-0 h-8"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleEditMessage(msg.id)}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setEditingMessageId(null)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <div
                                className={cn(
                                  "inline-block rounded-2xl text-sm max-w-[80%] overflow-hidden",
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted rounded-bl-sm",
                                  msg.media_url ? "p-1" : "px-3 py-2"
                                )}
                              >
                                {msg.media_url && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(msg.media_url) ? (
                                  <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={msg.media_url}
                                      alt=""
                                      className="max-w-[300px] max-h-[200px] rounded-xl object-cover cursor-pointer"
                                      onClick={() => window.open(msg.media_url!, "_blank")}
                                    />
                                    {msg.content && (
                                      <p className="px-2 py-1 text-xs">{msg.content}</p>
                                    )}
                                  </div>
                                ) : msg.media_url ? (
                                  <a
                                    href={msg.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-2 py-1 hover:underline"
                                  >
                                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                                    <span>{msg.content}</span>
                                  </a>
                                ) : (
                                  msg.content
                                )}
                              </div>

                              {/* Actions on hover */}
                              {!msg.id.startsWith("temp-") && (
                                <div className={cn(
                                  "hidden group-hover:flex items-center gap-0.5 absolute top-1/2 -translate-y-1/2",
                                  isOwn ? "-left-20" : "-right-20"
                                )}>
                                  <button
                                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Reagir"
                                  >
                                    <Smile className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleTogglePin(msg.id)}
                                    className={cn(
                                      "p-1 rounded transition-colors",
                                      (msg as any).is_pinned
                                        ? "text-primary hover:bg-primary/10"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                    title={(msg as any).is_pinned ? "Désépingler" : "Épingler"}
                                  >
                                    <Pin className="h-3 w-3" />
                                  </button>
                                  {isOwn && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(msg.id);
                                          setEditContent(msg.content);
                                        }}
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Modifier"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Emoji picker */}
                              {showEmojiPicker === msg.id && (
                                <div className={cn(
                                  "absolute z-20 mt-1 bg-card border border-border rounded-xl px-2 py-1.5 shadow-lg",
                                  isOwn ? "right-0" : "left-0"
                                )} style={{ top: "100%" }}>
                                  <div className="flex gap-1 mb-1">
                                    {QUICK_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className="text-base hover:scale-125 transition-transform p-0.5"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-8 gap-0.5 max-h-32 overflow-y-auto border-t border-border pt-1">
                                    {ALL_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className="text-sm hover:scale-125 transition-transform p-0.5 rounded hover:bg-muted"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Reactions display */}
                              {reactions[msg.id] && reactions[msg.id].length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(
                                    reactions[msg.id].reduce<Record<string, string[]>>(
                                      (acc, r) => {
                                        if (!acc[r.emoji]) acc[r.emoji] = [];
                                        acc[r.emoji].push(r.user_id);
                                        return acc;
                                      },
                                      {}
                                    )
                                  ).map(([emoji, userIds]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={cn(
                                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] border transition-colors",
                                        userIds.includes(user.id)
                                          ? "border-primary/40 bg-primary/10"
                                          : "border-border hover:border-primary/30"
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-muted-foreground">{userIds.length}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Thread replies */}
                      {replies.length > 0 && (
                        <div className="ml-11 mt-1 space-y-1 border-l-2 border-border/50 pl-3">
                          {replies.map((reply) => {
                            const isReplyOwn = reply.sender_id === user.id;
                            return (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Avatar className="h-5 w-5 flex-shrink-0">
                                  <AvatarImage src={reply.sender?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                    {getInitials(reply.sender?.full_name || "")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-[10px] font-medium mr-1.5">
                                    {isReplyOwn ? "Vous" : reply.sender?.full_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.content}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 text-xs text-muted-foreground italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} est en train d'écrire...`
                  : `${typingUsers.join(", ")} sont en train d'écrire...`}
              </div>
            )}

            {/* Input */}
            {activeChannel.type === "dm" && (() => {
              const otherUserId = getDmOtherUserId(activeChannel);
              return otherUserId && blockedUserIds.includes(otherUserId);
            })() ? (
              <div className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
                <Ban className="h-4 w-4 inline mr-1.5" />
                Vous avez bloqué cet utilisateur
              </div>
            ) : (
            <div className="border-t border-border">
              {replyTo && (
                <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  <span>
                    Réponse à <span className="font-medium text-foreground">{replyTo.sender_id === user.id ? "vous" : replyTo.sender?.full_name}</span>
                    {" : "}
                    <span className="truncate max-w-[200px] inline-block align-bottom">{replyTo.content.slice(0, 50)}{replyTo.content.length > 50 ? "…" : ""}</span>
                  </span>
                  <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="p-3 flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </Button>
                <Popover open={showInputEmoji} onOpenChange={setShowInputEmoji}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" side="top" align="start">
                    <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                      {ALL_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setNewMessage((prev) => prev + emoji);
                            setShowInputEmoji(false);
                            inputRef.current?.focus();
                          }}
                          className="text-xl p-1 rounded hover:bg-muted transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={replyTo ? "Écrire une réponse..." : "Écrire un message..."}
                  className="bg-[#141414] border-0"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || uploading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )}
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
