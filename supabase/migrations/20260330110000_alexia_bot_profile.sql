-- Creer un user auth + profil bot pour AlexIA avec un UUID deterministe
-- Ce profil permet a AlexIA d'etre ajoutee comme membre de canaux
-- et d'envoyer des messages avec sa propre identite

-- 1. Creer le user dans auth.users (requis par la FK profiles.id -> auth.users.id)
-- Note: le trigger handle_new_user cree automatiquement le profil dans public.profiles
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  '00000000-0000-0000-0000-a1e01a000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'alexia-bot@off-market.internal',
  '',
  now(),
  now(),
  now(),
  '',
  '{"provider": "system", "providers": ["system"]}',
  '{"full_name": "AlexIA", "is_bot": true}',
  false
)
ON CONFLICT (id) DO NOTHING;

-- 2. Mettre a jour le profil cree par le trigger (role par defaut = prospect)
UPDATE public.profiles
SET role = 'admin',
    full_name = 'AlexIA',
    onboarding_completed = true,
    onboarding_step = 99
WHERE id = '00000000-0000-0000-0000-a1e01a000001';
