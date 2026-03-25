-- Fix overly permissive INSERT policies: {public} → {authenticated} + WITH CHECK

-- 1. blocked_users
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

-- 2. channel_archives
DROP POLICY IF EXISTS "Users can archive channels" ON channel_archives;
CREATE POLICY "Users can archive channels" ON channel_archives
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. message_reactions
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. user_streaks
DROP POLICY IF EXISTS "Users can insert own streak" ON user_streaks;
CREATE POLICY "Users can insert own streak" ON user_streaks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. exercise_submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON exercise_submissions;
CREATE POLICY "Users can insert own submissions" ON exercise_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
