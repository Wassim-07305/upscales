-- Landing Pages (Puck-based page builder)

CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT 'Nouvelle page',
    description TEXT,
    og_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    puck_data JSONB NOT NULL DEFAULT '{"content":[],"root":{"props":{}}}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON public.landing_pages(is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER set_landing_pages_updated_at
    BEFORE UPDATE ON public.landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY "Admins can manage landing pages"
    ON public.landing_pages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- Public: read active pages only
CREATE POLICY "Anyone can view active landing pages"
    ON public.landing_pages
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- RPC: get landing page by slug (for public rendering)
CREATE OR REPLACE FUNCTION public.get_landing_page_by_slug(_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    _page json;
BEGIN
    SELECT json_build_object(
        'id', lp.id,
        'slug', lp.slug,
        'title', lp.title,
        'description', lp.description,
        'og_image_url', lp.og_image_url,
        'puck_data', lp.puck_data
    )
    INTO _page
    FROM public.landing_pages lp
    WHERE lp.slug = _slug
      AND lp.is_active = true;

    RETURN _page;
END;
$$;
