-- Préférences de notification utilisateur
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
  "message": true,
  "post": true,
  "formation": true,
  "session": true,
  "certificate": true,
  "system": true
}'::jsonb;
