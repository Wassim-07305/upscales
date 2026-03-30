-- Add timezone and language preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en'));
