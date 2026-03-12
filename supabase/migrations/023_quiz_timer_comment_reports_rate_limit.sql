-- ============================================
-- Migration 023: Quiz timer, comment reports
-- ============================================

-- Add time_limit_minutes to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

-- Comment reports table
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'inappropriate',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);

-- RLS for comment_reports
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports for comments they didn't author
CREATE POLICY "Users can report comments"
  ON comment_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can see own reports"
  ON comment_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can see and manage all reports
CREATE POLICY "Admins manage all comment reports"
  ON comment_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
