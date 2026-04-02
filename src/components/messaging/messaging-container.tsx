"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useChannels } from "@/hooks/use-channels";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useTyping } from "@/hooks/use-typing";
import { useMessagingStore } from "@/stores/messaging-store";
import { useMarkChannelRead } from "@/hooks/useMessageReads";
import { ChannelSidebar } from "./channel-sidebar";
import { ChatPanel } from "./chat-panel";
import { ChannelSettingsModal } from "./channel-settings-modal";
import { UnifiedInbox } from "./unified-inbox";
import { Hash, MessageSquare, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type InboxMode = "internal" | "external";

export default function MessagingContainer() {
  const [inboxMode, setInboxMode] = useState<InboxMode>("internal");
  const searchParams = useSearchParams();
  const dmTargetHandled = useRef(false);
  const { user, isStaff } = useAuth();
  const queryClient = useQueryClient();
  const {
    channels,
    publicChannels,
    archivedChannels,
    dmChannels,
    isLoading: channelsLoading,
    createChannel,
    createDMChannel,
    muteChannel,
    unmuteChannel,
    archiveChannel,
    unarchiveChannel,
    pinChannel,
    deleteChannel,
    showArchived,
    setShowArchived,
  } = useChannels();

  const {
    activeChannelId,
    setActiveChannelId,
    showMembersPanel,
    setShowMembersPanel,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useMessagingStore();

  const selectedChannel =
    channels.find((c) => c.id === activeChannelId) ?? null;

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
    addAttachment,
    markAsRead,
  } = useMessages(activeChannelId);

  const { isOnline } = useOnlineStatus();
  const { typingUsers, broadcastTyping, stopTyping } =
    useTyping(activeChannelId);
  const markChannelRead = useMarkChannelRead();

  // If user loses staff access, reset to internal inbox
  useEffect(() => {
    if (!isStaff && inboxMode === "external") {
      setInboxMode("internal");
    }
  }, [isStaff, inboxMode]);

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId, setActiveChannelId]);

  // Mark as read when channel changes or markAsRead updates (new channel's closure)
  useEffect(() => {
    if (activeChannelId) {
      markAsRead();
      markChannelRead.mutate(activeChannelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  // Open DM from ?dm=userId query param (e.g. from contact detail page)
  useEffect(() => {
    const dmUserId = searchParams.get("dm");
    if (!dmUserId || !user || channelsLoading || dmTargetHandled.current)
      return;
    dmTargetHandled.current = true;

    // Check if there's already a DM channel with this user
    const existingDm = dmChannels.find(
      (ch) => (ch as { dmPartner?: { id: string } }).dmPartner?.id === dmUserId,
    );

    if (existingDm) {
      setActiveChannelId(existingDm.id);
    } else {
      // Create a new DM channel
      createDMChannel
        .mutateAsync(dmUserId)
        .then((ch) => {
          if (ch) setActiveChannelId(ch.id);
        })
        .catch(() => {});
    }
  }, [
    searchParams,
    user,
    channelsLoading,
    dmChannels,
    setActiveChannelId,
    createDMChannel,
  ]);

  const handleSelectChannel = useCallback(
    (id: string) => {
      setActiveChannelId(id);
      setMobileSidebarOpen(false);
    },
    [setActiveChannelId, setMobileSidebarOpen],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Content ── */}
      <div className="flex flex-1 min-h-0 bg-surface overflow-hidden border-t border-border/50">
        {inboxMode === "external" ? (
          <>
            {/* Sidebar with toggle for external mode */}
            <div className="w-[272px] border-r border-border/30 flex flex-col shrink-0 bg-surface">
              {isStaff && (
                <div className="px-3 pt-2 pb-0">
                  <div className="flex items-center gap-0 border-b border-border">
                    <button
                      onClick={() => setInboxMode("internal")}
                      className="flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold transition-all relative text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="w-3 h-3" />
                      UPSCALE
                    </button>
                    <button
                      onClick={() => setInboxMode("external")}
                      className="flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold transition-all relative text-foreground"
                    >
                      <Globe className="w-3 h-3" />
                      Boite unifiee
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <UnifiedInbox />
            </div>
          </>
        ) : (
          <>
            {/* Sidebar */}
            <div
              className={`
              w-[272px] border-r border-border/30 flex flex-col shrink-0 bg-surface
              max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-30 max-sm:w-[272px] max-sm:bg-surface max-sm:shadow-xl max-sm:shadow-black/10
              ${mobileSidebarOpen ? "max-sm:translate-x-0" : "max-sm:-translate-x-full"}
              sm:relative sm:translate-x-0 transition-transform duration-300 ease-out
            `}
            >
              {/* Inbox mode toggle */}
              {isStaff && (
                <div className="px-3 pt-2 pb-0">
                  <div className="flex items-center gap-0 border-b border-border">
                    <button
                      onClick={() => setInboxMode("internal")}
                      className="flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold transition-all relative text-foreground"
                    >
                      <MessageSquare className="w-3 h-3" />
                      UPSCALE
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
                    </button>
                    <button
                      onClick={() => setInboxMode("external")}
                      className="flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold transition-all relative text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="w-3 h-3" />
                      Boite unifiee
                    </button>
                  </div>
                </div>
              )}
              <ChannelSidebar
                publicChannels={publicChannels}
                archivedChannels={archivedChannels}
                dmChannels={dmChannels}
                activeChannelId={activeChannelId}
                onSelectChannel={handleSelectChannel}
                onCreateChannel={({ name, description, type, memberIds }) =>
                  createChannel.mutateAsync({
                    name,
                    description,
                    type,
                    memberIds: user
                      ? [...new Set([user.id, ...memberIds])]
                      : memberIds,
                  })
                }
                onCreateDM={(userId) =>
                  createDMChannel
                    .mutateAsync(userId)
                    .then((ch) => {
                      setActiveChannelId(ch.id);
                    })
                    .catch(() => {})
                }
                isLoading={channelsLoading}
                isOnline={isOnline}
                showArchived={showArchived}
                onToggleShowArchived={() => setShowArchived(!showArchived)}
              />
            </div>

            {/* Backdrop for mobile sidebar */}
            {mobileSidebarOpen && (
              <div
                className="sm:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}

            {/* Chat area */}
            <div
              className="flex-1 flex flex-col min-w-0"
              key={activeChannelId ?? "empty"}
            >
              {selectedChannel ? (
                <ChatPanel
                  channel={selectedChannel}
                  messages={messages}
                  isLoading={messagesLoading}
                  user={user}
                  sendMessage={sendMessage}
                  editMessage={editMessage}
                  deleteMessage={deleteMessage}
                  togglePin={togglePin}
                  toggleReaction={toggleReaction}
                  addAttachment={addAttachment}
                  onOpenMembers={() => setShowMembersPanel(true)}
                  onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
                  isOnline={isOnline}
                  onPin={() =>
                    selectedChannel &&
                    pinChannel.mutate({
                      channelId: selectedChannel.id,
                      pinned: !selectedChannel.isPinned,
                    })
                  }
                  onMute={() =>
                    selectedChannel &&
                    (selectedChannel.isMuted
                      ? unmuteChannel.mutate(selectedChannel.id)
                      : muteChannel.mutate(selectedChannel.id))
                  }
                  onArchive={() =>
                    selectedChannel &&
                    (selectedChannel.is_archived
                      ? unarchiveChannel.mutate(selectedChannel.id)
                      : archiveChannel.mutate(selectedChannel.id))
                  }
                  typingUsers={typingUsers}
                  broadcastTyping={broadcastTyping}
                  stopTyping={stopTyping}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-surface via-surface to-[#c6ff00]/[0.02]">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c6ff00]/10 to-[#c6ff00]/10 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-[#c6ff00]/5">
                      <Hash className="w-6 h-6 text-[#c6ff00]/60" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Selectionne un canal pour commencer
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Tes conversations apparaitront ici
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Channel settings modal */}
            {selectedChannel && (
              <ChannelSettingsModal
                channel={selectedChannel}
                open={showMembersPanel}
                onClose={() => setShowMembersPanel(false)}
                isOnline={isOnline}
                onMute={() => muteChannel.mutate(selectedChannel.id)}
                onUnmute={() => unmuteChannel.mutate(selectedChannel.id)}
                onArchive={() => archiveChannel.mutate(selectedChannel.id)}
                onUnarchive={() => unarchiveChannel.mutate(selectedChannel.id)}
                onPin={(channelId, pinned) =>
                  pinChannel.mutate({ channelId, pinned })
                }
                onDelete={() => {
                  if (selectedChannel) {
                    deleteChannel.mutate(selectedChannel.id);
                    setActiveChannelId(null);
                  }
                }}
                userRole={user?.user_metadata?.role}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
