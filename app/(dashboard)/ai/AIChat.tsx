"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { AIConversation, AIMessage } from "@/lib/types/database";
import { formatMessageDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIChatProps {
  userId: string;
  conversations: AIConversation[];
}

export function AIChat({ userId, conversations: initialConversations }: AIChatProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [historyMessages, setHistoryMessages] = useState<AIMessage[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: () => ({ conversationId: activeConvIdRef.current }),
      }),
    []
  );

  const {
    messages,
    status,
    setMessages,
    sendMessage,
  } = useChat({
    transport,
    onFinish() {
      // Reload conversations to pick up new/updated ones
      loadConversations();
    },
    onError() {
      toast.error("Erreur de communication avec l'IA");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const supabase = createClient();

  async function loadConversations() {
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (data) {
      setConversations(data);
      // If we didn't have a conversation ID before, pick the latest one
      if (!activeConvIdRef.current && data.length > 0) {
        setActiveConvId(data[0].id);
      }
    }
  }

  async function loadConversationMessages(convId: string) {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      setHistoryMessages(data);
      // Convert to useChat UIMessage format
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }))
      );
    }
  }

  function handleSelectConversation(convId: string) {
    setActiveConvId(convId);
    loadConversationMessages(convId);
    setShowSidebar(false);
  }

  function handleNewConversation() {
    setActiveConvId(null);
    setMessages([]);
    setHistoryMessages([]);
    setShowSidebar(false);
    textareaRef.current?.focus();
  }

  async function handleDeleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", convId);

    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewConversation();
      }
      toast.success("Conversation supprimée");
    }
  }

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter to send
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSend();
      }
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage({ text });
  }

  // Get text content from message parts
  function getMessageText(message: (typeof messages)[number]) {
    return message.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") || "";
  }

  // Get sources for a message from history
  function getSourcesForMessage(messageId: string) {
    const histMsg = historyMessages.find((m) => m.id === messageId);
    return histMsg?.sources || null;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* Sidebar - Conversations */}
      <div
        className={cn(
          "w-full md:w-72 flex-shrink-0 border-r border-border bg-card/50 flex flex-col",
          showSidebar ? "flex" : "hidden md:flex"
        )}
      >
        <div className="p-4 border-b border-border">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-neon text-background hover:bg-neon/90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors group",
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{conv.title || "Conversation"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatMessageDate(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showSidebar ? "flex" : "hidden md:flex"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/30">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-1 hover:bg-muted rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-neon/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-neon" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">MateuzsIA</h2>
              <p className="text-[10px] text-muted-foreground">Assistant IA basé sur vos formations</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="size-16 rounded-2xl bg-neon/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-neon" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">MateuzsIA</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Posez-moi une question sur vos formations, modules ou documents. Je répondrai en me basant sur la base de connaissances.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 max-w-md justify-center">
                {["Que contient la formation ?", "Explique-moi le dernier module", "Résume les points clés"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-neon/50 hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="size-7 rounded-lg bg-neon/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-3.5 w-3.5 text-neon" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-neon/20 text-foreground"
                        : "bg-muted/50 text-foreground"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{getMessageText(message)}</div>
                    {/* Sources */}
                    {message.role === "assistant" && (() => {
                      const sources = getSourcesForMessage(message.id);
                      if (!sources || sources.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                          {sources.map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-turquoise/10 text-turquoise border border-turquoise/20"
                            >
                              {s.title}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="size-7 rounded-lg bg-neon/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-neon animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 max-w-3xl mx-auto"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              className="flex-1 resize-none rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon/50 placeholder:text-muted-foreground"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-neon text-background hover:bg-neon/90 h-11 w-11 rounded-xl flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
