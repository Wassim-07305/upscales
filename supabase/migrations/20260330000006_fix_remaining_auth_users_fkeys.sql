-- Fix: remaining FKs pointing to auth.users instead of public.profiles
-- PostgREST cannot resolve joins on auth.users → 400 errors

ALTER TABLE public.client_assignments DROP CONSTRAINT client_assignments_user_id_fkey;
ALTER TABLE public.client_assignments
  ADD CONSTRAINT client_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.exercise_submissions DROP CONSTRAINT exercise_submissions_user_id_fkey;
ALTER TABLE public.exercise_submissions
  ADD CONSTRAINT exercise_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
