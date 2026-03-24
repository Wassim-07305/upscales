-- ============================================
-- SOPs (Standard Operating Procedures)
-- ============================================

CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  department TEXT NOT NULL CHECK (department IN ('ceo', 'sales', 'delivery', 'publicite', 'contenu', 'equipe', 'tresorerie', 'operations')),
  target_roles TEXT[] NOT NULL DEFAULT '{admin}',
  external_links JSONB DEFAULT '[]',
  "order" INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sops_department ON sops(department);
CREATE INDEX idx_sops_published ON sops(is_published);

CREATE TRIGGER set_sops_updated_at
  BEFORE UPDATE ON sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sops_admin_all" ON sops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "sops_read_by_role" ON sops
  FOR SELECT USING (
    is_published = true AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role::text = ANY(sops.target_roles)
      )
    )
  );
