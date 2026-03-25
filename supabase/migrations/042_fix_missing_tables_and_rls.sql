-- Fix missing tables referenced in code + RLS policies

CREATE TABLE IF NOT EXISTS module_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);
ALTER TABLE module_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON module_notes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS module_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES module_discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE module_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read discussions" ON module_discussions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own discussions" ON module_discussions FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Delete own discussions" ON module_discussions FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE IF NOT EXISTS formation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(formation_id, user_id)
);
ALTER TABLE formation_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read reviews" ON formation_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own reviews" ON formation_reviews FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS formation_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(formation_id, user_id)
);
ALTER TABLE formation_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own favorites" ON formation_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fix notifications INSERT
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
CREATE POLICY "Authenticated can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Fix certificates INSERT
DROP POLICY IF EXISTS "System can create certificates" ON certificates;
CREATE POLICY "Authenticated can create own certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Fix channels SELECT for members
DROP POLICY IF EXISTS "Members can read channels" ON channels;
CREATE POLICY "Authenticated can read channels" ON channels FOR SELECT TO authenticated USING (true);
