import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embeddings";
import type { AIMessageSource } from "@/lib/types/database";

interface RetrievedContext {
  context: string;
  sources: AIMessageSource[];
}

/**
 * RAG pipeline: embed the query, search for similar chunks, return formatted context.
 */
export async function retrieveContext(
  query: string,
  options?: { matchThreshold?: number; matchCount?: number }
): Promise<RetrievedContext> {
  const matchThreshold = options?.matchThreshold ?? 0.7;
  const matchCount = options?.matchCount ?? 5;

  // 1. Generate embedding for the user query
  const queryEmbedding = await generateEmbedding(query);

  // 2. Search for similar chunks via RPC
  const supabase = await createClient();

  const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error || !chunks || chunks.length === 0) {
    return { context: "", sources: [] };
  }

  // 3. Fetch document titles for source attribution
  const documentIds = [...new Set(chunks.map((c: { document_id: string }) => c.document_id))];
  const { data: documents } = await supabase
    .from("ai_documents")
    .select("id, title")
    .in("id", documentIds);

  const docTitleMap = new Map(
    (documents || []).map((d: { id: string; title: string }) => [d.id, d.title])
  );

  // 4. Build formatted context with source attribution
  const contextParts: string[] = [];
  const sourcesMap = new Map<string, AIMessageSource>();

  for (const chunk of chunks) {
    const docTitle = docTitleMap.get(chunk.document_id) || "Document";
    const metadata = chunk.metadata as Record<string, string> | null;
    const sourceLabel = metadata?.module_title
      ? `${docTitle} > ${metadata.module_title}`
      : docTitle;

    contextParts.push(`[Source: ${sourceLabel}]\n${chunk.content}`);

    if (!sourcesMap.has(chunk.document_id)) {
      sourcesMap.set(chunk.document_id, {
        document_id: chunk.document_id,
        title: docTitle,
        chunk_preview: chunk.content.slice(0, 100),
      });
    }
  }

  return {
    context: contextParts.join("\n\n---\n\n"),
    sources: Array.from(sourcesMap.values()),
  };
}
