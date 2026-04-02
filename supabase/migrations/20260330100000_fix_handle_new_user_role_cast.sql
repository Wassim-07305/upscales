-- Fix: handle_new_user() echouait car assigned_role (TEXT) n'etait pas caste en user_role (enum)
-- Resultat: les nouveaux comptes n'avaient pas de profil dans la table profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite_record RECORD;
  assigned_role TEXT;
BEGIN
  SELECT * INTO invite_record
  FROM user_invites
  WHERE email = NEW.email AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    assigned_role := invite_record.role;
    UPDATE user_invites SET status = 'accepted', accepted_at = now()
    WHERE id = invite_record.id;
  ELSE
    assigned_role := 'prospect';
  END IF;

  INSERT INTO profiles (id, email, full_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role::user_role,
    CASE WHEN assigned_role IN ('client', 'prospect') THEN false ELSE true END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;
