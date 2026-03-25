import OpenAI from "openai";

const EMBEDDING_MODEL = "voyage-3-lite";

function getClient() {
  return new OpenAI({
    apiKey: process.env.VOYAGE_API_KEY,
    baseURL: "https://api.voyageai.com/v1",
  });
}

/**
 * Generate a single embedding vector for a text query.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, " ").trim(),
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanTexts = texts.map((t) => t.replace(/\n/g, " ").trim());

  // Batch in groups of 128 (Voyage limit)
  const results: number[][] = [];
  for (let i = 0; i < cleanTexts.length; i += 128) {
    const batch = cleanTexts.slice(i, i + 128);
    const response = await getClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}
