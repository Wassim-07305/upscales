-- ─── Resource Folders ────────────────────────────────
-- Systeme de dossiers pour les ressources (type Google Drive)

-- 1. Table des dossiers
CREATE TABLE IF NOT EXISTS resource_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  icon        text,
  color       text,
  visibility  text NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'staff', 'clients')),
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_resource_folders_updated_at
  BEFORE UPDATE ON resource_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Table des acces individuels par utilisateur
CREATE TABLE IF NOT EXISTS resource_folder_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   uuid NOT NULL REFERENCES resource_folders(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(folder_id, user_id)
);

-- 3. Ajouter folder_id sur resources (nullable — fichiers existants restent a la racine)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES resource_folders(id) ON DELETE SET NULL;

-- 4. Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_resources_folder_id ON resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_resource_folder_access_folder ON resource_folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_resource_folder_access_user ON resource_folder_access(user_id);

-- 5. RLS sur resource_folders
ALTER TABLE resource_folders ENABLE ROW LEVEL SECURITY;

-- Admins voient tout
CREATE POLICY "admin_full_access_folders" ON resource_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );

-- Staff (coach) voit les dossiers staff + all
CREATE POLICY "staff_select_folders" ON resource_folders
  FOR SELECT USING (
    visibility IN ('all', 'staff')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach'))
    OR EXISTS (SELECT 1 FROM resource_folder_access WHERE folder_id = resource_folders.id AND user_id = auth.uid())
  );

-- Clients voient les dossiers clients + all + acces individuel
CREATE POLICY "client_select_folders" ON resource_folders
  FOR SELECT USING (
    visibility IN ('all', 'clients')
    OR EXISTS (SELECT 1 FROM resource_folder_access WHERE folder_id = resource_folders.id AND user_id = auth.uid())
  );

-- 6. RLS sur resource_folder_access
ALTER TABLE resource_folder_access ENABLE ROW LEVEL SECURITY;

-- Admins gerent les acces
CREATE POLICY "admin_manage_folder_access" ON resource_folder_access
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );

-- Les users voient leurs propres acces
CREATE POLICY "user_view_own_access" ON resource_folder_access
  FOR SELECT USING (user_id = auth.uid());
