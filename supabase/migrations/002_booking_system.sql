-- ============================================
-- UPSCALE — Système de Booking
-- Migration 002
-- ============================================

-- ============================================
-- ENUM
-- ============================================
CREATE TYPE booking_status AS ENUM ('confirme', 'annule', 'realise', 'no_show');

-- ============================================
-- TABLE: booking_pages
-- ============================================
CREATE TABLE booking_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    title TEXT,
    description TEXT,
    brand_color TEXT DEFAULT '#C6FF00',
    logo_url TEXT,
    slot_duration INTEGER DEFAULT 30 CHECK (slot_duration IN (15, 30, 45, 60)),
    buffer_minutes INTEGER DEFAULT 0 CHECK (buffer_minutes >= 0 AND buffer_minutes <= 60),
    min_notice_hours INTEGER DEFAULT 24 CHECK (min_notice_hours >= 1 AND min_notice_hours <= 168),
    max_days_ahead INTEGER DEFAULT 14 CHECK (max_days_ahead >= 1 AND max_days_ahead <= 90),
    qualification_fields JSONB DEFAULT '[]'::jsonb,
    timezone TEXT DEFAULT 'Europe/Paris',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: booking_availability (créneaux hebdo)
-- ============================================
CREATE TABLE booking_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_page_id, day_of_week, start_time),
    CHECK (end_time > start_time)
);

-- ============================================
-- TABLE: booking_exceptions (jours bloqués)
-- ============================================
CREATE TABLE booking_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'blocked' CHECK (type IN ('blocked', 'override')),
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: bookings (réservations)
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
    prospect_name TEXT NOT NULL,
    prospect_email TEXT NOT NULL,
    prospect_phone TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'confirme',
    qualification_answers JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_booking_pages_slug ON booking_pages(slug);
CREATE INDEX idx_booking_pages_active ON booking_pages(is_active);
CREATE INDEX idx_booking_availability_page ON booking_availability(booking_page_id);
CREATE INDEX idx_booking_exceptions_page_date ON booking_exceptions(booking_page_id, exception_date);
CREATE INDEX idx_bookings_page ON bookings(booking_page_id);
CREATE INDEX idx_bookings_date ON bookings(date, start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_email ON bookings(prospect_email);

-- ============================================
-- TRIGGERS: updated_at
-- ============================================
CREATE TRIGGER booking_pages_updated_at
    BEFORE UPDATE ON booking_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- booking_pages
CREATE POLICY "Admins manage booking pages" ON booking_pages
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Public view active booking pages" ON booking_pages
    FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated view active booking pages" ON booking_pages
    FOR SELECT TO authenticated USING (is_active = true);

-- booking_availability
CREATE POLICY "Admins manage availability" ON booking_availability
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Public view active availability" ON booking_availability
    FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated view active availability" ON booking_availability
    FOR SELECT TO authenticated USING (is_active = true);

-- booking_exceptions
CREATE POLICY "Admins manage exceptions" ON booking_exceptions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Public view exceptions" ON booking_exceptions
    FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated view exceptions" ON booking_exceptions
    FOR SELECT TO authenticated USING (true);

-- bookings
CREATE POLICY "Admins manage bookings" ON bookings
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Public create bookings" ON bookings
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated create bookings" ON bookings
    FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- RPC: get_booking_page_by_slug
-- ============================================
CREATE OR REPLACE FUNCTION public.get_booking_page_by_slug(_slug TEXT)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT json_build_object(
        'id', bp.id,
        'slug', bp.slug,
        'title', bp.title,
        'description', bp.description,
        'brand_color', bp.brand_color,
        'logo_url', bp.logo_url,
        'slot_duration', bp.slot_duration,
        'buffer_minutes', bp.buffer_minutes,
        'min_notice_hours', bp.min_notice_hours,
        'max_days_ahead', bp.max_days_ahead,
        'qualification_fields', bp.qualification_fields,
        'timezone', bp.timezone
    )
    FROM public.booking_pages bp
    WHERE bp.slug = _slug AND bp.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_page_by_slug(TEXT) TO anon, authenticated;

-- ============================================
-- RPC: get_available_slots
-- ============================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
    _slug TEXT,
    _date DATE
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    _page RECORD;
    _slots json;
    _day_of_week INTEGER;
    _min_ts TIMESTAMPTZ;
BEGIN
    SELECT * INTO _page FROM public.booking_pages WHERE slug = _slug AND is_active = true;
    IF NOT FOUND THEN
        RETURN '[]'::json;
    END IF;

    IF _date < CURRENT_DATE THEN
        RETURN '[]'::json;
    END IF;

    IF _date > CURRENT_DATE + (_page.max_days_ahead || ' days')::interval THEN
        RETURN '[]'::json;
    END IF;

    _min_ts := (NOW() AT TIME ZONE _page.timezone) + (_page.min_notice_hours || ' hours')::interval;
    _day_of_week := EXTRACT(ISODOW FROM _date)::integer - 1;

    WITH availability AS (
        SELECT ba.start_time, ba.end_time
        FROM public.booking_availability ba
        WHERE ba.booking_page_id = _page.id
            AND ba.day_of_week = _day_of_week
            AND ba.is_active = true
            AND NOT EXISTS (
                SELECT 1 FROM public.booking_exceptions be
                WHERE be.booking_page_id = _page.id
                    AND be.exception_date = _date
                    AND be.type = 'blocked'
            )
    ),
    time_slots AS (
        SELECT
            gs::time AS slot_start,
            (gs + (_page.slot_duration || ' minutes')::interval)::time AS slot_end
        FROM availability a,
        LATERAL generate_series(
            _date + a.start_time,
            _date + a.end_time - (_page.slot_duration || ' minutes')::interval,
            ((_page.slot_duration + _page.buffer_minutes) || ' minutes')::interval
        ) AS gs
    ),
    available AS (
        SELECT ts.slot_start AS start_time, ts.slot_end AS end_time
        FROM time_slots ts
        WHERE NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.booking_page_id = _page.id
                AND b.date = _date
                AND b.status IN ('confirme', 'realise')
                AND b.start_time < ts.slot_end
                AND b.end_time > ts.slot_start
        )
        AND (_date + ts.slot_start) >= _min_ts
    )
    SELECT COALESCE(json_agg(
        json_build_object(
            'start_time', to_char(start_time, 'HH24:MI'),
            'end_time', to_char(end_time, 'HH24:MI')
        ) ORDER BY start_time
    ), '[]'::json)
    INTO _slots
    FROM available;

    RETURN _slots;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(TEXT, DATE) TO anon, authenticated;

-- ============================================
-- RPC: create_booking
-- ============================================
CREATE OR REPLACE FUNCTION public.create_booking(
    _slug TEXT,
    _date DATE,
    _start_time TIME,
    _prospect_name TEXT,
    _prospect_email TEXT,
    _prospect_phone TEXT DEFAULT NULL,
    _qualification_answers JSONB DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _page RECORD;
    _end_time TIME;
    _booking_id UUID;
BEGIN
    SELECT * INTO _page FROM public.booking_pages WHERE slug = _slug AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Page de reservation introuvable';
    END IF;

    _end_time := _start_time + (_page.slot_duration || ' minutes')::interval;

    -- Rate limiting: max 3/h/email
    IF (SELECT COUNT(*) FROM public.bookings
        WHERE prospect_email = _prospect_email
            AND created_at > now() - interval '1 hour') >= 3 THEN
        RAISE EXCEPTION 'Trop de reservations. Veuillez reessayer plus tard.';
    END IF;

    -- Conflit
    IF EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.booking_page_id = _page.id
            AND b.date = _date
            AND b.status IN ('confirme', 'realise')
            AND b.start_time < _end_time
            AND b.end_time > _start_time
    ) THEN
        RAISE EXCEPTION 'Ce creneau n''est plus disponible';
    END IF;

    INSERT INTO public.bookings (
        booking_page_id, prospect_name, prospect_email, prospect_phone,
        date, start_time, end_time, status, qualification_answers
    ) VALUES (
        _page.id, _prospect_name, _prospect_email, _prospect_phone,
        _date, _start_time, _end_time, 'confirme', _qualification_answers
    ) RETURNING id INTO _booking_id;

    -- Notifier les admins
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT p.id, 'system',
        'Nouvelle reservation',
        _prospect_name || ' a reserve le ' || to_char(_date, 'DD/MM/YYYY') || ' a ' || to_char(_start_time, 'HH24:MI'),
        '/admin/booking'
    FROM public.profiles p
    WHERE p.role = 'admin';

    RETURN json_build_object(
        'booking_id', _booking_id,
        'date', _date,
        'start_time', to_char(_start_time, 'HH24:MI'),
        'end_time', to_char(_end_time, 'HH24:MI'),
        'prospect_name', _prospect_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(TEXT, DATE, TIME, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
