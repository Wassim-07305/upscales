-- Permettre aux admins de voir toutes les memoires AlexIA
-- (pas seulement celles ou coach_id = leur propre ID)
CREATE POLICY "Admin sees all memories" ON client_ai_memory
  FOR SELECT USING (get_my_role() = 'admin');
