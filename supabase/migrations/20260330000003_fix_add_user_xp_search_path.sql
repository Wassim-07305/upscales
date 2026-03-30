-- Fix: add_user_xp(uuid, integer) — add SET search_path to fix mutable search_path warning
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INT;
  v_level INT;
BEGIN
  INSERT INTO user_xp (user_id, total_xp, level)
  VALUES (p_user_id, p_xp, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET total_xp = user_xp.total_xp + p_xp, updated_at = now();

  SELECT total_xp INTO v_total FROM user_xp WHERE user_id = p_user_id;

  -- Level formula: level = floor(sqrt(total_xp / 100)) + 1
  v_level := GREATEST(1, FLOOR(SQRT(v_total::float / 100.0)) + 1);

  UPDATE user_xp SET level = v_level WHERE user_id = p_user_id;
END;
$$;

-- Drop the broken 3-arg overload (references non-existent column "xp" instead of "total_xp")
DROP FUNCTION IF EXISTS public.add_user_xp(uuid, integer, text);
