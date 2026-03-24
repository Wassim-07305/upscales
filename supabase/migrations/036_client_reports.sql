-- ============================================
-- Client Reports (Rapports hebdo/mensuels + NPS)
-- ============================================

CREATE TABLE IF NOT EXISTS client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
  metrics JSONB DEFAULT '{}',
  diagnostic TEXT,
  actions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_client_reports_client ON client_reports(client_id);
CREATE INDEX idx_client_reports_type ON client_reports(report_type);
CREATE INDEX idx_client_reports_period ON client_reports(period_start DESC);

CREATE TRIGGER set_client_reports_updated_at
  BEFORE UPDATE ON client_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_reports_admin_mod_all" ON client_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "client_reports_self_read" ON client_reports
  FOR SELECT USING (client_id = auth.uid());
