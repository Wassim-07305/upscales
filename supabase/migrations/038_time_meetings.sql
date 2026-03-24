-- ============================================
-- Time Entries (Suivi heures)
-- ============================================

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_time_entries_member ON time_entries(member_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date DESC);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_admin_mod_all" ON time_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "time_entries_self" ON time_entries
  FOR ALL USING (member_id = auth.uid());

-- ============================================
-- Meeting Notes (Notes de réunion)
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_type TEXT NOT NULL DEFAULT 'hebdo' CHECK (meeting_type IN ('hebdo', 'mensuel', 'trimestriel', 'autre')),
  content TEXT,
  participants TEXT[],
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meeting_notes_date ON meeting_notes(meeting_date DESC);

CREATE TRIGGER set_meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_notes_admin_mod_all" ON meeting_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
