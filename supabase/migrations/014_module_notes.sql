-- Notes de module par utilisateur
CREATE TABLE IF NOT EXISTS module_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_notes_user ON module_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_module_notes_module ON module_notes(module_id);

-- RLS
ALTER TABLE module_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notes" ON module_notes
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users create own notes" ON module_notes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own notes" ON module_notes
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users delete own notes" ON module_notes
    FOR DELETE TO authenticated USING (user_id = auth.uid());
