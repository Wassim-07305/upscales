-- Fix: le trigger handle_new_user ne cherchait pas les invitations
-- Il hardcodait 'prospect' pour tous les nouveaux users
-- Maintenant il verifie user_invites et assigne le role invite

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  assigned_role TEXT := 'prospect';
BEGIN
  -- Cherche une invitation pending pour cet email
  SELECT role, id INTO invite_record
  FROM user_invites
  WHERE email = NEW.email
    AND status = 'pending'
  LIMIT 1;

  -- Si invitation trouvee, utilise le role invite
  IF invite_record.id IS NOT NULL THEN
    assigned_role := invite_record.role;
  END IF;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
