-- ============================================================
-- Migration 009: Paiements Stripe + Système de parrainage
-- ============================================================

-- ─── Table des paiements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_formation_id ON payments(formation_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ─── Système de parrainage ──────────────────────────────────

-- Ajouter un code de parrainage unique à chaque profil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Table de suivi des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'enrolled', 'completed')),
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- ─── RLS policies ───────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (true);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id
    OR auth.uid() = referred_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "referrals_insert" ON referrals
  FOR INSERT WITH CHECK (true);

-- ─── Fonction pour générer un code de parrainage ─────────────

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'UPS-' || UPPER(SUBSTR(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Générer des codes pour les profils existants qui n'en ont pas
UPDATE profiles
SET referral_code = 'UPS-' || UPPER(SUBSTR(MD5(id::TEXT || NOW()::TEXT), 1, 8))
WHERE referral_code IS NULL;
