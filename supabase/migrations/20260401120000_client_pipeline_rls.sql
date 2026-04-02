-- Les clients peuvent gerer leurs propres colonnes, leads et activites CRM
CREATE POLICY client_own_columns ON pipeline_columns
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY client_own_leads ON setter_leads
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY client_own_activities ON setter_activities
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
