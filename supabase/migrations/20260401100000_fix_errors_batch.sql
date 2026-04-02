-- Migration: Fix multiple production errors (138 errors batch)
-- Date: 2026-04-01

-- ─── 1. Fix setter_activities unique constraint ────────────────────
-- Le code upsert sur (user_id, client_id, date) mais la contrainte est UNIQUE(user_id, date)
ALTER TABLE setter_activities DROP CONSTRAINT IF EXISTS setter_activities_user_id_date_key;
ALTER TABLE setter_activities ADD CONSTRAINT setter_activities_user_client_date_key UNIQUE (user_id, client_id, date);

-- ─── 2. Créer fonction increment_download_count ────────────────────
CREATE OR REPLACE FUNCTION increment_download_count(resource_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE resources
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. Reload PostgREST schema cache ──────────────────────────────
-- Force le rechargement pour que closer_calls.client_id soit reconnu
NOTIFY pgrst, 'reload schema';

-- ─── 4. Fix RLS: admin peut insérer des messages ──────────────────
-- Drop l'ancienne policy si elle existe et recréer avec bypass admin
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM channels WHERE id = messages.channel_id AND type = 'public')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
  )
);

-- ─── 5. Fix RLS: admin peut liker des posts ───────────────────────
DROP POLICY IF EXISTS "Users can like posts" ON feed_likes;
CREATE POLICY "Users can like posts" ON feed_likes FOR INSERT WITH CHECK (
  auth.uid() = profile_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
);

-- ─── 6. Fix RLS: notification_preferences pour admin ──────────────
DROP POLICY IF EXISTS "notif_prefs_insert" ON notification_preferences;
CREATE POLICY "notif_prefs_insert" ON notification_preferences FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
);

DROP POLICY IF EXISTS "notif_prefs_update" ON notification_preferences;
CREATE POLICY "notif_prefs_update" ON notification_preferences FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
);

-- ─── 7. Fix RLS: user_preferences pour admin ──────────────────────
DROP POLICY IF EXISTS "user_prefs_insert" ON user_preferences;
CREATE POLICY "user_prefs_insert" ON user_preferences FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
);

DROP POLICY IF EXISTS "user_prefs_update" ON user_preferences;
CREATE POLICY "user_prefs_update" ON user_preferences FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
);
