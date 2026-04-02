-- Migration: Fix schema mismatches and refresh PostgREST cache
-- Date: 2026-04-01

-- ─── 1. closer_calls.client_id ─────────────────────────────────────────────
-- La colonne est référencée dans le code mais peut manquer en prod
-- (table créée manuellement sans migration CREATE TABLE)
ALTER TABLE closer_calls ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_closer_calls_client_id ON closer_calls(client_id);

-- ─── 2. challenge_entries — colonnes attendues par le code ────────────────
-- Le hook utilise content/review_status/review_note mais le schéma d'origine
-- a metric_type/verified/verification_source. On ajoute les colonnes manquantes.
ALTER TABLE public.challenge_entries ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.challenge_entries ADD COLUMN IF NOT EXISTS review_status TEXT
  CHECK (review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.challenge_entries ADD COLUMN IF NOT EXISTS review_note TEXT;

-- Initialiser review_status à 'pending' pour les entrées existantes
UPDATE public.challenge_entries
  SET review_status = 'pending'
  WHERE review_status IS NULL;

-- ─── 3. Refresh PostgREST schema cache ────────────────────────────────────
-- Force la reconnaissance de toutes les colonnes ajoutées/modifiées
NOTIFY pgrst, 'reload schema';
