/**
 * Recursive text splitter for RAG — no LangChain dependency.
 * Splits text into chunks of ~500 characters with 50 char overlap.
 */

interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", ", ", " ", ""];

export function splitTextIntoChunks(
  text: string,
  options?: ChunkOptions
): string[] {
  const chunkSize = options?.chunkSize ?? 500;
  const chunkOverlap = options?.chunkOverlap ?? 50;
  const separators = options?.separators ?? DEFAULT_SEPARATORS;

  if (!text || text.trim().length === 0) return [];
  if (text.length <= chunkSize) return [text.trim()];

  const chunks: string[] = [];

  function splitRecursive(text: string, separatorIndex: number): string[] {
    if (text.length <= chunkSize) return [text];
    if (separatorIndex >= separators.length) {
      // Hard split at chunkSize
      const parts: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
        parts.push(text.slice(i, i + chunkSize));
      }
      return parts;
    }

    const separator = separators[separatorIndex];
    const parts = separator ? text.split(separator) : [text];

    if (parts.length <= 1) {
      return splitRecursive(text, separatorIndex + 1);
    }

    const merged: string[] = [];
    let current = "";

    for (const part of parts) {
      const candidate = current
        ? current + separator + part
        : part;

      if (candidate.length <= chunkSize) {
        current = candidate;
      } else {
        if (current) merged.push(current);

        if (part.length > chunkSize) {
          // Recursively split oversized parts
          merged.push(...splitRecursive(part, separatorIndex + 1));
          current = "";
        } else {
          current = part;
        }
      }
    }

    if (current) merged.push(current);
    return merged;
  }

  const rawChunks = splitRecursive(text, 0);

  // Apply overlap
  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i].trim();
    if (!chunk) continue;

    if (i > 0 && chunkOverlap > 0) {
      const prevChunk = rawChunks[i - 1];
      const overlap = prevChunk.slice(-chunkOverlap);
      chunks.push((overlap + chunk).trim());
    } else {
      chunks.push(chunk);
    }
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Strip HTML tags from content (for module text content).
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rough token count estimate (1 token ≈ 4 chars for French).
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
