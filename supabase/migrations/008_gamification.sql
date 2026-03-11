-- ============================================================
-- Migration 008: Système de gamification (badges, XP, niveaux)
-- ============================================================

-- ─── Table des badges ────────────────────────────────────────
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('course', 'community', 'engagement')),
  xp_reward INT NOT NULL DEFAULT 0,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table des badges utilisateurs ───────────────────────────
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ─── Table XP utilisateurs ──────────────────────────────────
CREATE TABLE user_xp (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index ──────────────────────────────────────────────────
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_xp_total_xp ON user_xp(total_xp DESC);

-- ─── RLS policies ───────────────────────────────────────────

-- badges: lecture publique
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_all" ON badges
  FOR SELECT USING (true);

-- user_badges: lecture propre ou admin, insertion par le système
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_own" ON user_badges
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "user_badges_insert_system" ON user_badges
  FOR INSERT WITH CHECK (true);

-- user_xp: lecture pour classement, upsert par le système
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_xp_select_all" ON user_xp
  FOR SELECT USING (true);

CREATE POLICY "user_xp_insert_system" ON user_xp
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user_xp_update_system" ON user_xp
  FOR UPDATE USING (true);

-- ─── Fonction d'ajout d'XP ──────────────────────────────────

CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_xp (user_id, total_xp, level, updated_at)
  VALUES (p_user_id, p_xp, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = user_xp.total_xp + p_xp,
      level = GREATEST(1, FLOOR(SQRT((user_xp.total_xp + p_xp) / 100.0))::INT),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Badges par défaut ──────────────────────────────────────

INSERT INTO badges (name, description, icon, category, xp_reward, criteria) VALUES
  ('Premier pas', 'Terminer votre premier module', 'footprints', 'course', 50, '{"type": "modules_completed", "count": 1}'),
  ('Étudiant assidu', 'Terminer 10 modules', 'flame', 'course', 200, '{"type": "modules_completed", "count": 10}'),
  ('Diplômé', 'Obtenir votre premier certificat', 'graduation-cap', 'course', 500, '{"type": "certificates_earned", "count": 1}'),
  ('Social', 'Publier 5 posts dans la communauté', 'message-circle', 'community', 100, '{"type": "posts_created", "count": 5}'),
  ('Marathonien', 'Terminer 3 formations complètes', 'trophy', 'engagement', 1000, '{"type": "formations_completed", "count": 3}');
