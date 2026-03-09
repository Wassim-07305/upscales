-- AI Knowledge Base (MateuzsIA) — pgvector RAG system

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents sources (PDF, TXT, formations importées)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'txt', 'formation')),
    formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    file_url TEXT,
    file_name TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks vectorisés
CREATE TABLE IF NOT EXISTS public.ai_document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.ai_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations persistées
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages individuels
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_documents_status ON public.ai_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_source ON public.ai_documents(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_document ON public.ai_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);

-- IVFFlat vector index (cosine similarity)
CREATE INDEX IF NOT EXISTS idx_ai_chunks_embedding ON public.ai_document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Updated_at triggers
CREATE TRIGGER set_ai_documents_updated_at
    BEFORE UPDATE ON public.ai_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- ai_documents: admins/moderators manage, members read ready docs
CREATE POLICY "Admins manage AI documents"
    ON public.ai_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "Members view ready AI documents"
    ON public.ai_documents
    FOR SELECT TO authenticated
    USING (
        status = 'ready' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'member'))
    );

-- ai_document_chunks: admins manage, others via RPC (SECURITY DEFINER)
CREATE POLICY "Admins manage AI chunks"
    ON public.ai_document_chunks
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- ai_conversations: users manage own
CREATE POLICY "Users manage own AI conversations"
    ON public.ai_conversations
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ai_messages: users see own conversation messages
CREATE POLICY "Users view own AI messages"
    ON public.ai_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid())
    );

CREATE POLICY "Users insert own AI messages"
    ON public.ai_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid())
    );

-- RPC: Vector similarity search
CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        adc.id,
        adc.document_id,
        adc.content,
        adc.metadata,
        (1 - (adc.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.ai_document_chunks adc
    JOIN public.ai_documents ad ON ad.id = adc.document_id
    WHERE ad.status = 'ready'
    AND (1 - (adc.embedding <=> query_embedding)) > match_threshold
    ORDER BY adc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
