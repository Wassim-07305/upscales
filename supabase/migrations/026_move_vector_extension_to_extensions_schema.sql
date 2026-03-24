-- Move vector extension from public to extensions schema
-- Applied: 2026-03-23

DROP FUNCTION IF EXISTS public.match_document_chunks(vector, double precision, integer);

ALTER TABLE public.ai_document_chunks DROP COLUMN IF EXISTS embedding;

ALTER EXTENSION vector SET SCHEMA extensions;

ALTER TABLE public.ai_document_chunks ADD COLUMN embedding extensions.vector;

CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding extensions.vector,
    match_threshold double precision DEFAULT 0.7,
    match_count integer DEFAULT 5
)
RETURNS TABLE(id uuid, document_id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
