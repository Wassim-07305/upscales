-- Add question_type and explanation to quiz_questions
-- Supports: multiple_choice (default), true_false, free_response

ALTER TABLE quiz_questions
    ADD COLUMN question_type TEXT NOT NULL DEFAULT 'multiple_choice'
        CHECK (question_type IN ('multiple_choice', 'true_false', 'free_response')),
    ADD COLUMN explanation TEXT;

-- For true_false questions, we store the correct answer (true/false) in quiz_options
-- For free_response, no options needed - answers stored as text in quiz_attempts.answers
