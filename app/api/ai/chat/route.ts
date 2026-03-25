import { streamText, UIMessage, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrieveContext } from "@/lib/ai/rag";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { checkRateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rl = checkRateLimit(`ai-chat:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check role (not prospect)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "prospect") {
    return new Response("Forbidden", { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Chat IA non configuré (ANTHROPIC_API_KEY manquante)", { status: 503 });
  }

  const { messages, conversationId } = await request.json();

  // Extract text from the last user message (UIMessage format with parts)
  const lastUserMessage = [...(messages as UIMessage[])].reverse().find(
    (m) => m.role === "user"
  );

  if (!lastUserMessage) {
    return new Response("No user message", { status: 400 });
  }

  const lastUserText = lastUserMessage.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") || "";

  if (!lastUserText) {
    return new Response("No user message text", { status: 400 });
  }

  // RAG: retrieve relevant context from knowledge base
  let context = "";
  let sources: { document_id: string; title: string; chunk_preview: string }[] = [];
  try {
    const rag = await retrieveContext(lastUserText);
    context = rag.context;
    sources = rag.sources;
  } catch (e) {
    console.error("[AI Chat] RAG retrieval failed:", e);
    // Continue without context — RAG is not critical
  }

  // Build system prompt with retrieved context
  const systemPrompt = buildSystemPrompt(context);

  // Create or get conversation
  let activeConversationId = conversationId;
  if (!activeConversationId) {
    const title = lastUserText.slice(0, 50) + (lastUserText.length > 50 ? "..." : "");
    const { data: conv } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    activeConversationId = conv?.id;
  }

  // Persist the user message
  if (activeConversationId) {
    await supabase.from("ai_messages").insert({
      conversation_id: activeConversationId,
      role: "user",
      content: lastUserText,
    });
  }

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  // Stream response from Claude
  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: systemPrompt,
    messages: modelMessages,
    async onFinish({ text }) {
      // Persist the assistant message with sources
      if (activeConversationId) {
        await supabase.from("ai_messages").insert({
          conversation_id: activeConversationId,
          role: "assistant",
          content: text,
          sources: sources.length > 0 ? sources : null,
        });

        // Update conversation updated_at
        await supabase
          .from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", activeConversationId);
      }
    },
  });

  // Return streaming response with conversation metadata
  return result.toUIMessageStreamResponse({
    headers: activeConversationId
      ? { "X-Conversation-Id": activeConversationId }
      : undefined,
  });
}
