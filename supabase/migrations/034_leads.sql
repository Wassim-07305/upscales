-- ============================================
-- Leads (Pipeline Setter)
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  instagram_url TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'qualifie', 'appel_booke', 'en_reflexion', 'close', 'perdu', 'no_show')),
  estimated_value NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_created_by ON leads(created_by);

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ────────────────────────────────────────────────

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Admin/moderator full access
CREATE POLICY "leads_admin_mod_all" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Members can see leads assigned to them
CREATE POLICY "leads_assigned_read" ON leads
  FOR SELECT USING (assigned_to = auth.uid());
