"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Hash,
  Lock,
  MessageCircle,
  Send,
  Plus,
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
import type { Channel, Profile, Message } from "@/lib/types/database";
import { getInitials } from "@/lib/utils/formatters";
import { formatMessageDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useMessages,
  useChannels,
  useTypingIndicator,
  useBlockedUsers,
  type EnrichedMessage,
  type ChannelWithMeta,
} from "@/lib/hooks/use-chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👀"];
const ALL_EMOJIS = [
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
  "😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
  "😐","😑","😶","😏","😒","🙄","😬","😌","😔","😪","😴","🤯","🤠","🥳","😎","🤓",
  "👋","🤚","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇",
  "👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤝","🙏",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💕","💗","💖","💝",
  "🔥","💫","⭐","🌟","✨","🎉","🎊","🎈","🎁","🏆","🥇","🎯",
  "🚀","🌈","☀️","🌙","🌊","🍕","🍔","☕","🥂","🍾",
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatLayoutProps {
  user: Profile;
  allUsers: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_online">[];
  initialDmUserId?: string | null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatLayout({ user, allUsers, initialDmUserId }: ChatLayoutProps) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showChannelList, setShowChannelList] = useState(true);
  const [dmSearchOpen, setDmSearchOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [dmAutoOpened, setDmAutoOpened] = useState(false);

  // Hooks
  const {
    publicChannels,
    privateChannels,
    dmChannels,
    memberChannelIds,
    loading: channelsLoading,
    markAsRead,
    openOrCreateDM,
    joinChannel,
  } = useChannels(user.id);

  const {
    messages,
    reactions,
    loading: messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
  } = useMessages(activeChannel?.id || null, user.id);

  const { typingUsers, broadcastTyping } = useTypingIndicator(
    activeChannel?.id || null,
    user.id,
    user.full_name
  );

  const { blockedIds, toggleBlock } = useBlockedUsers(user.id);

  // Select channel
  const selectChannel = useCallback(
    async (channel: Channel) => {
      // Auto-join public channels
      if (channel.type === "public" && !memberChannelIds.includes(channel.id)) {
        await joinChannel(channel.id);
      }
      setActiveChannel(channel);
      setShowChannelList(false);
      // Mark as read
      markAsRead(channel.id);
    },
    [memberChannelIds, joinChannel, markAsRead]
  );

  // Auto-open DM from URL param
  useEffect(() => {
    if (initialDmUserId && !dmAutoOpened && allUsers.length > 0) {
      setDmAutoOpened(true);
      openOrCreateDM(initialDmUserId).then((ch) => {
        if (ch) selectChannel(ch);
      });
    }
  }, [initialDmUserId, dmAutoOpened, allUsers]);

  // Create DM
  const handleCreateDM = async (otherUserId: string) => {
    const ch = await openOrCreateDM(otherUserId);
    if (ch) {
      selectChannel(ch);
    }
    setDmSearchOpen(false);
    setDmSearch("");
  };

  // DM partner helper
  const getDmPartner = (channel: ChannelWithMeta) => {
    if (channel.dmPartner) return channel.dmPartner;
    // Fallback: parse name
    const parts = channel.name.split(" & ");
    const otherName = parts.find((p) => p !== user.full_name) || parts[1];
    return allUsers.find((u) => u.full_name === otherName) || null;
  };

  // Is the other user in a DM blocked?
  const isDmBlocked = (channel: Channel) => {
    const partner = getDmPartner(channel as ChannelWithMeta);
    return partner ? blockedIds.includes(partner.id) : false;
  };

  const filteredUsers = allUsers.filter((u) =>
    u.full_name?.toLowerCase().includes(dmSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] -m-4 md:-m-6 rounded-xl overflow-hidden border border-border">
      {/* ── Channel sidebar ── */}
      <div
        className={cn(
          "w-full md:w-[280px] bg-card border-r border-border flex flex-col flex-shrink-0",
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
                    onClick={() => handleCreateDM(u.id)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(u.full_name || "")}</AvatarFallback>
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
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Channels</p>
            {publicChannels.map((ch) => (
              <ChannelListItem
                key={ch.id}
                channel={ch}
                isActive={activeChannel?.id === ch.id}
                onClick={() => selectChannel(ch)}
              />
            ))}
            {privateChannels.map((ch) => (
              <ChannelListItem
                key={ch.id}
                channel={ch}
                isActive={activeChannel?.id === ch.id}
                onClick={() => selectChannel(ch)}
                isPrivate
              />
            ))}
          </div>

          {/* DMs */}
          {dmChannels.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Messages privés</p>
              {dmChannels.map((ch) => {
                const partner = getDmPartner(ch);
                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChannel(ch)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors",
                      activeChannel?.id === ch.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={partner?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(partner?.full_name || ch.name)}
                        </AvatarFallback>
                      </Avatar>
                      {partner?.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon border border-card" />
                      )}
                    </div>
                    <span className="truncate">{partner?.full_name || ch.name}</span>
                    {ch.unreadCount > 0 && (
                      <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {ch.unreadCount > 99 ? "99+" : ch.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Chat area ── */}
      <div className={cn("flex-1 flex flex-col", showChannelList && !activeChannel && "hidden md:flex")}>
        {activeChannel ? (
          <ChatArea
            channel={activeChannel}
            user={user}
            messages={messages}
            reactions={reactions}
            loading={messagesLoading}
            typingUsers={typingUsers}
            blockedIds={blockedIds}
            isDmBlocked={isDmBlocked(activeChannel)}
            dmPartner={activeChannel.type === "dm" ? getDmPartner(activeChannel as ChannelWithMeta) : null}
            onBack={() => setShowChannelList(true)}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onTogglePin={togglePin}
            onToggleReaction={toggleReaction}
            onToggleBlock={toggleBlock}
            onBroadcastTyping={broadcastTyping}
          />
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

// ---------------------------------------------------------------------------
// ChannelListItem
// ---------------------------------------------------------------------------

function ChannelListItem({
  channel,
  isActive,
  onClick,
  isPrivate,
}: {
  channel: ChannelWithMeta;
  isActive: boolean;
  onClick: () => void;
  isPrivate?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {isPrivate ? (
        <Lock className="h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <span className="text-base flex-shrink-0">{channel.icon || "#"}</span>
      )}
      <span className="truncate">{channel.name}</span>
      {channel.unreadCount > 0 && (
        <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChatArea — messages, input, typing indicator
// ---------------------------------------------------------------------------

function ChatArea({
  channel,
  user,
  messages,
  reactions,
  loading,
  typingUsers,
  blockedIds,
  isDmBlocked,
  dmPartner,
  onBack,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTogglePin,
  onToggleReaction,
  onToggleBlock,
  onBroadcastTyping,
}: {
  channel: Channel;
  user: Profile;
  messages: EnrichedMessage[];
  reactions: Record<string, { emoji: string; user_id: string }[]>;
  loading: boolean;
  typingUsers: string[];
  blockedIds: string[];
  isDmBlocked: boolean;
  dmPartner: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_online"> | null;
  onBack: () => void;
  onSendMessage: (content: string, parentId?: string | null, mediaUrl?: string | null) => Promise<void>;
  onEditMessage: (id: string, content: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  onToggleBlock: (targetId: string) => Promise<boolean>;
  onBroadcastTyping: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState<EnrichedMessage | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Reset state when channel changes
  useEffect(() => {
    setNewMessage("");
    setEditingId(null);
    setReplyTo(null);
    setEmojiPickerFor(null);
  }, [channel.id]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    setNewMessage("");
    const parentId = replyTo?.id?.startsWith("optimistic-") ? null : replyTo?.id || null;
    setReplyTo(null);
    await onSendMessage(content, parentId);

    // Push notification (fire-and-forget)
    fetch("/api/notifications/push-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_id: channel.id,
        channel_name: channel.name,
        sender_name: user.full_name,
        preview: content.slice(0, 100),
      }),
    }).catch(() => {});
  };

  const handleFileUpload = async (file: File) => {
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
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      const isImage = file.type.startsWith("image/");
      const content = isImage ? "" : `📎 ${file.name}`;
      const parentId = replyTo?.id?.startsWith("optimistic-") ? null : replyTo?.id || null;
      setReplyTo(null);
      await onSendMessage(content, parentId, url);
    } catch {
      toast.error("Erreur lors de l'envoi du fichier");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBlockToggle = async () => {
    if (!dmPartner) return;
    const isNowBlocked = await onToggleBlock(dmPartner.id);
    toast.success(isNowBlocked ? "Utilisateur bloqué" : "Utilisateur débloqué");
  };

  const pinnedMessage = messages.find((m) => m.is_pinned);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-border flex items-center gap-3 px-4">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {channel.type === "dm" && dmPartner ? (
          <>
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={dmPartner.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getInitials(dmPartner.full_name || "")}</AvatarFallback>
              </Avatar>
              {dmPartner.is_online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{dmPartner.full_name}</p>
              <p className="text-xs text-muted-foreground">{dmPartner.is_online ? "En ligne" : "Hors ligne"}</p>
            </div>
          </>
        ) : (
          <>
            <span className="text-lg">{channel.icon || "#"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{channel.name}</p>
              {channel.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[300px]">{channel.description}</p>
              )}
            </div>
          </>
        )}
        {channel.type === "dm" && dmPartner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBlockToggle}
            className={cn(
              "text-xs gap-1.5",
              blockedIds.includes(dmPartner.id) ? "text-destructive hover:text-destructive" : "text-muted-foreground"
            )}
          >
            <Ban className="h-3.5 w-3.5" />
            {blockedIds.includes(dmPartner.id) ? "Débloquer" : "Bloquer"}
          </Button>
        )}
      </div>

      {/* Pinned message */}
      {pinnedMessage && (
        <div className="px-4 py-2 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2 text-xs">
            <Pin className="h-3 w-3 text-primary shrink-0" />
            <span className="text-primary font-medium">Épinglé :</span>
            <span className="text-muted-foreground truncate">
              {pinnedMessage.content.slice(0, 80)}
              {pinnedMessage.content.length > 80 ? "…" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.sender_id === user.id}
                userId={user.id}
                reactions={reactions[msg.id] || []}
                parentMsg={msg.parent_id ? messages.find((m) => m.id === msg.parent_id) : undefined}
                isEditing={editingId === msg.id}
                editContent={editContent}
                emojiPickerOpen={emojiPickerFor === msg.id}
                onStartEdit={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                onCancelEdit={() => setEditingId(null)}
                onConfirmEdit={() => { onEditMessage(msg.id, editContent); setEditingId(null); }}
                onEditContentChange={setEditContent}
                onDelete={() => onDeleteMessage(msg.id)}
                onTogglePin={() => { onTogglePin(msg.id); toast.success(msg.is_pinned ? "Message désépinglé" : "Message épinglé"); }}
                onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                onToggleReaction={(emoji) => onToggleReaction(msg.id, emoji)}
                onToggleEmojiPicker={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)}
                onCloseEmojiPicker={() => setEmojiPickerFor(null)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} est en train d'écrire...`
            : `${typingUsers.join(", ")} sont en train d'écrire...`}
        </div>
      )}

      {/* Input area */}
      {isDmBlocked ? (
        <div className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
          <Ban className="h-4 w-4 inline mr-1.5" />
          Vous avez bloqué cet utilisateur
        </div>
      ) : (
        <div className="border-t border-border pb-2">
          {replyTo && (
            <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Reply className="h-3 w-3" />
              <span>
                Réponse à{" "}
                <span className="font-medium text-foreground">
                  {replyTo.sender_id === user.id ? "vous" : replyTo.sender?.full_name}
                </span>
                {" : "}
                <span className="truncate max-w-[200px] inline-block align-bottom">
                  {replyTo.content.slice(0, 50)}{replyTo.content.length > 50 ? "…" : ""}
                </span>
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
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
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
              onChange={(e) => { setNewMessage(e.target.value); onBroadcastTyping(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={replyTo ? "Écrire une réponse..." : "Écrire un message..."}
              className="bg-[#141414] border-0"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || uploading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  isOwn,
  userId,
  reactions,
  parentMsg,
  isEditing,
  editContent,
  emojiPickerOpen,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onEditContentChange,
  onDelete,
  onTogglePin,
  onReply,
  onToggleReaction,
  onToggleEmojiPicker,
  onCloseEmojiPicker,
}: {
  msg: EnrichedMessage;
  isOwn: boolean;
  userId: string;
  reactions: { emoji: string; user_id: string }[];
  parentMsg?: EnrichedMessage;
  isEditing: boolean;
  editContent: string;
  emojiPickerOpen: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  onEditContentChange: (content: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onReply: () => void;
  onToggleReaction: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  onCloseEmojiPicker: () => void;
}) {
  return (
    <div>
      <div className="group flex items-start gap-3">
        {!isOwn && (
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={msg.sender?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {getInitials(msg.sender?.full_name || "")}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={cn("min-w-0", isOwn ? "flex-1 flex flex-col items-end" : "max-w-[80%]")}>
          {/* Reply reference */}
          {parentMsg && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 opacity-70">
              <Reply className="h-3 w-3" />
              <span>
                En réponse à{" "}
                <span className="font-medium">
                  {parentMsg.sender_id === userId ? "vous" : parentMsg.sender?.full_name}
                </span>
              </span>
              <span className="truncate max-w-[200px]">— {parentMsg.content}</span>
            </div>
          )}

          {/* Sender + timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{isOwn ? "Vous" : msg.sender?.full_name}</span>
            <span className="text-xs text-muted-foreground">{formatMessageDate(msg.created_at)}</span>
            {msg.is_pinned && <Pin className="h-2.5 w-2.5 text-primary" />}
            {msg.is_edited && <span className="text-[10px] text-muted-foreground italic">(modifié)</span>}
            {/* Reply button */}
            <button
              onClick={onReply}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/10"
              title="Répondre"
            >
              <Reply className="h-4 w-4" />
            </button>
          </div>

          {/* Message content or edit form */}
          {isEditing ? (
            <div className="flex items-center gap-2 max-w-[80%]">
              <Input
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onConfirmEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                className="text-sm bg-muted border-0 h-8"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onConfirmEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className={cn("relative", isOwn && "max-w-[80%]")}>
              <div
                className={cn(
                  "rounded-2xl text-[15px] break-words whitespace-pre-wrap w-fit",
                  isOwn ? "bg-[#1A3A2A] text-white rounded-br-sm ml-auto" : "bg-muted rounded-bl-sm",
                  msg.media_url ? "p-1" : "px-3 py-1.5"
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
                    {msg.content && <p className="px-2 py-1 text-xs">{msg.content}</p>}
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

              {/* Hover actions */}
              {!msg.id.startsWith("optimistic-") && (
                <div
                  className={cn(
                    "hidden group-hover:flex items-center gap-1 absolute top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-1 py-0.5 shadow-md z-10",
                    isOwn ? "-left-28" : "-right-28"
                  )}
                >
                  <button onClick={onToggleEmojiPicker} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground" title="Réagir">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onTogglePin}
                    className={cn("p-1.5 rounded-md", msg.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/10")}
                    title={msg.is_pinned ? "Désépingler" : "Épingler"}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  {isOwn && (
                    <>
                      <button onClick={onStartEdit} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground" title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Emoji picker */}
              {emojiPickerOpen && (
                <div
                  className={cn(
                    "absolute z-20 mt-1 bg-card border border-border rounded-xl px-2 py-1.5 shadow-lg",
                    isOwn ? "right-0" : "left-0"
                  )}
                  style={{ top: "100%" }}
                >
                  <div className="flex gap-1 mb-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { onToggleReaction(emoji); onCloseEmojiPicker(); }}
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
                        onClick={() => { onToggleReaction(emoji); onCloseEmojiPicker(); }}
                        className="text-lg hover:scale-125 transition-transform p-0.5 rounded hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions display */}
              {reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(
                    reactions.reduce<Record<string, string[]>>((acc, r) => {
                      if (!acc[r.emoji]) acc[r.emoji] = [];
                      acc[r.emoji].push(r.user_id);
                      return acc;
                    }, {})
                  ).map(([emoji, userIds]) => (
                    <button
                      key={emoji}
                      onClick={() => onToggleReaction(emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors",
                        userIds.includes(userId)
                          ? "border-white/20 bg-white/10"
                          : "border-border hover:border-white/20 hover:bg-white/5"
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
    </div>
  );
}
