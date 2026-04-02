"use client";

import { cn } from "@/lib/utils";
import { Bot, Sparkles } from "lucide-react";

interface AdminMentionProps {
  className?: string;
}

/**
 * Badge visuel affiche quand un message contient @MatIA.
 * Pour l'instant, c'est uniquement du UI, pas de backend RAG.
 */
export function AdminMentionBadge({ className }: AdminMentionProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
        "bg-gradient-to-r from-violet-500/10 to-purple-500/10",
        "border border-violet-500/20",
        "text-[11px] font-semibold text-violet-600",
        className,
      )}
    >
      <Bot className="w-3 h-3" />
      MatIA
      <Sparkles className="w-2.5 h-2.5 text-violet-400" />
    </span>
  );
}

/**
 * Detecte si un texte contient une mention @MatIA.
 */
export function containsAdminMention(text: string): boolean {
  return /@matia\b/i.test(text);
}

/**
 * Remplace @MatIA dans le texte par un placeholder pour le rendu.
 * Retourne les segments avec les mentions marquees.
 */
export function parseAdminMentions(
  text: string,
): Array<{ type: "text" | "matia"; content: string }> {
  const parts: Array<{ type: "text" | "matia"; content: string }> = [];
  const regex = /@matia\b/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "matia", content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

/** UUID deterministe du profil bot MatIA en base de donnees */
export const MATIA_BOT_ID = "00000000-0000-0000-0000-a1e01a000001";

/** Verifie si un ID correspond au bot MatIA */
export function isAdminBotId(id: string): boolean {
  return id === MATIA_BOT_ID;
}

/**
 * Suggestion d'autocompletion dans le champ mention.
 */
export const MATIA_MEMBER_OPTION = {
  id: MATIA_BOT_ID,
  full_name: "MatIA",
  avatar_url: null,
  role: "bot" as const,
};
