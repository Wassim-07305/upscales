-- ============================================
-- Video Content (Production vidéo)
-- ============================================

CREATE TABLE IF NOT EXISTS video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram' CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'other')),
  status TEXT NOT NULL DEFAULT 'idee' CHECK (status IN ('idee', 'script_pret', 'tournage_pret', 'publie')),
  publish_date DATE,
  script_notes TEXT,
  description TEXT,
  external_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_video_content_status ON video_content(status);
CREATE INDEX idx_video_content_publish ON video_content(publish_date);

CREATE TRIGGER set_video_content_updated_at
  BEFORE UPDATE ON video_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_content_admin_mod_all" ON video_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
