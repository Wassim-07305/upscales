-- Fix: quiz_questions missing question_type and explanation columns
-- Fix: quizzes missing time_limit_minutes column
-- Fix: quiz_options missing image_url column
-- These columns are referenced in the code but were never added to the DB.

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'free_response')),
  ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT NULL;

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

ALTER TABLE public.quiz_options
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
