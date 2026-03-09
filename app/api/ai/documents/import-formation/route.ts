import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { splitTextIntoChunks, stripHtml, estimateTokenCount } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";

// POST: Import a formation's content into the knowledge base
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { formationId } = await request.json();

  // Fetch formation + modules
  const { data: formation, error: fError } = await supabase
    .from("formations")
    .select("id, title, description")
    .eq("id", formationId)
    .single();

  if (fError || !formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, content, type")
    .eq("formation_id", formationId)
    .order("order", { ascending: true });

  if (!modules || modules.length === 0) {
    return NextResponse.json({ error: "Aucun module dans cette formation" }, { status: 400 });
  }

  try {
    // Create document record
    const { data: doc, error: docError } = await supabase
      .from("ai_documents")
      .insert({
        title: formation.title,
        source_type: "formation",
        formation_id: formationId,
        created_by: user.id,
      })
      .select()
      .single();

    if (docError || !doc) throw docError || new Error("Failed to create document");

    // Build text from each module and chunk them
    const allChunks: { content: string; metadata: Record<string, string> }[] = [];

    for (const mod of modules) {
      const parts: string[] = [`Titre du module : ${mod.title}`];
      if (mod.description) parts.push(mod.description);
      if (mod.content) parts.push(stripHtml(mod.content));

      const moduleText = parts.join("\n\n");
      const chunks = splitTextIntoChunks(moduleText);

      for (const chunk of chunks) {
        allChunks.push({
          content: chunk,
          metadata: {
            formation_title: formation.title,
            module_title: mod.title,
            source: "formation",
          },
        });
      }
    }

    if (allChunks.length === 0) {
      throw new Error("Aucun contenu textuel à indexer dans cette formation");
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(allChunks.map((c) => c.content));

    // Insert chunks
    const chunkRows = allChunks.map((chunk, index) => ({
      document_id: doc.id,
      content: chunk.content,
      chunk_index: index,
      token_count: estimateTokenCount(chunk.content),
      embedding: JSON.stringify(embeddings[index]),
      metadata: chunk.metadata,
    }));

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
      .update({ status: "ready", chunk_count: allChunks.length })
      .eq("id", doc.id);

    return NextResponse.json({ success: true, chunk_count: allChunks.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'import";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
