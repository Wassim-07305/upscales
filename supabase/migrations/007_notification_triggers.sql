-- Automatic notification triggers
-- Creates notifications when: new comment on post, new like on post, session registration, certificate earned

-- Helper function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Notify post author when someone comments on their post
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_commenter_name TEXT;
BEGIN
    -- Get the post author
    SELECT author_id INTO v_post_author_id FROM posts WHERE id = NEW.post_id;
    -- Get commenter name
    SELECT full_name INTO v_commenter_name FROM profiles WHERE id = NEW.author_id;

    -- Don't notify if commenting on own post
    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.author_id THEN
        PERFORM create_notification(
            v_post_author_id,
            'post',
            'Nouveau commentaire',
            COALESCE(v_commenter_name, 'Quelqu''un') || ' a commenté votre post',
            '/community/' || NEW.post_id
        );
    END IF;

    -- If replying to a comment, also notify the parent comment author
    IF NEW.parent_id IS NOT NULL THEN
        DECLARE
            v_parent_author_id UUID;
        BEGIN
            SELECT author_id INTO v_parent_author_id FROM comments WHERE id = NEW.parent_id;
            IF v_parent_author_id IS NOT NULL AND v_parent_author_id != NEW.author_id AND v_parent_author_id != v_post_author_id THEN
                PERFORM create_notification(
                    v_parent_author_id,
                    'post',
                    'Nouvelle réponse',
                    COALESCE(v_commenter_name, 'Quelqu''un') || ' a répondu à votre commentaire',
                    '/community/' || NEW.post_id
                );
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 2. Notify post author when someone likes their post
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_liker_name TEXT;
BEGIN
    SELECT author_id INTO v_post_author_id FROM posts WHERE id = NEW.post_id;
    SELECT full_name INTO v_liker_name FROM profiles WHERE id = NEW.user_id;

    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
        PERFORM create_notification(
            v_post_author_id,
            'post',
            'Nouveau like',
            COALESCE(v_liker_name, 'Quelqu''un') || ' a aimé votre post',
            '/community/' || NEW.post_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like_notify AFTER INSERT ON post_likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_post_like();

-- 3. Notify when user enrolls in a formation (welcome notification)
CREATE OR REPLACE FUNCTION notify_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_formation_title TEXT;
BEGIN
    SELECT title INTO v_formation_title FROM formations WHERE id = NEW.formation_id;

    PERFORM create_notification(
        NEW.user_id,
        'formation',
        'Inscription confirmée',
        'Vous êtes inscrit à "' || COALESCE(v_formation_title, 'une formation') || '"',
        '/formations/' || NEW.formation_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_enrollment_notify AFTER INSERT ON formation_enrollments
    FOR EACH ROW EXECUTE FUNCTION notify_on_enrollment();

-- 4. Notify when a certificate is issued
CREATE OR REPLACE FUNCTION notify_on_certificate()
RETURNS TRIGGER AS $$
DECLARE
    v_formation_title TEXT;
BEGIN
    SELECT title INTO v_formation_title FROM formations WHERE id = NEW.formation_id;

    PERFORM create_notification(
        NEW.user_id,
        'certificate',
        'Certificat obtenu !',
        'Félicitations ! Votre certificat pour "' || COALESCE(v_formation_title, 'une formation') || '" est disponible',
        '/certificates'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_certificate_notify AFTER INSERT ON certificates
    FOR EACH ROW EXECUTE FUNCTION notify_on_certificate();

-- 5. Notify when a session is about to start (registered participants)
-- This would typically be handled by a cron job, but we notify on registration
CREATE OR REPLACE FUNCTION notify_on_session_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_session_title TEXT;
    v_session_start TIMESTAMPTZ;
BEGIN
    SELECT title, start_time INTO v_session_title, v_session_start FROM sessions WHERE id = NEW.session_id;

    PERFORM create_notification(
        NEW.user_id,
        'session',
        'Session confirmée',
        'Vous êtes inscrit à la session "' || COALESCE(v_session_title, '') || '"',
        '/calendar'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_session_registration_notify AFTER INSERT ON session_participants
    FOR EACH ROW EXECUTE FUNCTION notify_on_session_registration();
