-- ============================================
-- UPSCALE — Migration: Consolidation RLS
-- Assure que RLS est activé sur TOUTES les tables
-- avec policies complètes par rôle (admin, moderateur, membre, prospect)
-- ============================================

-- ============================================
-- 0. HELPER FUNCTIONS (idempotent via CREATE OR REPLACE)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_mod()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    );
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================
-- 1. ENABLE RLS (idempotent — safe to re-run)
-- ============================================

-- Core
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Quiz
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Community
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Chat
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Calendar
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Booking
ALTER TABLE public.booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Landing Pages
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- AI
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Stripe / Payments
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Platform
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (clean slate pour recréer proprement)
-- ============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- 3. PROFILES
-- Tous les rôles authentifiés peuvent voir les profils.
-- Chaque user peut modifier le sien. Admin modifie tout.
-- ============================================
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
    ON public.profiles FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 4. FORMATIONS
-- Prospects : voient les formations publiées (catalogue)
-- Membres/mods : idem
-- Admins : CRUD complet
-- ============================================
CREATE POLICY "formations_select_published"
    ON public.formations FOR SELECT TO authenticated
    USING (status = 'published' OR public.is_admin_or_mod());

CREATE POLICY "formations_admin_all"
    ON public.formations FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 5. MODULES
-- Prospects : voir les modules preview
-- Membres inscrits : voir tous les modules de leurs formations
-- Admins : CRUD complet
-- ============================================
CREATE POLICY "modules_select_preview_or_enrolled"
    ON public.modules FOR SELECT TO authenticated
    USING (
        is_preview = true
        OR EXISTS (
            SELECT 1 FROM public.formation_enrollments
            WHERE formation_enrollments.formation_id = modules.formation_id
              AND formation_enrollments.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "modules_admin_all"
    ON public.modules FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 6. FORMATION ENROLLMENTS
-- Chaque user voit ses inscriptions. Admins gèrent tout.
-- Membres/prospects peuvent s'inscrire eux-mêmes.
-- ============================================
CREATE POLICY "enrollments_select_own"
    ON public.formation_enrollments FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_mod());

CREATE POLICY "enrollments_insert_self"
    ON public.formation_enrollments FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_admin_all"
    ON public.formation_enrollments FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 7. MODULE PROGRESS
-- Users voient/MAJ leur propre progression. Admins/mods consultent tout.
-- ============================================
CREATE POLICY "progress_select_own"
    ON public.module_progress FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_mod());

CREATE POLICY "progress_upsert_own"
    ON public.module_progress FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_update_own"
    ON public.module_progress FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- 8. QUIZZES / QUESTIONS / OPTIONS
-- Inscrits à la formation : lecture. Admins : CRUD.
-- ============================================
CREATE POLICY "quizzes_select_enrolled"
    ON public.quizzes FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.formation_enrollments fe ON fe.formation_id = m.formation_id
            WHERE m.id = quizzes.module_id AND fe.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "quizzes_admin_all"
    ON public.quizzes FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "quiz_questions_select"
    ON public.quiz_questions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            JOIN public.modules m ON m.id = q.module_id
            JOIN public.formation_enrollments fe ON fe.formation_id = m.formation_id
            WHERE q.id = quiz_questions.quiz_id AND fe.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "quiz_questions_admin_all"
    ON public.quiz_questions FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "quiz_options_select"
    ON public.quiz_options FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_questions qq
            JOIN public.quizzes q ON q.id = qq.quiz_id
            JOIN public.modules m ON m.id = q.module_id
            JOIN public.formation_enrollments fe ON fe.formation_id = m.formation_id
            WHERE qq.id = quiz_options.question_id AND fe.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "quiz_options_admin_all"
    ON public.quiz_options FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 9. QUIZ ATTEMPTS
-- Users voient les leurs. Admins/mods voient tout.
-- ============================================
CREATE POLICY "quiz_attempts_select_own"
    ON public.quiz_attempts FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_mod());

CREATE POLICY "quiz_attempts_insert_own"
    ON public.quiz_attempts FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 10. CERTIFICATES
-- Users voient les leurs. Admins gèrent tout.
-- ============================================
CREATE POLICY "certificates_select_own"
    ON public.certificates FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_mod());

CREATE POLICY "certificates_admin_all"
    ON public.certificates FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 11. COMMUNITY POSTS
-- Prospects : lecture seule. Membres+ : créer/modifier/supprimer les leurs.
-- Mods/admins : supprimer n'importe quel post.
-- ============================================
CREATE POLICY "posts_select_all"
    ON public.posts FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "posts_insert_members"
    ON public.posts FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('member', 'moderator', 'admin')
        )
    );

CREATE POLICY "posts_update_own"
    ON public.posts FOR UPDATE TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "posts_delete_own_or_mod"
    ON public.posts FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR public.is_admin_or_mod());

-- POST LIKES
CREATE POLICY "post_likes_select"
    ON public.post_likes FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "post_likes_insert_own"
    ON public.post_likes FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_likes_delete_own"
    ON public.post_likes FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- COMMENTS
CREATE POLICY "comments_select"
    ON public.comments FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "comments_insert_members"
    ON public.comments FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('member', 'moderator', 'admin')
        )
    );

CREATE POLICY "comments_update_own"
    ON public.comments FOR UPDATE TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "comments_delete_own_or_mod"
    ON public.comments FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR public.is_admin_or_mod());

-- COMMENT LIKES
CREATE POLICY "comment_likes_select"
    ON public.comment_likes FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "comment_likes_insert_own"
    ON public.comment_likes FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "comment_likes_delete_own"
    ON public.comment_likes FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- 12. CHAT (channels, channel_members, messages)
-- Channels publics : visibles par tous.
-- Messages : lecture/écriture pour les membres du channel.
-- Admins : CRUD complet.
-- ============================================
CREATE POLICY "channels_select_public"
    ON public.channels FOR SELECT TO authenticated
    USING (
        type = 'public'
        OR EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = channels.id
              AND channel_members.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "channels_insert_dm"
    ON public.channels FOR INSERT TO authenticated
    WITH CHECK (
        (type = 'dm' AND created_by = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "channels_admin_all"
    ON public.channels FOR ALL TO authenticated
    USING (public.is_admin());

-- Channel members
CREATE POLICY "channel_members_select"
    ON public.channel_members FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "channel_members_insert_self"
    ON public.channel_members FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "channel_members_update_own"
    ON public.channel_members FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "channel_members_delete_own_or_admin"
    ON public.channel_members FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- Messages
CREATE POLICY "messages_select_channel_member"
    ON public.messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = messages.channel_id
              AND channel_members.user_id = auth.uid()
        )
        OR public.is_admin_or_mod()
    );

CREATE POLICY "messages_insert_channel_member"
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = messages.channel_id
              AND channel_members.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_update_own"
    ON public.messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid());

CREATE POLICY "messages_delete_own_or_mod"
    ON public.messages FOR DELETE TO authenticated
    USING (sender_id = auth.uid() OR public.is_admin_or_mod());

-- ============================================
-- 13. SESSIONS / SESSION PARTICIPANTS
-- Tous les authentifiés voient les sessions.
-- Admins/mods gèrent. Users s'inscrivent/désinscrivent.
-- ============================================
CREATE POLICY "sessions_select_all"
    ON public.sessions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "sessions_admin_all"
    ON public.sessions FOR ALL TO authenticated
    USING (public.is_admin_or_mod());

CREATE POLICY "session_participants_select"
    ON public.session_participants FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "session_participants_insert_self"
    ON public.session_participants FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_participants_delete_self"
    ON public.session_participants FOR DELETE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "session_participants_admin_all"
    ON public.session_participants FOR ALL TO authenticated
    USING (public.is_admin_or_mod());

-- ============================================
-- 14. CRM (notes, tags, user_tags)
-- Admins/mods uniquement.
-- ============================================
CREATE POLICY "crm_notes_admin_mod"
    ON public.crm_notes FOR ALL TO authenticated
    USING (public.is_admin_or_mod());

CREATE POLICY "tags_select_admin_mod"
    ON public.tags FOR SELECT TO authenticated
    USING (public.is_admin_or_mod());

CREATE POLICY "tags_manage_admin"
    ON public.tags FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "user_tags_select_admin_mod"
    ON public.user_tags FOR SELECT TO authenticated
    USING (public.is_admin_or_mod());

CREATE POLICY "user_tags_manage_admin"
    ON public.user_tags FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 15. NOTIFICATIONS
-- Chaque user voit/modifie/supprime les siennes.
-- ============================================
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================
-- 16. BOOKING SYSTEM
-- Pages/dispo/exceptions : anon + authenticated en lecture.
-- Bookings : anon + authenticated en création. Admins/mods gèrent.
-- ============================================
CREATE POLICY "booking_pages_select_active_anon"
    ON public.booking_pages FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "booking_pages_select_active_auth"
    ON public.booking_pages FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin_or_mod());

CREATE POLICY "booking_pages_admin_all"
    ON public.booking_pages FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "booking_availability_select_anon"
    ON public.booking_availability FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "booking_availability_select_auth"
    ON public.booking_availability FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "booking_availability_admin_all"
    ON public.booking_availability FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "booking_exceptions_select_anon"
    ON public.booking_exceptions FOR SELECT TO anon
    USING (true);

CREATE POLICY "booking_exceptions_select_auth"
    ON public.booking_exceptions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "booking_exceptions_admin_all"
    ON public.booking_exceptions FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "bookings_insert_anon"
    ON public.bookings FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "bookings_insert_auth"
    ON public.bookings FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "bookings_select_admin_mod"
    ON public.bookings FOR SELECT TO authenticated
    USING (public.is_admin_or_mod());

CREATE POLICY "bookings_admin_all"
    ON public.bookings FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 17. LANDING PAGES
-- Anon + authenticated voient les pages actives.
-- Admins gèrent.
-- ============================================
CREATE POLICY "landing_pages_select_active_anon"
    ON public.landing_pages FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "landing_pages_select_active_auth"
    ON public.landing_pages FOR SELECT TO authenticated
    USING (is_active = true OR public.is_admin_or_mod());

CREATE POLICY "landing_pages_admin_all"
    ON public.landing_pages FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 18. AI KNOWLEDGE BASE
-- Documents/chunks : membres+ en lecture (si ready). Admins gèrent.
-- Conversations/messages : chaque user gère les siennes.
-- ============================================
CREATE POLICY "ai_documents_select_members"
    ON public.ai_documents FOR SELECT TO authenticated
    USING (
        (status = 'ready' AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('member', 'moderator', 'admin')
        ))
        OR public.is_admin_or_mod()
    );

CREATE POLICY "ai_documents_admin_all"
    ON public.ai_documents FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "ai_chunks_select_members"
    ON public.ai_document_chunks FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_documents ad
            WHERE ad.id = ai_document_chunks.document_id AND ad.status = 'ready'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('member', 'moderator', 'admin')
        )
    );

CREATE POLICY "ai_chunks_admin_all"
    ON public.ai_document_chunks FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "ai_conversations_own"
    ON public.ai_conversations FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "ai_messages_select_own"
    ON public.ai_messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
              AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "ai_messages_insert_own"
    ON public.ai_messages FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
              AND ai_conversations.user_id = auth.uid()
        )
    );

-- ============================================
-- 19. STRIPE / PAYMENTS
-- Users voient les leurs. Admins gèrent tout.
-- ============================================
CREATE POLICY "stripe_customers_select_own"
    ON public.stripe_customers FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "stripe_customers_admin_all"
    ON public.stripe_customers FOR ALL TO authenticated
    USING (public.is_admin());

CREATE POLICY "payments_select_own"
    ON public.payments FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments_admin_all"
    ON public.payments FOR ALL TO authenticated
    USING (public.is_admin());

-- ============================================
-- 20. PLATFORM SETTINGS
-- Admins uniquement.
-- ============================================
CREATE POLICY "platform_settings_select_admin"
    ON public.platform_settings FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "platform_settings_admin_all"
    ON public.platform_settings FOR ALL TO authenticated
    USING (public.is_admin());
