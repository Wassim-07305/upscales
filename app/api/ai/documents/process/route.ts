import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { splitTextIntoChunks, estimateTokenCount } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";

// POST: Process a document — parse, chunk, embed, store
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await request.json();

  // Fetch document record
  const { data: doc, error: docError } = await supabase
    .from("ai_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    let fullText = "";

    if (doc.source_type === "pdf" && doc.file_url) {
      // Download PDF from Supabase Storage
      const response = await fetch(doc.file_url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      await parser.destroy();
      fullText = textResult.text;
    } else if (doc.source_type === "txt" && doc.file_url) {
      const response = await fetch(doc.file_url);
      fullText = await response.text();
    } else {
      throw new Error("Unsupported document type or missing file URL");
    }

    if (!fullText.trim()) {
      throw new Error("Le document est vide ou illisible");
    }

    // Chunk the text
    const chunks = splitTextIntoChunks(fullText);

    if (chunks.length === 0) {
      throw new Error("Aucun contenu à indexer");
    }

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(chunks);

    // Insert chunks with embeddings
    const chunkRows = chunks.map((content, index) => ({
      document_id: documentId,
      content,
      chunk_index: index,
      token_count: estimateTokenCount(content),
      embedding: JSON.stringify(embeddings[index]),
      metadata: { source: doc.source_type, file_name: doc.file_name },
    }));

    // Insert in batches of 100
    for (let i = 0; i < chunkRows.length; i += 100) {
      const batch = chunkRows.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from("ai_document_chunks")
        .insert(batch);
      if (insertError) throw insertError;
    }

    // Update document status
    await supabase
      .from("ai_documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", documentId);

    return NextResponse.json({ success: true, chunk_count: chunks.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de traitement";
    await supabase
      .from("ai_documents")
      .update({ status: "error", error_message: message })
      .eq("id", documentId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
