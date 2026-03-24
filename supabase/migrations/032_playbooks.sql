-- ============================================
-- Playbooks (Role-based Operating Systems)
-- ============================================

-- Playbooks: one per role (Setter OS, Closer OS, Coach OS, etc.)
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('setter', 'closer', 'coach', 'assistante', 'all')),
  icon TEXT DEFAULT 'BookOpen',
  is_published BOOLEAN NOT NULL DEFAULT false,
  "order" INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbooks_slug ON playbooks(slug);
CREATE INDEX idx_playbooks_target_role ON playbooks(target_role);
CREATE INDEX idx_playbooks_published ON playbooks(is_published);

CREATE TRIGGER set_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sections: groups of pages within a playbook
CREATE TABLE IF NOT EXISTS playbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbook_sections_playbook ON playbook_sections(playbook_id);

CREATE TRIGGER set_playbook_sections_updated_at
  BEFORE UPDATE ON playbook_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pages: content pages within sections (processes, scripts, checklists, KPIs)
CREATE TABLE IF NOT EXISTS playbook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES playbook_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  page_type TEXT NOT NULL DEFAULT 'content' CHECK (page_type IN ('content', 'checklist', 'script', 'kpi', 'links')),
  external_links JSONB DEFAULT '[]',
  "order" INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbook_pages_section ON playbook_pages(section_id);

CREATE TRIGGER set_playbook_pages_updated_at
  BEFORE UPDATE ON playbook_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_pages ENABLE ROW LEVEL SECURITY;

-- Admin full access on all tables
CREATE POLICY "playbooks_admin_all" ON playbooks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "playbook_sections_admin_all" ON playbook_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "playbook_pages_admin_all" ON playbook_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Members can read published playbooks matching their role
CREATE POLICY "playbooks_read_by_role" ON playbooks
  FOR SELECT USING (
    is_published = true AND (
      target_role = 'all' OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'moderator', 'member')
      )
    )
  );

CREATE POLICY "playbook_sections_read" ON playbook_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playbooks
      WHERE playbooks.id = playbook_sections.playbook_id
      AND playbooks.is_published = true
      AND (
        playbooks.target_role = 'all' OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'member')
        )
      )
    )
  );

CREATE POLICY "playbook_pages_read" ON playbook_pages
  FOR SELECT USING (
    playbook_pages.is_published = true AND
    EXISTS (
      SELECT 1 FROM playbook_sections
      JOIN playbooks ON playbooks.id = playbook_sections.playbook_id
      WHERE playbook_sections.id = playbook_pages.section_id
      AND playbooks.is_published = true
      AND (
        playbooks.target_role = 'all' OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'member')
        )
      )
    )
  );
