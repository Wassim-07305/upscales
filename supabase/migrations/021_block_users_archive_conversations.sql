-- ============================================
-- Migration 021: Block users (DM) + Archive conversations
-- ============================================

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Index for fast lookups
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Archive conversations: add is_archived per user per channel
CREATE TABLE IF NOT EXISTS channel_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_channel_archives_user ON channel_archives(user_id);

ALTER TABLE channel_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own archives"
  ON channel_archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can archive channels"
  ON channel_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unarchive channels"
  ON channel_archives FOR DELETE
  USING (auth.uid() = user_id);
