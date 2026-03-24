-- ============================================================
-- 028: Exercise submissions, Drip schedules, User streaks
-- ============================================================

-- 1. Exercise submissions
CREATE TABLE IF NOT EXISTS exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'revision_requested')),
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercise_submissions_module ON exercise_submissions(module_id);
CREATE INDEX idx_exercise_submissions_user ON exercise_submissions(user_id);
CREATE INDEX idx_exercise_submissions_status ON exercise_submissions(status);

ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;

-- Students can see and manage their own submissions
CREATE POLICY "Users can view own submissions" ON exercise_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON exercise_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions" ON exercise_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'revision_requested'));

-- Admins can do everything
CREATE POLICY "Admins can view all submissions" ON exercise_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update submissions" ON exercise_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Drip schedules
CREATE TABLE IF NOT EXISTS drip_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  delay_days INTEGER NOT NULL DEFAULT 0,
  unlock_type TEXT NOT NULL DEFAULT 'time-based' CHECK (unlock_type IN ('time-based', 'progress-based')),
  prerequisite_module_id UUID REFERENCES modules(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drip_schedules_formation ON drip_schedules(formation_id);
CREATE UNIQUE INDEX idx_drip_schedules_module ON drip_schedules(module_id);

ALTER TABLE drip_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read drip schedules" ON drip_schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage drip schedules" ON drip_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. User streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  frozen BOOLEAN DEFAULT false,
  freezes_remaining INTEGER DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks" ON user_streaks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
