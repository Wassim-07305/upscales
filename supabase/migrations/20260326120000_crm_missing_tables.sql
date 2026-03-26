-- ============================================
-- CRM Missing Tables: clients, client_assignments, call_calendar, closer_calls
-- + Missing columns on leads
-- ============================================

-- ─── Clients ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  niche TEXT,
  notes TEXT,
  business_manager TEXT,
  status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'archivé', 'en_attente')),
  is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created_by ON clients(created_by);

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Client Assignments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('coach', 'setter', 'closer', 'monteur', 'cm', 'manager')),
  coach_fee NUMERIC(10,2),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, user_id, role)
);

CREATE INDEX idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_user ON client_assignments(user_id);

-- ─── Call Calendar ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT NOT NULL DEFAULT 'manuel' CHECK (type IN ('manuel', 'iclosed', 'calendly', 'booking', 'autre')),
  status TEXT NOT NULL DEFAULT 'planifié' CHECK (status IN ('planifié', 'réalisé', 'annulé', 'no_show', 'reporté')),
  link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_call_calendar_date ON call_calendar(date);
CREATE INDEX idx_call_calendar_assigned ON call_calendar(assigned_to);
CREATE INDEX idx_call_calendar_client ON call_calendar(client_id);

-- ─── Closer Calls ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS closer_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  closer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'non_categorise' CHECK (status IN ('closé', 'non_closé', 'non_categorise', 'perdu', 'annule', 'no_show', 'paiement_echoue', 'paiement_reussi', 'follow_up', 'r2')),
  revenue NUMERIC(10,2) DEFAULT 0,
  nombre_paiements INT DEFAULT 1,
  link TEXT,
  debrief TEXT,
  notes TEXT,
  objection TEXT,
  follow_up_date DATE,
  prospect_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_closer_calls_client ON closer_calls(client_id);
CREATE INDEX idx_closer_calls_closer ON closer_calls(closer_id);
CREATE INDEX idx_closer_calls_date ON closer_calls(date);

-- ─── Missing columns on leads ───────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_time TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_relance DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS column_id TEXT;

-- ─── RLS Policies ───────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE closer_calls ENABLE ROW LEVEL SECURITY;

-- Clients: admin/moderator full access
CREATE POLICY "clients_admin_mod_all" ON clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Client assignments: admin/moderator full access
CREATE POLICY "client_assignments_admin_mod_all" ON client_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Client assignments: members see their own
CREATE POLICY "client_assignments_own_read" ON client_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Call calendar: admin/moderator full access
CREATE POLICY "call_calendar_admin_mod_all" ON call_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Call calendar: assigned user can see their calls
CREATE POLICY "call_calendar_assigned_read" ON call_calendar
  FOR SELECT USING (assigned_to = auth.uid());

-- Closer calls: admin/moderator full access
CREATE POLICY "closer_calls_admin_mod_all" ON closer_calls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Closer calls: closer can see their own
CREATE POLICY "closer_calls_own_read" ON closer_calls
  FOR SELECT USING (closer_id = auth.uid());
