-- Correction de la politique INSERT sur notifications
-- L'ancienne politique permettait a tout utilisateur authentifie d'inserer des notifications pour n'importe qui
-- On la remplace par deux politiques plus restrictives

-- Suppression de l'ancienne politique trop permissive
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Politique 1 : un utilisateur peut inserer des notifications pour lui-meme (auto-notifications)
CREATE POLICY "Users can insert self notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (recipient_id = auth.uid());

-- Politique 2 : les admins et coachs peuvent inserer des notifications pour n'importe qui
-- (necessaire pour les notifications systeme, rappels, etc.)
CREATE POLICY "Admins and coaches can insert notifications for anyone"
  ON public.notifications
  FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'coach'));

-- Index pour accelerer les requetes de comptage de messages non lus
-- Optimise les jointures channel_members <-> messages sur last_read_at
CREATE INDEX IF NOT EXISTS idx_channel_members_last_read_at
  ON channel_members(channel_id, last_read_at DESC);
