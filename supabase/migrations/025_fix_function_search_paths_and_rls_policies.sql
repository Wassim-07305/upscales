-- Fix security advisors: function search_path + RLS policies
-- Applied: 2026-03-23

-- =============================================================
-- 1. Fix function search_path (3 functions)
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

-- =============================================================
-- 2. Tighten RLS policies
-- =============================================================

-- bookings: require valid fields on INSERT
DROP POLICY IF EXISTS "Authenticated create bookings" ON public.bookings;
CREATE POLICY "Authenticated create bookings" ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        prospect_email IS NOT NULL
        AND prospect_name IS NOT NULL
        AND booking_page_id IS NOT NULL
    );

DROP POLICY IF EXISTS "Public create bookings" ON public.bookings;
CREATE POLICY "Public create bookings" ON public.bookings
    FOR INSERT TO anon
    WITH CHECK (
        prospect_email IS NOT NULL
        AND prospect_name IS NOT NULL
        AND booking_page_id IS NOT NULL
    );

-- certificates: only admins can create
DROP POLICY IF EXISTS "System can create certificates" ON public.certificates;
CREATE POLICY "Admins can create certificates" ON public.certificates
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'::user_role
        )
    );

-- notifications: self or admin only
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'::user_role
        )
    );
