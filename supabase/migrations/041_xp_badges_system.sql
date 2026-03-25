-- ============================================
-- XP & Badges System (Gamification)
-- ============================================

CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  xp_reward INT NOT NULL DEFAULT 0,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_xp_total ON user_xp(total_xp DESC);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_xp_read" ON user_xp FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_xp_admin" ON user_xp FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "badges_read" ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_admin" ON badges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "user_badges_read" ON user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Function: add XP and auto-level
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INT)
RETURNS VOID AS $$
DECLARE
  v_total INT;
  v_level INT;
BEGIN
  INSERT INTO user_xp (user_id, total_xp, level)
  VALUES (p_user_id, p_xp, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET total_xp = user_xp.total_xp + p_xp, updated_at = now();

  SELECT total_xp INTO v_total FROM user_xp WHERE user_id = p_user_id;

  -- Level formula: level = floor(sqrt(total_xp / 100)) + 1
  v_level := GREATEST(1, FLOOR(SQRT(v_total::float / 100.0)) + 1);

  UPDATE user_xp SET level = v_level WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default badges
INSERT INTO badges (name, description, icon, xp_reward, criteria) VALUES
  ('Premier Pas', 'Compléter votre premier module', '🎯', 50, '{"type":"modules_completed","count":1}'),
  ('Étudiant Assidu', 'Compléter 10 modules', '📚', 100, '{"type":"modules_completed","count":10}'),
  ('Diplômé', 'Obtenir votre premier certificat', '🎓', 200, '{"type":"certificates_earned","count":1}'),
  ('Contributeur', 'Créer 5 posts dans la communauté', '💬', 75, '{"type":"posts_created","count":5}'),
  ('Expert', 'Compléter 3 formations', '🏆', 500, '{"type":"formations_completed","count":3}')
ON CONFLICT (name) DO NOTHING;
