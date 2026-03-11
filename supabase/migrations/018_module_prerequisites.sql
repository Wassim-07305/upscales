-- Module prerequisites: require completion of specific modules before accessing others
-- ============================================

-- Table to store prerequisite relationships between modules
CREATE TABLE module_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  prerequisite_module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate prerequisites
  UNIQUE(module_id, prerequisite_module_id),
  -- Prevent self-referencing
  CHECK (module_id != prerequisite_module_id)
);

-- Index for efficient lookups
CREATE INDEX idx_module_prerequisites_module_id ON module_prerequisites(module_id);
CREATE INDEX idx_module_prerequisites_prereq_id ON module_prerequisites(prerequisite_module_id);

-- RLS policies
ALTER TABLE module_prerequisites ENABLE ROW LEVEL SECURITY;

-- Anyone can read prerequisites
CREATE POLICY "Anyone can read module prerequisites"
  ON module_prerequisites FOR SELECT
  USING (true);

-- Only admins can manage prerequisites
CREATE POLICY "Admins can manage prerequisites"
  ON module_prerequisites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to check if a user has completed all prerequisites for a module
CREATE OR REPLACE FUNCTION check_module_prerequisites(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  incomplete_count INTEGER;
BEGIN
  -- Count prerequisites that are NOT completed
  SELECT COUNT(*) INTO incomplete_count
  FROM module_prerequisites mp
  WHERE mp.module_id = p_module_id
  AND NOT EXISTS (
    SELECT 1 FROM module_progress prog
    WHERE prog.user_id = p_user_id
    AND prog.module_id = mp.prerequisite_module_id
    AND prog.completed = true
  );

  -- Return true if all prerequisites are completed (incomplete_count = 0)
  RETURN incomplete_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
