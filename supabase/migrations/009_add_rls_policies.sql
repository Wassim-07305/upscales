-- ============================================
-- UPSCALE — Migration 009
-- Renforcement RLS + Stripe + policies manquantes
-- ============================================

-- ============================================
-- 1. TABLE: stripe_customers (lien user <-> Stripe)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'eur',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_formation ON public.payments(formation_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_session_id);
CREATE INDEX idx_stripe_customers_user ON public.stripe_customers(user_id);

CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. RLS sur les nouvelles tables
-- ============================================
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- stripe_customers: users see own, admins see all
CREATE POLICY "Users see own stripe customer" ON public.stripe_customers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins manage stripe customers" ON public.stripe_customers
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- payments: users see own, admins see all
CREATE POLICY "Users see own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins manage payments" ON public.payments
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 3. POLICIES MANQUANTES sur tables existantes
-- ============================================

-- MESSAGES: manque UPDATE (edit) et DELETE
CREATE POLICY "Users can edit own messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid());

CREATE POLICY "Users or mods can delete messages" ON public.messages
    FOR DELETE TO authenticated
    USING (
        sender_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- NOTIFICATIONS: manque DELETE (clear)
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- QUIZ ATTEMPTS: admins/mods doivent pouvoir consulter
CREATE POLICY "Admins view all quiz attempts" ON public.quiz_attempts
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- SESSION PARTICIPANTS: admins manage (mark attended, etc.)
CREATE POLICY "Admins manage session participants" ON public.session_participants
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- MODULE PROGRESS: admins can view all progress
CREATE POLICY "Admins view all module progress" ON public.module_progress
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- CERTIFICATES: admin can create/manage
CREATE POLICY "Admins manage certificates" ON public.certificates
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- BOOKINGS: admins/mods should view bookings (not just admin)
CREATE POLICY "Moderators view bookings" ON public.bookings
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- CHANNEL MEMBERS: users can update own membership (mute, last_read_at)
CREATE POLICY "Users can update own channel membership" ON public.channel_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- CHANNEL MEMBERS: users can leave (delete own membership)
CREATE POLICY "Users can leave channels" ON public.channel_members
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- AI DOCUMENT CHUNKS: members can read chunks of ready documents (for RAG display)
CREATE POLICY "Members view ready AI chunks" ON public.ai_document_chunks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_documents ad
            WHERE ad.id = ai_document_chunks.document_id AND ad.status = 'ready'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'member')
        )
    );

-- LANDING PAGES: ensure anon can read for public pages
CREATE POLICY "Anon can view active landing pages" ON public.landing_pages
    FOR SELECT TO anon
    USING (is_active = true);

-- ============================================
-- 4. HELPER: function to check admin role (optimisation)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_mod()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    );
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
