-- Message reactions (emoji reactions on chat messages)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on messages in their channels"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
