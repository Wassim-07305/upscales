-- Fix: closer_calls.closer_id FK pointed to auth.users instead of public.profiles
-- This caused PostgREST to return 400 on any query joining profiles via this FK.
ALTER TABLE public.closer_calls DROP CONSTRAINT closer_calls_closer_id_fkey;

ALTER TABLE public.closer_calls
  ADD CONSTRAINT closer_calls_closer_id_fkey
  FOREIGN KEY (closer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
