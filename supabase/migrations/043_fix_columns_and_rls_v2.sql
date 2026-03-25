-- Add missing formation_id columns
ALTER TABLE module_notes ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES formations(id) ON DELETE CASCADE;
ALTER TABLE module_discussions ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES formations(id) ON DELETE CASCADE;

-- Fix messages INSERT
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Fix channel_members INSERT
DROP POLICY IF EXISTS "Users can join channels" ON channel_members;
CREATE POLICY "Users can join channels" ON channel_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
