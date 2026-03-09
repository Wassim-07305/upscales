import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
 * OpenAI supports up to 2048 inputs per call.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanTexts = texts.map((t) => t.replace(/\n/g, " ").trim());

  // Batch in groups of 2048
  const results: number[][] = [];
  for (let i = 0; i < cleanTexts.length; i += 2048) {
    const batch = cleanTexts.slice(i, i + 2048);
    const response = await getClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}
