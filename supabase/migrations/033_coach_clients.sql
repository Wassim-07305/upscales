-- ============================================
-- Coach Clients (CRM Coach avancé)
-- ============================================

CREATE TABLE IF NOT EXISTS coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phase TEXT NOT NULL DEFAULT 'onboarding' CHECK (phase IN ('onboarding', 'lancement', 'optimisation', 'scaling', 'autonomie', 'offboarding')),
  health_status TEXT NOT NULL DEFAULT 'en_forme' CHECK (health_status IN ('en_forme', 'attention', 'critique', 'a_risque')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_revenue NUMERIC(10,2) DEFAULT 0,
  nps_score INT CHECK (nps_score >= 0 AND nps_score <= 10),
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  instagram_url TEXT,
  ads_url TEXT,
  product TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

CREATE INDEX idx_coach_clients_client ON coach_clients(client_id);
CREATE INDEX idx_coach_clients_coach ON coach_clients(coach_id);
CREATE INDEX idx_coach_clients_phase ON coach_clients(phase);
CREATE INDEX idx_coach_clients_health ON coach_clients(health_status);

CREATE TRIGGER set_coach_clients_updated_at
  BEFORE UPDATE ON coach_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ────────────────────────────────────────────────

ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

-- Admin/moderator full access
CREATE POLICY "coach_clients_admin_mod_all" ON coach_clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Client can read their own record
CREATE POLICY "coach_clients_self_read" ON coach_clients
  FOR SELECT USING (client_id = auth.uid());
