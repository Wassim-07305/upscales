-- Discussions / questions par module
CREATE TABLE IF NOT EXISTS module_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES module_discussions(id) ON DELETE CASCADE,
    likes_count INT NOT NULL DEFAULT 0,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_discussions_module ON module_discussions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_discussions_parent ON module_discussions(parent_id);

-- RLS
ALTER TABLE module_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users see discussions" ON module_discussions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enrolled users create discussions" ON module_discussions
    FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors update own discussions" ON module_discussions
    FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Authors or admins delete discussions" ON module_discussions
    FOR DELETE TO authenticated USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );
