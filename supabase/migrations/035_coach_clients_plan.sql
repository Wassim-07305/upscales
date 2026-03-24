-- Ajouter le plan client individuel (contenu riche) à coach_clients
ALTER TABLE coach_clients ADD COLUMN IF NOT EXISTS plan_content TEXT;
