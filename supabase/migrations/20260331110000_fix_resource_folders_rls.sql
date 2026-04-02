-- Fix RLS policies pour resource_folders
-- Bug 1: client_select_folders n'avait pas de filtre de role → setters/closers voyaient tout
-- Bug 2: coaches ne pouvaient pas creer/modifier/supprimer des dossiers

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "admin_full_access_folders" ON resource_folders;
DROP POLICY IF EXISTS "staff_select_folders" ON resource_folders;
DROP POLICY IF EXISTS "client_select_folders" ON resource_folders;

-- Admin : acces total
CREATE POLICY "admin_full_access_folders" ON resource_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff (coach) : lecture sur dossiers staff + all + acces individuel
CREATE POLICY "staff_select_folders" ON resource_folders
  FOR SELECT USING (
    visibility IN ('all', 'staff')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    OR EXISTS (SELECT 1 FROM resource_folder_access WHERE folder_id = resource_folders.id AND user_id = auth.uid())
  );

-- Staff (coach) : creation/modification/suppression
CREATE POLICY "staff_manage_folders" ON resource_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- Clients/prospects : lecture sur dossiers clients + all + acces individuel
CREATE POLICY "client_select_folders" ON resource_folders
  FOR SELECT USING (
    (visibility IN ('all', 'clients')
     AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('client', 'prospect')))
    OR EXISTS (SELECT 1 FROM resource_folder_access WHERE folder_id = resource_folders.id AND user_id = auth.uid())
  );

-- Sales (setter/closer) : lecture sur dossiers all + acces individuel
CREATE POLICY "sales_select_folders" ON resource_folders
  FOR SELECT USING (
    (visibility = 'all'
     AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('setter', 'closer')))
    OR EXISTS (SELECT 1 FROM resource_folder_access WHERE folder_id = resource_folders.id AND user_id = auth.uid())
  );
