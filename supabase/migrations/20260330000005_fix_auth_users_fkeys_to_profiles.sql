-- Fix: 3 FKs were pointing to auth.users instead of public.profiles
-- PostgREST cannot resolve joins on auth.users (inaccessible schema) → 400 errors
-- Affected queries: call_calendar, closer_calls (already fixed in 000004), leads

ALTER TABLE public.call_calendar DROP CONSTRAINT call_calendar_assigned_to_fkey;
ALTER TABLE public.call_calendar
  ADD CONSTRAINT call_calendar_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.leads DROP CONSTRAINT leads_assigned_to_fkey;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
