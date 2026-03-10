"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Loader2,
  Reply,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { timeAgo } from "@/lib/utils/dates";
import { getInitials } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Discussion {
  id: string;
  content: string;
  author_id: string;
  parent_id: string | null;
  is_resolved: boolean;
  created_at: string;
  author: { full_name: string; avatar_url: string | null; role: string } | null;
  replies?: Discussion[];
}

interface ModuleDiscussionsProps {
  moduleId: string;
  formationId: string;
  discussions: Discussion[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ModuleDiscussions({
  moduleId,
  formationId,
  discussions: initial,
  currentUserId,
  isAdmin,
}: ModuleDiscussionsProps) {
  const [discussions, setDiscussions] = useState(initial);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(discussions.length > 0);
  const router = useRouter();
  const supabase = createClient();

  const handlePost = async (parentId?: string) => {
    const content = parentId ? replyContent : newMessage;
    if (!content.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("module_discussions")
      .insert({
        module_id: moduleId,
        formation_id: formationId,
        author_id: currentUserId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select("*, author:profiles(full_name, avatar_url, role)")
      .single();

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else if (data) {
      if (parentId) {
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === parentId
              ? { ...d, replies: [...(d.replies || []), data] }
              : d
          )
        );
        setReplyContent("");
        setReplyTo(null);
      } else {
        setDiscussions((prev) => [{ ...data, replies: [] }, ...prev]);
        setNewMessage("");
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, parentId?: string | null) => {
    await supabase.from("module_discussions").delete().eq("id", id);
    if (parentId) {
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === parentId
            ? { ...d, replies: d.replies?.filter((r) => r.id !== id) }
            : d
        )
      );
    } else {
      setDiscussions((prev) => prev.filter((d) => d.id !== id));
    }
    toast.success("Message supprimé");
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from("module_discussions")
      .update({ is_resolved: true })
      .eq("id", id);

    if (!error) {
      setDiscussions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_resolved: true } : d))
      );
      toast.success("Question marquée comme résolue");
    }
  };

  const topLevel = discussions.filter((d) => !d.parent_id);

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Discussion ({topLevel.length})
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Discussion ({topLevel.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New message */}
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Posez une question ou partagez une remarque..."
            className="min-h-[60px] resize-none text-sm bg-muted/30 border-0"
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={() => handlePost()}
            disabled={!newMessage.trim() || loading}
          >
            {loading && !replyTo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Messages */}
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune discussion pour ce module. Soyez le premier !
          </p>
        ) : (
          <div className="space-y-4">
            {topLevel.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {/* Main message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(msg.author?.full_name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {msg.author?.full_name}
                        </span>
                        {(msg.author?.role === "admin" || msg.author?.role === "moderator") && (
                          <Badge variant="outline" className="text-[9px] h-4 text-primary border-primary/30">
                            {msg.author.role === "admin" ? "Admin" : "Mod"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(msg.created_at)}
                        </span>
                        {msg.is_resolved && (
                          <Badge className="bg-neon/20 text-neon border-neon/30 text-[9px] h-4">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                            Résolu
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-1">
                      <button
                        onClick={() => setReplyTo(replyTo === msg.id ? null : msg.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Reply className="h-3 w-3" />
                        Répondre
                      </button>
                      {isAdmin && !msg.is_resolved && (
                        <button
                          onClick={() => handleResolve(msg.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-neon transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Résolu
                        </button>
                      )}
                      {(msg.author_id === currentUserId || isAdmin) && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Reply input */}
                    {replyTo === msg.id && (
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Votre réponse..."
                          className="min-h-[50px] resize-none text-sm bg-muted/30 border-0"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          className="shrink-0"
                          onClick={() => handlePost(msg.id)}
                          disabled={!replyContent.trim() || loading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {msg.replies?.map((reply) => (
                  <div key={reply.id} className="flex gap-3 ml-11">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={reply.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                        {getInitials(reply.author?.full_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/20 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">
                            {reply.author?.full_name}
                          </span>
                          {(reply.author?.role === "admin" || reply.author?.role === "moderator") && (
                            <Badge variant="outline" className="text-[8px] h-3.5 text-primary border-primary/30">
                              {reply.author.role === "admin" ? "Admin" : "Mod"}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                      </div>
                      {(reply.author_id === currentUserId || isAdmin) && (
                        <button
                          onClick={() => handleDelete(reply.id, msg.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors mt-0.5 ml-1"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
