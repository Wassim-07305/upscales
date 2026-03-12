-- ============================================
-- Migration 022: Quiz option images
-- ============================================

-- Add image_url to quiz options for multimedia support
ALTER TABLE quiz_options ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
