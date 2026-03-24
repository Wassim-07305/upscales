-- ============================================
-- Tool Links (Hub liens/outils)
-- ============================================

CREATE TABLE IF NOT EXISTS tool_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'autre' CHECK (category IN ('vente', 'ads', 'delivery', 'operations', 'contenu', 'finance', 'autre')),
  "order" INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tool_links_category ON tool_links(category);

CREATE TRIGGER set_tool_links_updated_at
  BEFORE UPDATE ON tool_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tool_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tool_links_admin_all" ON tool_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tool_links_read_published" ON tool_links
  FOR SELECT USING (
    is_published = true AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'member'))
  );
