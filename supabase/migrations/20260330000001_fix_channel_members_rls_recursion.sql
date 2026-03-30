-- Fix: infinite recursion between channel_members and channels RLS policies
-- The "DM creators can add members" policy referenced channels,
-- which itself referenced channel_members → infinite loop.
-- Solution: use a SECURITY DEFINER function to bypass RLS when checking channels.

CREATE OR REPLACE FUNCTION public.get_dm_channel_creator(p_channel_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT created_by FROM public.channels
  WHERE id = p_channel_id AND type = 'dm'
  LIMIT 1;
$$;

-- Replace the recursive policy with one that uses the safe function
DROP POLICY IF EXISTS "DM creators can add members" ON public.channel_members;

CREATE POLICY "DM creators can add members"
  ON public.channel_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_dm_channel_creator(channel_members.channel_id) = auth.uid()
  );
