-- Fix: day_of_week calculation in get_available_slots
-- ISODOW returns 1=Monday..7=Sunday, minus 1 gives 0=Monday..6=Sunday (ISO convention)
-- But frontend uses JavaScript convention: 0=Sunday, 1=Monday..6=Saturday
-- DOW returns exactly the JavaScript convention: 0=Sunday, 1=Monday..6=Saturday

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
    -- Fix: use DOW (0=Sunday..6=Saturday) to match JavaScript Date.getDay() convention
    _day_of_week := EXTRACT(DOW FROM _date)::integer;

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
