-- Favoris de formation
CREATE TABLE IF NOT EXISTS formation_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, formation_id)
);

CREATE INDEX IF NOT EXISTS idx_formation_favorites_user ON formation_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_favorites_formation ON formation_favorites(formation_id);

-- RLS
ALTER TABLE formation_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON formation_favorites
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites" ON formation_favorites
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites" ON formation_favorites
    FOR DELETE TO authenticated USING (user_id = auth.uid());
