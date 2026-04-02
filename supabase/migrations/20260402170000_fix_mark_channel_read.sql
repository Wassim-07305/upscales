-- Fix mark_channel_read: also update channel_members.last_read_at
-- Previously it only wrote to message_reads, but unread counts read from channel_members

CREATE OR REPLACE FUNCTION mark_channel_read(p_channel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update message_reads (existing behavior)
  INSERT INTO message_reads (channel_id, user_id, last_read_at)
  VALUES (p_channel_id, auth.uid(), NOW())
  ON CONFLICT (channel_id, user_id)
  DO UPDATE SET last_read_at = NOW();

  -- UPSERT channel_members.last_read_at (admin peut ne pas être membre d'un canal public)
  INSERT INTO channel_members (channel_id, profile_id, last_read_at, role)
  VALUES (p_channel_id, auth.uid(), NOW(), 'member')
  ON CONFLICT (channel_id, profile_id)
  DO UPDATE SET last_read_at = NOW();
END;
$$;
