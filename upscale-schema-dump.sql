--
-- PostgreSQL database dump
--

\restrict WTyFxhjGhRzrgMF17nZ4n637K0puHN0gZZ0KU4myJnQaF1rb9irGhjE8WyXqRtS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'coach',
    'team',
    'student',
    'setter',
    'closer',
    'client',
    'prospect',
    'sales'
);


--
-- Name: auto_provision_client(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_provision_client() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  general_id UUID;
BEGIN
  -- Seulement quand le role change vers 'client'
  IF NEW.role::text = 'client' AND (TG_OP = 'INSERT' OR OLD.role::text IS DISTINCT FROM 'client') THEN
    -- Trouver ou creer le canal General
    SELECT id INTO general_id FROM public.channels WHERE is_default = true LIMIT 1;

    IF general_id IS NULL THEN
      INSERT INTO public.channels (name, type, is_default, description)
      VALUES ('General', 'public', true, 'Canal general pour tous les membres')
      RETURNING id INTO general_id;
    END IF;

    -- Ajouter au canal General
    INSERT INTO public.channel_members (channel_id, profile_id, role)
    VALUES (general_id, NEW.id, 'member')
    ON CONFLICT (channel_id, profile_id) DO NOTHING;

    -- Message systeme de bienvenue
    INSERT INTO public.messages (channel_id, sender_id, content, content_type)
    VALUES (general_id, NEW.id, NEW.full_name || ' a rejoint Off Market !', 'system');

    -- Notification de bienvenue
    INSERT INTO public.notifications (recipient_id, type, title, body)
    VALUES (NEW.id, 'system', 'Bienvenue sur Off Market !', 'Ton espace est pret. Explore la messagerie, les formations et le feed.');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: award_xp(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_xp(p_profile_id uuid, p_action text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_xp         INTEGER;
  v_multiplier NUMERIC(3,2) := 1.00;
  v_final_xp   INTEGER;
BEGIN
  SELECT xp_amount INTO v_xp
  FROM xp_config
  WHERE action = p_action AND is_active = true;

  IF v_xp IS NULL THEN RETURN 0; END IF;

  BEGIN
    SELECT COALESCE(xp_multiplier, 1.00) INTO v_multiplier
    FROM streaks WHERE profile_id = p_profile_id;
  EXCEPTION WHEN undefined_table THEN
    v_multiplier := 1.00;
  END;
  IF v_multiplier IS NULL THEN v_multiplier := 1.00; END IF;

  v_final_xp := CEIL(v_xp * v_multiplier);

  INSERT INTO xp_transactions (profile_id, action, xp_amount, metadata)
  VALUES (
    p_profile_id,
    p_action,
    v_final_xp,
    p_metadata || jsonb_build_object('base_xp', v_xp, 'multiplier', v_multiplier)
  );

  BEGIN
    PERFORM record_activity(p_profile_id, p_action);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN v_final_xp;
END;
$$;


--
-- Name: delete_user_account(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_account(target_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _email TEXT;
BEGIN
  -- Get email before deleting profile
  SELECT email INTO _email FROM profiles WHERE id = target_user_id;

  -- Clean each table individually — skip if column/table doesn't exist
  BEGIN DELETE FROM channel_members WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM messages WHERE sender_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = target_user_id); EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM ai_conversations WHERE user_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM notifications WHERE recipient_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM journal_entries WHERE user_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM journal_entries WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM gamification_entries WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM form_submissions WHERE user_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM form_submissions WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM lesson_progress WHERE user_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM lesson_progress WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM onboarding_progress WHERE user_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM onboarding_progress WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM coaching_sessions WHERE client_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM coaching_sessions WHERE coach_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM coach_assignments WHERE client_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM coach_assignments WHERE coach_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM client_ai_memory WHERE client_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM contracts WHERE client_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM certificates WHERE student_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM crm_contacts WHERE assigned_to = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM crm_contacts WHERE created_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM call_calendar WHERE client_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM call_calendar WHERE assigned_to = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM commissions WHERE contractor_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM resources WHERE uploaded_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM feed_posts WHERE author_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM announcements WHERE author_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM quiz_submissions WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM student_details WHERE profile_id = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM user_invites WHERE email = _email; EXCEPTION WHEN others THEN NULL; END;
  BEGIN DELETE FROM message_templates WHERE created_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN UPDATE channels SET created_by = NULL WHERE created_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN UPDATE leads SET assigned_to = NULL WHERE assigned_to = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN UPDATE formations SET created_by = NULL WHERE created_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;
  BEGIN UPDATE courses SET created_by = NULL WHERE created_by = target_user_id; EXCEPTION WHEN others THEN NULL; END;

  -- Delete the profile
  DELETE FROM profiles WHERE id = target_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;


--
-- Name: fn_sync_flag_to_client_flags(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_flag_to_client_flags() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.flag IS DISTINCT FROM OLD.flag THEN
    INSERT INTO client_flags (client_id, flag)
    VALUES (NEW.profile_id, NEW.flag)
    ON CONFLICT (client_id) DO UPDATE SET flag = EXCLUDED.flag, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_sync_flag_to_student_details(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_flag_to_student_details() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE student_details
  SET flag = NEW.flag, updated_at = now()
  WHERE profile_id = NEW.client_id;
  RETURN NEW;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.invoice_number := 'OM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  invite_record RECORD;
  assigned_role TEXT;
BEGIN
  SELECT * INTO invite_record
  FROM user_invites
  WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    assigned_role := invite_record.role;
    UPDATE user_invites SET status = 'accepted', accepted_at = now()
    WHERE id = invite_record.id;
  ELSE
    assigned_role := 'prospect';
  END IF;

  INSERT INTO profiles (id, email, full_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role::user_role,
    CASE WHEN assigned_role IN ('client', 'prospect') THEN false ELSE true END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;


--
-- Name: handle_student_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_student_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.role = 'client' THEN
    INSERT INTO public.student_details (profile_id, tag)
    VALUES (NEW.id, 'new')
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: increment_download_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_download_count(resource_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE resources
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = resource_id;
END;
$$;


--
-- Name: is_channel_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_channel_member(p_channel_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = p_channel_id
      AND profile_id = auth.uid()
  );
$$;


--
-- Name: mark_channel_read(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_channel_read(p_channel_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update message_reads
  INSERT INTO message_reads (channel_id, user_id, last_read_at)
  VALUES (p_channel_id, auth.uid(), NOW())
  ON CONFLICT (channel_id, user_id)
  DO UPDATE SET last_read_at = NOW();

  -- UPSERT channel_members (admin peut ne pas etre membre d'un canal public)
  INSERT INTO channel_members (channel_id, profile_id, last_read_at, role)
  VALUES (p_channel_id, auth.uid(), NOW(), 'member')
  ON CONFLICT (channel_id, profile_id)
  DO UPDATE SET last_read_at = NOW();
END;
$$;


--
-- Name: match_coach_chunks(public.vector, uuid, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_coach_chunks(query_embedding public.vector, p_coach_id uuid, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 5) RETURNS TABLE(id uuid, content text, similarity double precision)
    LANGUAGE sql STABLE
    AS $$
  SELECT c.id, c.content, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM coach_ai_chunks c
  WHERE c.coach_id = p_coach_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;


--
-- Name: notify_certificate_issued(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_certificate_issued() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, type, title, body, data)
  VALUES (
    NEW.student_id,
    'badge',
    'Certificat obtenu !',
    'Felicitations ! Tu as obtenu le certificat pour "' || NEW.course_title || '"',
    jsonb_build_object('certificate_id', NEW.id, 'course_id', NEW.course_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


--
-- Name: notify_channel_members_on_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_channel_members_on_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    DECLARE
      channel_name TEXT;
      sender_name TEXT;
      member RECORD;
    BEGIN
      IF NEW.content_type = 'system' THEN
        RETURN NEW;
      END IF;

      SELECT name INTO channel_name FROM public.channels WHERE id = NEW.channel_id;
      SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

      FOR member IN
        SELECT profile_id FROM public.channel_members
        WHERE channel_id = NEW.channel_id AND profile_id != NEW.sender_id
      LOOP
        INSERT INTO public.notifications (recipient_id, type, title, body, data)
        VALUES (
          member.profile_id,
          'new_message',
          'Nouveau message',
          COALESCE(sender_name, 'Quelqu''un') || ' dans ' || COALESCE(channel_name, 'un canal'),
          jsonb_build_object('channel_id', NEW.channel_id, 'message_id', NEW.id)
        );
      END LOOP;
      RETURN NEW;
    END;
    $$;


--
-- Name: notify_feed_post(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_feed_post() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  author_name TEXT;
  member RECORD;
BEGIN
  SELECT full_name INTO author_name FROM public.profiles WHERE id = NEW.author_id;

  FOR member IN
    SELECT id FROM public.profiles WHERE id != NEW.author_id
  LOOP
    INSERT INTO public.notifications (recipient_id, type, title, body, data)
    VALUES (
      member.id,
      'feed',
      'Nouveau post',
      COALESCE(author_name, 'Quelqu''un') || ' a publie dans le feed',
      jsonb_build_object('post_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;


--
-- Name: record_activity(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_activity(p_profile_id uuid, p_action text DEFAULT 'login'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_today      DATE         := CURRENT_DATE;
  v_streak     RECORD;
  v_new_streak INTEGER;
  v_multiplier NUMERIC(3,2);
BEGIN
  INSERT INTO daily_activity (profile_id, activity_date, actions)
  VALUES (p_profile_id, v_today, jsonb_build_array(p_action))
  ON CONFLICT (profile_id, activity_date)
  DO UPDATE SET actions = daily_activity.actions || jsonb_build_array(p_action);

  INSERT INTO streaks (profile_id)
  VALUES (p_profile_id)
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT * INTO v_streak FROM streaks WHERE profile_id = p_profile_id FOR UPDATE;

  IF v_streak.last_activity_date = v_today THEN
    RETURN jsonb_build_object(
      'current_streak',   v_streak.current_streak,
      'longest_streak',   v_streak.longest_streak,
      'multiplier',       v_streak.xp_multiplier,
      'already_recorded', true
    );
  ELSIF v_streak.last_activity_date = v_today - 1 THEN
    v_new_streak := v_streak.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_multiplier := CASE
    WHEN v_new_streak >= 30 THEN 2.00
    WHEN v_new_streak >= 14 THEN 1.75
    WHEN v_new_streak >= 7  THEN 1.50
    WHEN v_new_streak >= 3  THEN 1.25
    ELSE 1.00
  END;

  UPDATE streaks SET
    current_streak     = v_new_streak,
    longest_streak     = GREATEST(v_streak.longest_streak, v_new_streak),
    last_activity_date = v_today,
    xp_multiplier      = v_multiplier,
    total_active_days  = v_streak.total_active_days + 1,
    updated_at         = now()
  WHERE profile_id = p_profile_id;

  RETURN jsonb_build_object(
    'current_streak',   v_new_streak,
    'longest_streak',   GREATEST(v_streak.longest_streak, v_new_streak),
    'multiplier',       v_multiplier,
    'streak_increased', true
  );
END;
$$;


--
-- Name: redeem_reward(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.redeem_reward(p_user_id uuid, p_reward_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  reward_row RECORD;
  user_xp INT;
BEGIN
  SELECT * INTO reward_row FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF reward_row IS NULL THEN
    RAISE EXCEPTION 'Recompense introuvable';
  END IF;

  IF reward_row.stock IS NOT NULL AND reward_row.stock <= 0 THEN
    RAISE EXCEPTION 'Recompense epuisee';
  END IF;

  SELECT COALESCE(SUM(xp_amount), 0) INTO user_xp FROM xp_transactions WHERE profile_id = p_user_id;

  IF user_xp < reward_row.cost_xp THEN
    RAISE EXCEPTION 'XP insuffisant (% disponible, % requis)', user_xp, reward_row.cost_xp;
  END IF;

  INSERT INTO xp_transactions (profile_id, xp_amount, action, metadata)
  VALUES (p_user_id, -reward_row.cost_xp, 'redeem_reward', jsonb_build_object('reward_id', p_reward_id, 'reward_title', reward_row.title));

  IF reward_row.stock IS NOT NULL THEN
    UPDATE rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  INSERT INTO reward_redemptions (user_id, reward_id, xp_spent, status)
  VALUES (p_user_id, p_reward_id, reward_row.cost_xp, 'pending');

  RETURN 'ok';
END;
$$;


--
-- Name: update_branding_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_branding_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_call_summaries_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_call_summaries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_channel_last_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_channel_last_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.channels SET last_message_at = NEW.created_at WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_post_comments_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_comments_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_post_likes_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_likes_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_student_lifetime_value(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_lifetime_value() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    UPDATE student_details
    SET lifetime_value = COALESCE(lifetime_value, 0) + NEW.amount
    WHERE profile_id = NEW.client_id;
  ELSIF OLD.status = 'paid' AND NEW.status <> 'paid' THEN
    UPDATE student_details
    SET lifetime_value = GREATEST(COALESCE(lifetime_value, 0) - OLD.amount, 0)
    WHERE profile_id = OLD.client_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_webhooks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_webhooks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: validate_invite_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_invite_code(code text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  invite RECORD;
BEGIN
  SELECT * INTO invite FROM public.user_invites
  WHERE invite_code = code AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false);
  END IF;

  RETURN json_build_object(
    'valid', true,
    'email', invite.email,
    'full_name', invite.full_name,
    'role', invite.role
  );
END;
$$;


--
-- Name: verify_user_password(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_user_password(password text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'extensions', 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND encrypted_password = crypt(password, encrypted_password)
  );
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    priority text DEFAULT 'medium'::text,
    is_dismissed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_insights_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT ai_insights_type_check CHECK ((type = ANY (ARRAY['student_risk'::text, 'engagement_drop'::text, 'content_suggestion'::text, 'revenue_insight'::text, 'weekly_summary'::text])))
);


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: ai_question_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_question_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    question text NOT NULL,
    answer text,
    was_escalated boolean DEFAULT false,
    was_helpful boolean,
    kb_entry_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_reports_type_check CHECK ((type = ANY (ARRAY['weekly_coaching'::text, 'monthly_performance'::text, 'client_risk'::text])))
);


--
-- Name: announcement_dismissals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcement_dismissals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    announcement_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    target_roles text[],
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT announcements_type_check CHECK ((type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'urgent'::text, 'update'::text])))
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    scopes text[] DEFAULT '{read}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    description text,
    is_secret boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    url text,
    type text,
    size integer,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: availability_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_id uuid NOT NULL,
    override_date date NOT NULL,
    is_blocked boolean DEFAULT true,
    start_time time without time zone,
    end_time time without time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    slot_duration_minutes integer DEFAULT 30 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT availability_slots_check CHECK ((start_time < end_time)),
    CONSTRAINT availability_slots_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: avatars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avatars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    category text NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    condition jsonb DEFAULT '{}'::jsonb,
    xp_reward integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT badges_category_check CHECK ((category = ANY (ARRAY['learning'::text, 'engagement'::text, 'social'::text, 'streak'::text, 'milestone'::text, 'onboarding'::text]))),
    CONSTRAINT badges_rarity_check CHECK ((rarity = ANY (ARRAY['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text])))
);


--
-- Name: booking_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_page_id uuid,
    day_of_week integer NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT booking_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: booking_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_page_id uuid,
    exception_date date NOT NULL,
    type text DEFAULT 'blocked'::text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_page_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text DEFAULT 'Prendre rendez-vous'::text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    brand_color text DEFAULT '#AF0000'::text,
    slot_duration integer DEFAULT 30,
    buffer_minutes integer DEFAULT 10,
    min_notice_hours integer DEFAULT 24,
    max_days_ahead integer DEFAULT 30,
    qualification_fields jsonb DEFAULT '[]'::jsonb,
    timezone text DEFAULT 'Europe/Paris'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_page_id uuid,
    prospect_name text NOT NULL,
    prospect_email text,
    prospect_phone text,
    date date NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    status text DEFAULT 'confirmed'::text,
    qualification_answers jsonb DEFAULT '{}'::jsonb,
    google_event_id text,
    meet_link text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    call_result text,
    objections text,
    follow_up_notes text,
    follow_up_date timestamp with time zone,
    CONSTRAINT bookings_call_result_check CHECK ((call_result = ANY (ARRAY['vente_réalisée'::text, 'non_réalisée'::text, 'suivi_prévu'::text, 'no_show'::text])))
);


--
-- Name: branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text,
    value text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: branding_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branding_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content_html text,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: branding_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branding_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_name text DEFAULT 'Off Market'::text NOT NULL,
    logo_url text,
    favicon_url text,
    primary_color text DEFAULT '#c41e3a'::text NOT NULL,
    primary_color_dark text DEFAULT '#e8374e'::text NOT NULL,
    accent_color text DEFAULT '#f97316'::text NOT NULL,
    accent_color_dark text DEFAULT '#fb923c'::text NOT NULL,
    font_family text DEFAULT 'Inter'::text NOT NULL,
    border_radius text DEFAULT '12'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone,
    event_type text DEFAULT 'event'::text NOT NULL,
    color text DEFAULT '#8B5CF6'::text NOT NULL,
    attendees uuid[] DEFAULT '{}'::uuid[],
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: call_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_calendar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    assigned_to uuid NOT NULL,
    title text NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    call_type text DEFAULT 'manuel'::text NOT NULL,
    status text DEFAULT 'planifie'::text NOT NULL,
    link text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    room_status text DEFAULT 'idle'::text NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    actual_duration_seconds integer,
    reschedule_reason text,
    original_date date,
    original_time time without time zone,
    satisfaction_rating integer,
    CONSTRAINT call_calendar_call_type_check CHECK ((call_type = ANY (ARRAY['manuel'::text, 'iclosed'::text, 'calendly'::text, 'booking'::text, 'autre'::text, 'one_on_one'::text, 'live'::text]))),
    CONSTRAINT call_calendar_room_status_check CHECK ((room_status = ANY (ARRAY['idle'::text, 'waiting'::text, 'active'::text, 'ended'::text]))),
    CONSTRAINT call_calendar_satisfaction_rating_check CHECK (((satisfaction_rating >= 1) AND (satisfaction_rating <= 5))),
    CONSTRAINT call_calendar_status_check CHECK ((status = ANY (ARRAY['planifie'::text, 'realise'::text, 'no_show'::text, 'annule'::text, 'reporte'::text])))
);


--
-- Name: call_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid,
    type text,
    title text,
    content text,
    url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    content_html text,
    content_markdown text,
    generated_by text DEFAULT 'ai'::text,
    model text
);


--
-- Name: call_note_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_note_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_by uuid,
    is_shared boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


--
-- Name: call_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    author_id uuid NOT NULL,
    summary text,
    client_mood text,
    outcome text,
    next_steps text,
    action_items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT call_notes_client_mood_check CHECK ((client_mood = ANY (ARRAY['tres_positif'::text, 'positif'::text, 'neutre'::text, 'negatif'::text, 'tres_negatif'::text]))),
    CONSTRAINT call_notes_outcome_check CHECK ((outcome = ANY (ARRAY['interested'::text, 'follow_up'::text, 'not_interested'::text, 'closed'::text, 'no_show'::text])))
);


--
-- Name: call_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid,
    recording_url text,
    duration integer,
    size integer,
    created_at timestamp with time zone DEFAULT now(),
    recorded_by uuid,
    storage_path text,
    duration_seconds integer,
    file_size_bytes bigint,
    mime_type text DEFAULT 'video/webm'::text
);


--
-- Name: call_session_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_session_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text DEFAULT ''::text,
    action_items jsonb DEFAULT '[]'::jsonb,
    is_shared_with_client boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: call_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    sections jsonb DEFAULT '{}'::jsonb NOT NULL,
    model text DEFAULT 'claude-sonnet-4-5-20250514'::text NOT NULL,
    tokens_used integer,
    generation_time_ms integer,
    sources jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: call_transcripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_transcripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    content jsonb DEFAULT '[]'::jsonb NOT NULL,
    language text DEFAULT 'fr-FR'::text NOT NULL,
    duration_seconds integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: certificate_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    certificate_number text NOT NULL,
    issued_at timestamp with time zone DEFAULT now(),
    course_title text NOT NULL,
    student_name text NOT NULL,
    total_lessons integer DEFAULT 0 NOT NULL,
    total_modules integer DEFAULT 0 NOT NULL,
    quiz_average numeric(5,2),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    certificate_number text,
    total_lessons integer DEFAULT 0,
    total_modules integer DEFAULT 0,
    quiz_average numeric(5,2),
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    course_title text,
    student_name text
);


--
-- Name: challenge_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenge_id uuid,
    user_id uuid,
    content text,
    proof_url text,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    verification_source text,
    metric_type text,
    metric_value numeric,
    review_note text,
    review_status text,
    CONSTRAINT challenge_entries_review_status_check CHECK (((review_status IS NULL) OR (review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))))
);


--
-- Name: challenge_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenge_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    progress numeric(10,2) DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    challenge_type text NOT NULL,
    condition jsonb DEFAULT '{}'::jsonb,
    xp_reward integer DEFAULT 0,
    badge_reward uuid,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'community'::text])))
);


--
-- Name: channel_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role text DEFAULT 'member'::text,
    last_read_at timestamp with time zone DEFAULT now(),
    notifications_muted boolean DEFAULT false,
    joined_at timestamp with time zone DEFAULT now(),
    is_pinned boolean DEFAULT false NOT NULL,
    CONSTRAINT channel_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text])))
);


--
-- Name: channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT 'public'::text NOT NULL,
    created_by uuid,
    is_archived boolean DEFAULT false,
    is_default boolean DEFAULT false,
    avatar_url text,
    last_message_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    write_mode text DEFAULT 'all'::text,
    archived_at timestamp with time zone,
    archived_by uuid,
    CONSTRAINT channels_type_check CHECK ((type = ANY (ARRAY['public'::text, 'private'::text, 'dm'::text, 'direct'::text, 'group'::text])))
);


--
-- Name: checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    mood integer,
    energy integer,
    revenue numeric(10,2) DEFAULT 0,
    prospection_count integer DEFAULT 0,
    win text,
    blocker text,
    goal_next_week text,
    gratitudes text[] DEFAULT '{}'::text[],
    daily_goals text[] DEFAULT '{}'::text[],
    notes text,
    coach_feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkins_energy_check CHECK (((energy >= 1) AND (energy <= 5))),
    CONSTRAINT checkins_mood_check CHECK (((mood >= 1) AND (mood <= 5)))
);


--
-- Name: client_ai_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_ai_memory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    summary text DEFAULT ''::text NOT NULL,
    key_facts jsonb DEFAULT '[]'::jsonb,
    last_topics jsonb DEFAULT '[]'::jsonb,
    conversation_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    user_id uuid,
    role text DEFAULT 'coach'::text,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text
);


--
-- Name: client_flag_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_flag_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    previous_flag text,
    new_flag text,
    reason text,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    flag text DEFAULT 'green'::text NOT NULL,
    reason text,
    changed_by uuid,
    notified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_flags_flag_check CHECK ((flag = ANY (ARRAY['green'::text, 'yellow'::text, 'orange'::text, 'red'::text])))
);


--
-- Name: client_roadmaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_roadmaps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    generated_from text DEFAULT 'manual'::text NOT NULL,
    source_call_id uuid,
    milestones_snapshot jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_roadmaps_generated_from_check CHECK ((generated_from = ANY (ARRAY['kickoff_call'::text, 'manual'::text, 'ai_suggestion'::text])))
);


--
-- Name: crm_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    company text,
    source text,
    stage text DEFAULT 'prospect'::text NOT NULL,
    assigned_to uuid,
    estimated_value numeric(12,2) DEFAULT 0,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    last_contact_at timestamp with time zone,
    converted_profile_id uuid,
    sort_order integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lead_score integer DEFAULT 0,
    last_interaction_at timestamp with time zone,
    interaction_count integer DEFAULT 0,
    pipeline_stage text GENERATED ALWAYS AS (stage) STORED,
    closer_stage text,
    closer_id uuid,
    returned_by_closer boolean DEFAULT false,
    enrichment_data jsonb,
    enrichment_status text,
    last_enriched_at timestamp with time zone,
    qualification_score integer DEFAULT 0,
    revenue_range text,
    goals text,
    captured_at timestamp with time zone,
    lost_reason text,
    linkedin_url text,
    instagram_url text,
    tiktok_url text,
    facebook_url text,
    website_url text,
    youtube_url text,
    CONSTRAINT crm_contacts_closer_stage_check CHECK ((closer_stage = ANY (ARRAY['a_appeler'::text, 'en_negociation'::text, 'close'::text, 'perdu'::text]))),
    CONSTRAINT crm_contacts_lead_score_check CHECK (((lead_score >= 0) AND (lead_score <= 100))),
    CONSTRAINT crm_contacts_stage_check CHECK ((stage = ANY (ARRAY['prospect'::text, 'qualifie'::text, 'proposition'::text, 'closing'::text, 'client'::text, 'perdu'::text])))
);


--
-- Name: clients; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.clients AS
 SELECT id,
    full_name,
    email,
    phone,
    company,
    source,
    stage,
    assigned_to,
    estimated_value,
    notes,
    tags,
    last_contact_at,
    converted_profile_id,
    sort_order,
    created_by,
    created_at,
    updated_at,
    lead_score,
    last_interaction_at,
    interaction_count
   FROM public.crm_contacts;


--
-- Name: closer_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.closer_calls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    closer_id uuid,
    date date,
    status text DEFAULT 'pending'::text,
    revenue numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    setter_id uuid,
    lead_id uuid,
    nombre_paiements integer DEFAULT 0,
    link text,
    debrief text,
    client_id uuid
);


--
-- Name: coach_ai_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_ai_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    content text NOT NULL,
    embedding public.vector(768),
    chunk_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: coach_ai_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_ai_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_id uuid NOT NULL,
    ai_name text DEFAULT 'AlexIA'::text,
    system_instructions text DEFAULT ''::text,
    tone text DEFAULT 'professionnel'::text,
    greeting_message text DEFAULT 'Bonjour ! Je suis AlexIA, l''assistante de ton coach. Comment puis-je t''aider ?'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: coach_ai_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_ai_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text,
    file_size integer DEFAULT 0,
    file_type text DEFAULT 'text'::text,
    chunk_count integer DEFAULT 0,
    status text DEFAULT 'processing'::text NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coach_ai_documents_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'ready'::text, 'error'::text])))
);


--
-- Name: coach_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    coach_id uuid,
    alert_type text NOT NULL,
    title text NOT NULL,
    description text,
    severity text DEFAULT 'medium'::text NOT NULL,
    is_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coach_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['no_checkin'::text, 'revenue_drop'::text, 'inactive_7d'::text, 'inactive_14d'::text, 'goal_at_risk'::text, 'low_mood'::text, 'payment_overdue'::text]))),
    CONSTRAINT coach_alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: coach_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    coach_id uuid,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid,
    CONSTRAINT coach_assignments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    phone text,
    bio text,
    timezone text DEFAULT 'Europe/Paris'::text,
    onboarding_completed boolean DEFAULT false,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    onboarding_step integer DEFAULT 0,
    status_text text,
    status_emoji text,
    status_expires_at timestamp with time zone,
    dnd_enabled boolean DEFAULT false,
    dnd_start text,
    dnd_end text,
    ai_consent boolean,
    ai_consent_at timestamp with time zone,
    notification_sounds boolean DEFAULT true,
    urgent_sounds boolean DEFAULT true,
    onboarding_offer_id uuid,
    onboarding_answers jsonb DEFAULT '{}'::jsonb,
    onboarding_completed_at timestamp with time zone,
    default_currency text DEFAULT 'EUR'::text,
    ai_consent_given_at timestamp with time zone,
    ai_consent_scope jsonb DEFAULT '[]'::jsonb,
    leaderboard_anonymous boolean DEFAULT false,
    anonymous_alias text,
    custom_role_id uuid,
    business_type text,
    current_revenue text,
    goals text,
    how_found text,
    specialties text[] DEFAULT '{}'::text[],
    is_archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    archived_by uuid,
    siret text,
    company_name text,
    company_address text,
    legal_form text,
    assigned_coach uuid,
    last_sign_in_at timestamp with time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role, 'team'::public.user_role, 'student'::public.user_role, 'prospect'::public.user_role, 'setter'::public.user_role, 'closer'::public.user_role, 'client'::public.user_role, 'sales'::public.user_role])))
);


--
-- Name: student_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    tag text DEFAULT 'standard'::text,
    revenue numeric(10,2) DEFAULT 0,
    lifetime_value numeric(10,2) DEFAULT 0,
    acquisition_source text,
    enrollment_date date DEFAULT CURRENT_DATE,
    program text,
    goals text,
    coach_notes text,
    health_score integer DEFAULT 50,
    last_engagement_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    flag text DEFAULT 'green'::text,
    pipeline_stage text DEFAULT 'onboarding'::text,
    engagement_score integer DEFAULT 0,
    niche text,
    current_revenue numeric DEFAULT 0,
    revenue_objective numeric DEFAULT 0,
    obstacles text,
    assigned_coach uuid,
    completion_date date,
    CONSTRAINT student_details_flag_check CHECK ((flag = ANY (ARRAY['green'::text, 'yellow'::text, 'orange'::text, 'red'::text]))),
    CONSTRAINT student_details_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100))),
    CONSTRAINT student_details_tag_check CHECK ((tag = ANY (ARRAY['vip'::text, 'standard'::text, 'new'::text, 'at_risk'::text, 'churned'::text])))
);


--
-- Name: coach_leaderboard; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.coach_leaderboard AS
 SELECT p.id,
    p.full_name AS name,
    p.avatar_url AS avatar,
    COALESCE(ca.student_count, 0) AS students,
    COALESCE(sd.avg_health, 0) AS avg_health,
    COALESCE(sess.session_count, 0) AS sessions_month,
    COALESCE(risk.at_risk_count, 0) AS at_risk,
    (round((((((((LEAST(COALESCE(ca.student_count, 0), 20))::numeric / (20)::numeric) * (20)::numeric) + (((COALESCE(sd.avg_health, 0))::numeric / (100)::numeric) * (25)::numeric)) +
        CASE
            WHEN (COALESCE(ca.student_count, 0) > 0) THEN ((((COALESCE(ca.student_count, 0) - COALESCE(risk.at_risk_count, 0)))::numeric / (COALESCE(ca.student_count, 0))::numeric) * (25)::numeric)
            ELSE (25)::numeric
        END) + (((LEAST(COALESCE(sess.session_count, 0), 10))::numeric / (10)::numeric) * (15)::numeric)) +
        CASE
            WHEN (COALESCE(ca.student_count, 0) > 0) THEN (((1)::numeric - ((COALESCE(risk.at_risk_count, 0))::numeric / (COALESCE(ca.student_count, 0))::numeric)) * (15)::numeric)
            ELSE (15)::numeric
        END)))::integer AS score
   FROM ((((public.profiles p
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS student_count
           FROM public.coach_assignments
          WHERE ((coach_assignments.coach_id = p.id) AND (coach_assignments.status = 'active'::text))) ca ON (true))
     LEFT JOIN LATERAL ( SELECT (round(avg(sd2.health_score)))::integer AS avg_health
           FROM (public.student_details sd2
             JOIN public.coach_assignments ca2 ON ((ca2.client_id = sd2.profile_id)))
          WHERE ((ca2.coach_id = p.id) AND (ca2.status = 'active'::text) AND (sd2.health_score IS NOT NULL))) sd ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS at_risk_count
           FROM (public.student_details sd3
             JOIN public.coach_assignments ca3 ON ((ca3.client_id = sd3.profile_id)))
          WHERE ((ca3.coach_id = p.id) AND (ca3.status = 'active'::text) AND ((sd3.tag = 'at_risk'::text) OR (sd3.flag = ANY (ARRAY['red'::text, 'orange'::text]))))) risk ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS session_count
           FROM public.call_calendar cc
          WHERE ((cc.assigned_to = p.id) AND (cc.status = ANY (ARRAY['realise'::text, 'completed'::text])) AND (cc.date >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))) sess ON (true))
  WHERE (p.role = ANY (ARRAY['coach'::public.user_role, 'admin'::public.user_role]))
  ORDER BY ((round((((((((LEAST(COALESCE(ca.student_count, 0), 20))::numeric / (20)::numeric) * (20)::numeric) + (((COALESCE(sd.avg_health, 0))::numeric / (100)::numeric) * (25)::numeric)) +
        CASE
            WHEN (COALESCE(ca.student_count, 0) > 0) THEN ((((COALESCE(ca.student_count, 0) - COALESCE(risk.at_risk_count, 0)))::numeric / (COALESCE(ca.student_count, 0))::numeric) * (25)::numeric)
            ELSE (25)::numeric
        END) + (((LEAST(COALESCE(sess.session_count, 0), 10))::numeric / (10)::numeric) * (15)::numeric)) +
        CASE
            WHEN (COALESCE(ca.student_count, 0) > 0) THEN (((1)::numeric - ((COALESCE(risk.at_risk_count, 0))::numeric / (COALESCE(ca.student_count, 0))::numeric)) * (15)::numeric)
            ELSE (15)::numeric
        END)))::integer) DESC, COALESCE(ca.student_count, 0) DESC;


--
-- Name: coaching_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaching_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    set_by uuid,
    title text NOT NULL,
    description text,
    target_value numeric(10,2),
    current_value numeric(10,2) DEFAULT 0,
    unit text,
    deadline date,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    difficulty smallint,
    coach_notes text,
    milestones jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT coaching_goals_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5))),
    CONSTRAINT coaching_goals_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'paused'::text, 'abandoned'::text])))
);


--
-- Name: coaching_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaching_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    target_value numeric(10,2),
    current_value numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coaching_milestones_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: coaching_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaching_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    title text DEFAULT 'Session de coaching'::text NOT NULL,
    session_type text DEFAULT 'individual'::text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    action_items jsonb DEFAULT '[]'::jsonb,
    replay_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coaching_sessions_session_type_check CHECK ((session_type = ANY (ARRAY['individual'::text, 'group'::text, 'emergency'::text]))),
    CONSTRAINT coaching_sessions_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: commission_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setter_id uuid NOT NULL,
    rate numeric(5,2) DEFAULT 5.00 NOT NULL,
    split_first numeric(5,2) DEFAULT 70.00 NOT NULL,
    split_second numeric(5,2) DEFAULT 30.00 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid,
    contractor_id uuid NOT NULL,
    contractor_role text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    sale_id uuid,
    sale_amount numeric(12,2),
    commission_rate numeric(5,4),
    commission_amount numeric(12,2),
    updated_at timestamp with time zone DEFAULT now(),
    split_type text DEFAULT 'full'::text,
    closer_call_id uuid,
    CONSTRAINT commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    slug text NOT NULL,
    icon text,
    color text DEFAULT '#ef4444'::text,
    is_private boolean DEFAULT false,
    max_members integer,
    created_by uuid,
    member_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: community_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id uuid,
    user_id uuid,
    role text DEFAULT 'member'::text,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: competition_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competition_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competition_id uuid NOT NULL,
    team_id uuid,
    user_id uuid,
    score numeric DEFAULT 0 NOT NULL,
    rank integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT competition_participants_check CHECK (((team_id IS NOT NULL) OR (user_id IS NOT NULL)))
);


--
-- Name: competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'team_vs_team'::text NOT NULL,
    metric text DEFAULT 'xp'::text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'upcoming'::text NOT NULL,
    prize_description text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT competitions_metric_check CHECK ((metric = ANY (ARRAY['xp'::text, 'calls'::text, 'clients'::text, 'revenue'::text]))),
    CONSTRAINT competitions_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text]))),
    CONSTRAINT competitions_type_check CHECK ((type = ANY (ARRAY['team_vs_team'::text, 'free_for_all'::text])))
);


--
-- Name: contact_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    type text NOT NULL,
    content text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_interactions_type_check CHECK ((type = ANY (ARRAY['call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'message'::text])))
);


--
-- Name: contract_renewal_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_renewal_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid,
    action text,
    old_end_date date,
    new_end_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    details jsonb,
    new_contract_id uuid,
    period_months integer
);


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid,
    client_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    signature_data jsonb,
    sent_at timestamp with time zone,
    signed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    signature_image text,
    amount numeric(12,2),
    auto_renew boolean DEFAULT false,
    end_date date,
    renewal_status text,
    renewed_to uuid,
    cancellation_reason text,
    signed_pdf_url text,
    CONSTRAINT contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'cancelled'::text])))
);


--
-- Name: course_prerequisites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_prerequisites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    prerequisite_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    prerequisite_course_id uuid
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    cover_image_url text,
    status text DEFAULT 'draft'::text,
    sort_order integer DEFAULT 0,
    is_mandatory boolean DEFAULT false,
    estimated_duration integer,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    drip_type text DEFAULT 'none'::text,
    drip_delay_days integer DEFAULT 0,
    drip_min_level integer DEFAULT 0,
    access_type text DEFAULT 'all'::text,
    CONSTRAINT courses_access_type_check CHECK ((access_type = ANY (ARRAY['all'::text, 'level'::text, 'group'::text, 'time'::text, 'manual'::text]))),
    CONSTRAINT courses_drip_type_check CHECK ((drip_type = ANY (ARRAY['none'::text, 'time_based'::text, 'level_based'::text, 'completion_based'::text, 'manual'::text]))),
    CONSTRAINT courses_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: currency_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base text DEFAULT 'EUR'::text NOT NULL,
    target text NOT NULL,
    rate numeric(12,6) NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    color text DEFAULT '#6B7280'::text,
    icon text DEFAULT 'Shield'::text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    activity_date date DEFAULT CURRENT_DATE NOT NULL,
    activity_type text NOT NULL,
    count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    profile_id uuid,
    actions jsonb DEFAULT '[]'::jsonb
);


--
-- Name: daily_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    checkin_date date DEFAULT CURRENT_DATE NOT NULL,
    checkin_type text NOT NULL,
    energy integer,
    mood integer,
    goal_today text,
    priority text,
    wins text,
    learnings text,
    challenges text,
    gratitude text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT daily_checkins_checkin_type_check CHECK ((checkin_type = ANY (ARRAY['morning'::text, 'evening'::text]))),
    CONSTRAINT daily_checkins_energy_check CHECK (((energy >= 1) AND (energy <= 5))),
    CONSTRAINT daily_checkins_mood_check CHECK (((mood >= 1) AND (mood <= 5)))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    contract_id uuid,
    client_id uuid NOT NULL,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    due_date date,
    paid_at timestamp with time zone,
    stripe_invoice_id text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tax_rate numeric DEFAULT 20,
    discount numeric(12,2) DEFAULT 0,
    line_items jsonb,
    description text,
    title text,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'refunded'::text, 'partial'::text])))
);


--
-- Name: weekly_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    week_start date NOT NULL,
    revenue numeric(10,2) DEFAULT 0,
    prospection_count integer DEFAULT 0,
    win text,
    blocker text,
    goal_next_week text,
    mood integer,
    coach_feedback text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    energy integer,
    gratitudes text[] DEFAULT '{}'::text[],
    daily_goals text[] DEFAULT '{}'::text[],
    notes text,
    goals_progress text,
    CONSTRAINT weekly_checkins_energy_check CHECK (((energy >= 1) AND (energy <= 5))),
    CONSTRAINT weekly_checkins_mood_check CHECK (((mood >= 1) AND (mood <= 5)))
);


--
-- Name: dashboard_kpis; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dashboard_kpis AS
 SELECT (( SELECT count(*) AS count
           FROM public.profiles
          WHERE (profiles.role = 'client'::public.user_role)))::integer AS total_clients,
    (( SELECT count(*) AS count
           FROM public.profiles
          WHERE ((profiles.role = 'client'::public.user_role) AND (profiles.created_at <= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '1 day'::interval)))))::integer AS last_month_clients,
    ( SELECT COALESCE(sum(invoices.total), (0)::numeric) AS "coalesce"
           FROM public.invoices
          WHERE ((invoices.status = 'paid'::text) AND (invoices.created_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))) AS revenue_this_month,
    ( SELECT COALESCE(sum(invoices.total), (0)::numeric) AS "coalesce"
           FROM public.invoices
          WHERE ((invoices.status = 'paid'::text) AND (invoices.created_at >= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '1 mon'::interval)) AND (invoices.created_at < date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))) AS revenue_last_month,
    (( SELECT count(*) AS count
           FROM public.courses
          WHERE (courses.status = 'published'::text)))::integer AS active_courses,
    (( SELECT count(*) AS count
           FROM public.weekly_checkins
          WHERE (weekly_checkins.week_start >= date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS weekly_checkins;


--
-- Name: dashboard_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_layouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    widgets jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text,
    progress_percent integer DEFAULT 0,
    time_spent integer DEFAULT 0,
    completed_at timestamp with time zone,
    last_accessed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    checklist_completions jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    content_type text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0,
    estimated_duration integer,
    is_preview boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    attachments jsonb DEFAULT '[]'::jsonb,
    video_url text,
    content_html text,
    embed_url text,
    embed_type text,
    audio_url text,
    audio_duration integer,
    CONSTRAINT lessons_content_type_check CHECK ((content_type = ANY (ARRAY['video'::text, 'text'::text, 'pdf'::text, 'quiz'::text, 'assignment'::text])))
);


--
-- Name: engagement_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.engagement_stats AS
 SELECT (( SELECT count(*) AS count
           FROM public.lesson_progress))::integer AS total_completions,
    (( SELECT count(*) AS count
           FROM public.lessons))::integer AS total_lessons,
    (( SELECT count(*) AS count
           FROM public.profiles
          WHERE (profiles.role = 'client'::public.user_role)))::integer AS total_students,
    (( SELECT count(*) AS count
           FROM public.weekly_checkins
          WHERE (weekly_checkins.week_start >= date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))))::integer AS weekly_checkins;


--
-- Name: enrichment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrichment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    platform text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    enriched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT enrichment_results_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message text NOT NULL,
    stack text,
    component_stack text,
    page text,
    route text,
    user_id uuid,
    user_email text,
    user_role text,
    source text DEFAULT 'unknown'::text NOT NULL,
    severity text DEFAULT 'error'::text NOT NULL,
    user_agent text,
    viewport text,
    metadata jsonb DEFAULT '{}'::jsonb,
    resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT error_logs_severity_check CHECK ((severity = ANY (ARRAY['warning'::text, 'error'::text, 'critical'::text]))),
    CONSTRAINT error_logs_source_check CHECK ((source = ANY (ARRAY['error-boundary'::text, 'unhandled-error'::text, 'unhandled-rejection'::text, 'api-error'::text, 'manual'::text])))
);


--
-- Name: exercise_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid,
    student_id uuid,
    content text,
    file_url text,
    status text DEFAULT 'submitted'::text,
    feedback text,
    grade numeric(5,2),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: faq_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faq_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    answer text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    occurrence_count integer DEFAULT 1 NOT NULL,
    auto_answer_enabled boolean DEFAULT false NOT NULL,
    source_message_id uuid,
    created_by uuid NOT NULL,
    last_asked_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faq_question_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faq_question_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text,
    matched_faq_id uuid,
    confidence numeric(3,2),
    asked_by uuid,
    auto_answered boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: feed_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: feed_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: feed_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    post_type text DEFAULT 'general'::text NOT NULL,
    media_urls text[] DEFAULT '{}'::text[],
    is_pinned boolean DEFAULT false,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category text DEFAULT 'general'::text,
    win_data jsonb,
    community_id uuid,
    CONSTRAINT feed_posts_category_check CHECK ((category = ANY (ARRAY['general'::text, 'wins'::text, 'questions'::text, 'resources'::text, 'off_topic'::text]))),
    CONSTRAINT feed_posts_post_type_check CHECK ((post_type = ANY (ARRAY['victory'::text, 'question'::text, 'experience'::text, 'general'::text, 'resource'::text, 'off_topic'::text])))
);


--
-- Name: feed_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    comment_id uuid,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    action_taken text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT feed_reports_action_taken_check CHECK ((action_taken = ANY (ARRAY['warning'::text, 'content_removed'::text, 'user_suspended'::text, NULL::text]))),
    CONSTRAINT feed_reports_reason_check CHECK ((reason = ANY (ARRAY['spam'::text, 'harassment'::text, 'inappropriate'::text, 'misinformation'::text, 'other'::text]))),
    CONSTRAINT feed_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'actioned'::text, 'dismissed'::text]))),
    CONSTRAINT report_target CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL))))
);


--
-- Name: financial_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    type text,
    label text,
    amount numeric(12,2),
    date date,
    is_paid boolean DEFAULT false,
    recurrence text,
    created_at timestamp with time zone DEFAULT now(),
    client_id uuid,
    created_by uuid,
    prestataire text,
    currency text DEFAULT 'EUR'::text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: flag_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flag_history (
    id uuid,
    client_id uuid,
    previous_flag text,
    new_flag text,
    reason text,
    changed_by uuid,
    created_at timestamp with time zone
);


--
-- Name: form_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    field_type text NOT NULL,
    label text NOT NULL,
    description text,
    placeholder text,
    is_required boolean DEFAULT false,
    options jsonb DEFAULT '[]'::jsonb,
    validation jsonb DEFAULT '{}'::jsonb,
    conditional_logic jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT form_fields_field_type_check CHECK ((field_type = ANY (ARRAY['short_text'::text, 'long_text'::text, 'email'::text, 'phone'::text, 'number'::text, 'single_select'::text, 'multi_select'::text, 'dropdown'::text, 'rating'::text, 'nps'::text, 'scale'::text, 'date'::text, 'time'::text, 'file_upload'::text, 'heading'::text, 'paragraph'::text, 'divider'::text, 'step'::text, 'callout'::text, 'checklist'::text])))
);


--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    respondent_id uuid,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);


--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    thumbnail_emoji text DEFAULT '📋'::text,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT form_templates_category_check CHECK ((category = ANY (ARRAY['onboarding'::text, 'feedback'::text, 'evaluation'::text, 'intake'::text, 'survey'::text])))
);


--
-- Name: formation_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formation_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    formation_id uuid NOT NULL,
    progress numeric DEFAULT 0,
    completed boolean DEFAULT false,
    enrolled_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    is_locked boolean DEFAULT false,
    unlock_condition jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: formation_modules; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.formation_modules AS
 SELECT id,
    course_id,
    title,
    description,
    sort_order,
    is_locked,
    unlock_condition,
    created_at
   FROM public.modules;


--
-- Name: formations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.formations AS
 SELECT id,
    title,
    description,
    cover_image_url,
    status,
    sort_order,
    is_mandatory,
    estimated_duration,
    created_by,
    created_at,
    updated_at,
    drip_type,
    drip_delay_days,
    drip_min_level,
    access_type
   FROM public.courses;


--
-- Name: forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text,
    created_by uuid NOT NULL,
    cover_image_url text,
    thank_you_message text DEFAULT 'Merci pour ta reponse !'::text,
    is_anonymous boolean DEFAULT false,
    allow_multiple_submissions boolean DEFAULT false,
    closes_at timestamp with time zone,
    target_audience text DEFAULT 'all'::text,
    target_student_ids uuid[] DEFAULT '{}'::uuid[],
    notification_on_submit boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type text DEFAULT 'form'::text NOT NULL,
    CONSTRAINT forms_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text, 'archived'::text]))),
    CONSTRAINT forms_target_audience_check CHECK ((target_audience = ANY (ARRAY['all'::text, 'vip'::text, 'standard'::text, 'new'::text, 'custom'::text]))),
    CONSTRAINT forms_type_check CHECK ((type = ANY (ARRAY['form'::text, 'workbook'::text])))
);


--
-- Name: google_calendar_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_calendar_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    access_token text,
    refresh_token text,
    expires_at timestamp with time zone,
    calendar_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hall_of_fame; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hall_of_fame (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    achievement text,
    description text,
    featured_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now()
);


--
-- Name: xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    action text NOT NULL,
    xp_amount integer NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hall_of_fame_enriched; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.hall_of_fame_enriched AS
 SELECT h.id,
    h.user_id AS profile_id,
    h.achievement,
    h.description,
    h.featured_at,
    h.created_at,
    p.full_name,
    p.avatar_url,
    p.bio,
    COALESCE(xp.total_xp, 0) AS total_xp,
    COALESCE(b.badge_count, 0) AS badge_count,
    (COALESCE(sd.current_revenue, (0)::numeric))::integer AS monthly_revenue,
    sd.niche
   FROM ((((public.hall_of_fame h
     LEFT JOIN public.profiles p ON ((p.id = h.user_id)))
     LEFT JOIN public.student_details sd ON ((sd.profile_id = h.user_id)))
     LEFT JOIN LATERAL ( SELECT (sum(xp_transactions.xp_amount))::integer AS total_xp
           FROM public.xp_transactions
          WHERE (xp_transactions.profile_id = h.user_id)) xp ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS badge_count
           FROM public.user_badges
          WHERE (user_badges.profile_id = h.user_id)) b ON (true))
  ORDER BY h.featured_at DESC;


--
-- Name: instagram_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    username text,
    followers integer DEFAULT 0,
    following integer DEFAULT 0,
    media_count integer DEFAULT 0,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: instagram_post_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_post_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid,
    post_url text,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    reach integer DEFAULT 0,
    engagement_rate numeric(5,2),
    posted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_completions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.item_completions AS
 SELECT id,
    lesson_id,
    student_id,
    status,
    progress_percent,
    time_spent,
    completed_at,
    last_accessed_at,
    created_at
   FROM public.lesson_progress;


--
-- Name: journal_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    mood integer,
    tags text[] DEFAULT '{}'::text[],
    is_private boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    media_urls text[] DEFAULT '{}'::text[],
    shared_with_coach boolean DEFAULT false,
    prompt_id uuid,
    attachments jsonb DEFAULT '[]'::jsonb,
    template text,
    CONSTRAINT journal_entries_mood_check CHECK (((mood >= 1) AND (mood <= 5)))
);


--
-- Name: journal_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    day_of_week integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: knowledge_base_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_base_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text,
    source_type text DEFAULT 'manual'::text,
    source_url text,
    tags text[] DEFAULT '{}'::text[],
    question_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: kpi_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid NOT NULL,
    title text NOT NULL,
    description text,
    metric text NOT NULL,
    target_value numeric DEFAULT 0 NOT NULL,
    current_value numeric DEFAULT 0 NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    period text DEFAULT 'monthly'::text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kpi_goals_period_check CHECK ((period = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])))
);


--
-- Name: leaderboard; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.leaderboard AS
 SELECT p.id AS profile_id,
        CASE
            WHEN COALESCE(p.leaderboard_anonymous, false) THEN COALESCE(p.anonymous_alias, 'Anonyme'::text)
            ELSE p.full_name
        END AS full_name,
        CASE
            WHEN COALESCE(p.leaderboard_anonymous, false) THEN NULL::text
            ELSE p.avatar_url
        END AS avatar_url,
    (COALESCE(sum(xt.xp_amount), (0)::bigint))::integer AS total_xp,
    (count(DISTINCT ub.badge_id))::integer AS badge_count,
    (rank() OVER (ORDER BY COALESCE(sum(xt.xp_amount), (0)::bigint) DESC))::integer AS rank
   FROM ((public.profiles p
     LEFT JOIN public.xp_transactions xt ON ((xt.profile_id = p.id)))
     LEFT JOIN public.user_badges ub ON ((ub.profile_id = p.id)))
  WHERE (p.role = ANY (ARRAY['client'::public.user_role, 'prospect'::public.user_role]))
  GROUP BY p.id, p.full_name, p.avatar_url, p.leaderboard_anonymous, p.anonymous_alias;


--
-- Name: leads; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.leads AS
 SELECT id,
    full_name,
    email,
    phone,
    company,
    source,
    stage,
    assigned_to,
    estimated_value,
    notes,
    tags,
    last_contact_at,
    converted_profile_id,
    sort_order,
    created_by,
    created_at,
    updated_at,
    lead_score,
    last_interaction_at,
    interaction_count
   FROM public.crm_contacts;


--
-- Name: lesson_action_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_action_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action_id uuid NOT NULL,
    user_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: lesson_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: lesson_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    reply_to uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: level_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.level_config (
    level integer NOT NULL,
    name text NOT NULL,
    min_xp integer NOT NULL,
    icon text,
    color text
);


--
-- Name: member_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.member_stats AS
 SELECT p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    p.bio,
    p.created_at,
    COALESCE(xp.total_xp, 0) AS total_xp,
    COALESCE(b.badge_count, 0) AS badge_count,
    COALESCE(lc.level, 1) AS level,
    COALESCE(lc.name, 'Debutant'::text) AS level_name,
    COALESCE(lc.icon, '🌱'::text) AS level_icon
   FROM (((public.profiles p
     LEFT JOIN LATERAL ( SELECT (sum(xp_transactions.xp_amount))::integer AS total_xp
           FROM public.xp_transactions
          WHERE (xp_transactions.profile_id = p.id)) xp ON (true))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS badge_count
           FROM public.user_badges
          WHERE (user_badges.profile_id = p.id)) b ON (true))
     LEFT JOIN LATERAL ( SELECT lc2.level,
            lc2.name,
            lc2.icon
           FROM public.level_config lc2
          WHERE (lc2.min_xp <= COALESCE(xp.total_xp, 0))
          ORDER BY lc2.min_xp DESC
         LIMIT 1) lc ON (true))
  ORDER BY p.full_name;


--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: message_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text,
    created_by uuid,
    is_shared boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    usage_count integer DEFAULT 0,
    shortcut text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    content_type text DEFAULT 'text'::text,
    reply_to uuid,
    is_pinned boolean DEFAULT false,
    is_edited boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    is_ai_generated boolean DEFAULT false,
    is_urgent boolean DEFAULT false,
    scheduled_at timestamp with time zone,
    reactions jsonb DEFAULT '{}'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT messages_content_type_check CHECK ((content_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'video'::text, 'audio'::text, 'system'::text])))
);


--
-- Name: miro_boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.miro_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT 'Nouveau tableau'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: miro_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.miro_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    x numeric DEFAULT 0 NOT NULL,
    y numeric DEFAULT 0 NOT NULL,
    width numeric DEFAULT 420,
    title text,
    content text,
    card_type text DEFAULT 'default'::text,
    style jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: miro_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.miro_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    from_card_id uuid NOT NULL,
    to_card_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: miro_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.miro_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    name text NOT NULL,
    x numeric DEFAULT 0 NOT NULL,
    y numeric DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: module_items; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.module_items AS
 SELECT id,
    module_id,
    title,
    content_type,
    content,
    sort_order,
    estimated_duration,
    is_preview,
    created_at,
    updated_at,
    description,
    attachments,
    video_url,
    content_html,
    embed_url,
    embed_type,
    audio_url,
    audio_duration
   FROM public.lessons;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quiet_hours_start time without time zone DEFAULT '22:00:00'::time without time zone NOT NULL,
    quiet_hours_end time without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    batch_frequency text DEFAULT 'instant'::text NOT NULL,
    priority_threshold text DEFAULT 'all'::text NOT NULL,
    email_digest boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_preferences_batch_frequency_check CHECK ((batch_frequency = ANY (ARRAY['instant'::text, 'hourly'::text, 'daily'::text]))),
    CONSTRAINT notification_preferences_priority_threshold_check CHECK ((priority_threshold = ANY (ARRAY['all'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    category text DEFAULT 'general'::text,
    action_url text,
    is_archived boolean DEFAULT false,
    priority text DEFAULT 'normal'::text,
    batched_at timestamp with time zone,
    batch_id uuid,
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['new_message'::text, 'mention'::text, 'form_response'::text, 'module_complete'::text, 'task_assigned'::text, 'task_due'::text, 'student_inactive'::text, 'new_enrollment'::text, 'ai_insight'::text, 'system'::text, 'feed'::text, 'contract_signed'::text, 'contract_generated'::text, 'onboarding_complete'::text, 'report'::text, 'checkin'::text, 'goal'::text, 'badge'::text, 'call_reminder'::text])))
);


--
-- Name: offboarding_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offboarding_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    transfer_to_id uuid,
    reason text,
    requested_by uuid NOT NULL,
    data_actions jsonb DEFAULT '{}'::jsonb NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT offboarding_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: onboarding_checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    href text,
    icon text,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: onboarding_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    modules text[] DEFAULT '{}'::text[] NOT NULL,
    welcome_message text,
    recommended_actions jsonb DEFAULT '[]'::jsonb,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    step text NOT NULL,
    completed_at timestamp with time zone DEFAULT now()
);


--
-- Name: onboarding_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    step_key text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    reminder_type text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_reminders_reminder_type_check CHECK ((reminder_type = ANY (ARRAY['j-3'::text, 'j0'::text, 'j+3'::text, 'j+7'::text, 'j+14'::text])))
);


--
-- Name: payment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid,
    client_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    installments integer DEFAULT 1 NOT NULL,
    frequency text DEFAULT 'monthly'::text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    due_date date,
    installment_details jsonb,
    CONSTRAINT payment_schedules_frequency_check CHECK ((frequency = ANY (ARRAY['monthly'::text, 'weekly'::text, 'biweekly'::text, 'custom'::text]))),
    CONSTRAINT payment_schedules_installments_check CHECK (((installments >= 1) AND (installments <= 12)))
);


--
-- Name: pipeline_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    name text NOT NULL,
    color text DEFAULT 'blue'::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_terminal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pre_call_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_call_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_id uuid NOT NULL,
    user_id uuid NOT NULL,
    objective text NOT NULL,
    tried_solutions text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    endpoint text NOT NULL,
    keys jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    score numeric(5,2) DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone DEFAULT now(),
    time_spent integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quiz_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quiz_id uuid NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 0 NOT NULL,
    result_index integer,
    email text,
    profile_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    slug text NOT NULL,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    results jsonb DEFAULT '[]'::jsonb NOT NULL,
    cta_text text DEFAULT 'Cree ton compte pour decouvrir ton plan d''action'::text,
    cta_url text DEFAULT '/register'::text,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: relance_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relance_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    sequence_id uuid,
    current_step integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    enrolled_at timestamp with time zone DEFAULT now(),
    next_step_at timestamp with time zone,
    completed_at timestamp with time zone,
    enrolled_by uuid
);


--
-- Name: relance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_id uuid,
    enrollment_id uuid,
    step_index integer,
    sent_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'sent'::text
);


--
-- Name: relance_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relance_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    target_stage text NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: relance_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relance_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_id uuid,
    step_order integer NOT NULL,
    delay_days integer NOT NULL,
    channel text DEFAULT 'email'::text NOT NULL,
    subject text,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: replays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.replays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    duration_minutes integer,
    coach_id uuid,
    tags text[] DEFAULT '{}'::text[],
    category text,
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: resource_folder_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_folder_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folder_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: resource_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    visibility text DEFAULT 'all'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT resource_folders_visibility_check CHECK ((visibility = ANY (ARRAY['all'::text, 'staff'::text, 'clients'::text])))
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'general'::text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    uploaded_by uuid NOT NULL,
    visibility text DEFAULT 'all'::text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    folder_id uuid,
    CONSTRAINT resources_visibility_check CHECK ((visibility = ANY (ARRAY['all'::text, 'staff'::text, 'clients'::text])))
);


--
-- Name: revenue_by_channel; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.revenue_by_channel AS
 SELECT COALESCE(sd.acquisition_source, 'autre'::text) AS channel,
    COALESCE(sum(i.amount), (0)::numeric) AS revenue
   FROM (public.invoices i
     LEFT JOIN public.student_details sd ON ((sd.profile_id = i.client_id)))
  WHERE (i.status = 'paid'::text)
  GROUP BY COALESCE(sd.acquisition_source, 'autre'::text)
  ORDER BY COALESCE(sum(i.amount), (0)::numeric) DESC
 LIMIT 6;


--
-- Name: revenue_by_month; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.revenue_by_month AS
 SELECT to_char(paid_at, 'YYYY-MM'::text) AS month,
    to_char(paid_at, 'Mon'::text) AS label,
    sum(total) AS revenue
   FROM public.invoices
  WHERE ((status = 'paid'::text) AND (paid_at IS NOT NULL) AND (paid_at >= (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '5 mons'::interval)))
  GROUP BY (to_char(paid_at, 'YYYY-MM'::text)), (to_char(paid_at, 'Mon'::text))
  ORDER BY (to_char(paid_at, 'YYYY-MM'::text));


--
-- Name: revenue_by_quarter; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.revenue_by_quarter AS
 SELECT ((('T'::text || (EXTRACT(quarter FROM paid_at))::integer) || ' '::text) || (EXTRACT(year FROM paid_at))::integer) AS quarter,
    sum(total) AS revenue
   FROM public.invoices
  WHERE ((status = 'paid'::text) AND (paid_at IS NOT NULL))
  GROUP BY ((('T'::text || (EXTRACT(quarter FROM paid_at))::integer) || ' '::text) || (EXTRACT(year FROM paid_at))::integer)
  ORDER BY (min(paid_at)) DESC
 LIMIT 4;


--
-- Name: reward_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    xp_spent integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now(),
    fulfilled_at timestamp with time zone,
    fulfilled_by uuid,
    CONSTRAINT reward_redemptions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'fulfilled'::text, 'cancelled'::text])))
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    cost_xp integer NOT NULL,
    type text NOT NULL,
    stock integer,
    is_active boolean DEFAULT true,
    image_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rewards_cost_xp_check CHECK ((cost_xp > 0)),
    CONSTRAINT rewards_type_check CHECK ((type = ANY (ARRAY['session_bonus'::text, 'resource_unlock'::text, 'badge_exclusive'::text, 'custom'::text])))
);


--
-- Name: rituals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rituals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    description text,
    frequency text DEFAULT 'daily'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    profile_id uuid,
    time_of_day text,
    streak_count integer DEFAULT 0 NOT NULL,
    last_completed_at timestamp with time zone
);


--
-- Name: roadmap_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roadmap_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    validation_criteria text[] DEFAULT '{}'::text[] NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    completed_at timestamp with time zone,
    completed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT roadmap_milestones_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])))
);


--
-- Name: sales_pipeline_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sales_pipeline_summary AS
 SELECT COALESCE(stage, 'prospect'::text) AS stage,
    (count(*))::integer AS count
   FROM public.crm_contacts
  GROUP BY COALESCE(stage, 'prospect'::text);


--
-- Name: saved_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_segments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_shared boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    title text NOT NULL,
    session_type text DEFAULT 'individual'::text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    action_items jsonb DEFAULT '[]'::jsonb,
    replay_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sessions_session_type_check CHECK ((session_type = ANY (ARRAY['individual'::text, 'group'::text, 'emergency'::text]))),
    CONSTRAINT sessions_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: setter_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setter_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    messages_sent integer DEFAULT 0 NOT NULL,
    leads_generated integer DEFAULT 0 NOT NULL,
    calls_booked integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dms_sent integer DEFAULT 0,
    followups_sent integer DEFAULT 0,
    links_sent integer DEFAULT 0,
    client_id uuid
);


--
-- Name: setter_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setter_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setter_id uuid NOT NULL,
    client_id uuid,
    column_id uuid,
    name text,
    phone text,
    email text,
    instagram_handle text,
    linkedin_handle text,
    objectif text,
    douleur text,
    ca_contracte numeric DEFAULT 0,
    ca_collecte numeric DEFAULT 0,
    duree_collecte integer,
    status text DEFAULT 'en_cours'::text,
    date_premier_contact date,
    date_relance date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sms_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipient_phone text NOT NULL,
    message text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    related_type text,
    related_id uuid,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sms_reminders_related_type_check CHECK ((related_type = ANY (ARRAY['call'::text, 'coaching'::text, 'payment'::text]))),
    CONSTRAINT sms_reminders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: social_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    caption text,
    media_urls text[] DEFAULT '{}'::text[],
    platform text DEFAULT 'instagram'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    created_by uuid NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT social_content_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'linkedin'::text, 'tiktok'::text]))),
    CONSTRAINT social_content_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text DEFAULT 'daily_checkin'::text NOT NULL,
    current_count integer DEFAULT 0 NOT NULL,
    longest_count integer DEFAULT 0 NOT NULL,
    last_activity_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    profile_id uuid,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    xp_multiplier numeric(3,2) DEFAULT 1.00 NOT NULL,
    total_active_days integer DEFAULT 0 NOT NULL
);


--
-- Name: student_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    activity_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_activities_activity_type_check CHECK ((activity_type = ANY (ARRAY['module_started'::text, 'module_completed'::text, 'lesson_completed'::text, 'form_submitted'::text, 'message_sent'::text, 'login'::text, 'milestone_reached'::text, 'note_added'::text, 'call_scheduled'::text, 'payment_received'::text])))
);


--
-- Name: student_flag_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_flag_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    old_flag text,
    new_flag text NOT NULL,
    reason text,
    changed_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_stats_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.student_stats_summary AS
 SELECT (( SELECT count(*) AS count
           FROM public.profiles
          WHERE (profiles.role = 'client'::public.user_role)))::integer AS total_students,
    (( SELECT count(*) AS count
           FROM public.profiles
          WHERE ((profiles.role = 'client'::public.user_role) AND (profiles.created_at >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))))::integer AS new_students_this_month,
    (( SELECT count(*) AS count
           FROM public.student_details
          WHERE (student_details.tag = 'churned'::text)))::integer AS churned_students,
    (( SELECT count(*) AS count
           FROM public.student_details
          WHERE (student_details.flag = ANY (ARRAY['yellow'::text, 'orange'::text, 'red'::text]))))::integer AS at_risk_students,
    (( SELECT COALESCE(round(avg((student_details.lifetime_value)::numeric)), (0)::numeric) AS "coalesce"
           FROM public.student_details
          WHERE ((student_details.lifetime_value IS NOT NULL) AND ((student_details.lifetime_value)::numeric > (0)::numeric))))::integer AS average_ltv;


--
-- Name: student_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    assigned_by uuid,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone,
    status text DEFAULT 'todo'::text,
    priority text DEFAULT 'medium'::text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT student_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT student_tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text, 'overdue'::text])))
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text DEFAULT 'bug'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    page_url text,
    user_agent text,
    screenshot_url text,
    admin_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT support_tickets_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'feature'::text, 'question'::text, 'autre'::text]))),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])))
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    captain_id uuid,
    avatar_url text,
    color text DEFAULT '#3b82f6'::text,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    avatar_emoji text
);


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name text,
    file_url text,
    file_type text,
    file_size integer,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: upsell_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upsell_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    trigger_type text NOT NULL,
    trigger_value text,
    offer_name text NOT NULL,
    status text DEFAULT 'detected'::text,
    proposed_at timestamp with time zone,
    resolved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    amount numeric DEFAULT 0,
    offer_type text DEFAULT 'avancee'::text,
    message text,
    CONSTRAINT upsell_opportunities_status_check CHECK ((status = ANY (ARRAY['detected'::text, 'proposed'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: upsell_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upsell_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    trigger_type text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    offer_title text NOT NULL,
    offer_description text,
    offer_url text,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT upsell_rules_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['revenue_threshold'::text, 'milestone_completion'::text, 'time_based'::text])))
);


--
-- Name: upsell_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upsell_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid NOT NULL,
    client_id uuid NOT NULL,
    triggered_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text NOT NULL,
    notified_at timestamp with time zone,
    converted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT upsell_triggers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'notified'::text, 'converted'::text, 'dismissed'::text])))
);


--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    consent_type text NOT NULL,
    consent_version text DEFAULT '1.0'::text NOT NULL,
    accepted boolean DEFAULT true NOT NULL,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone
);


--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_follows_check CHECK ((follower_id <> following_id))
);


--
-- Name: user_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    invite_code text DEFAULT (gen_random_uuid())::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    specialties text[] DEFAULT '{}'::text[],
    CONSTRAINT user_invites_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text, 'client'::text]))),
    CONSTRAINT user_invites_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])))
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    notification_messages boolean DEFAULT true,
    notification_calls boolean DEFAULT true,
    notification_formations boolean DEFAULT true,
    notification_community boolean DEFAULT true,
    notification_coaching boolean DEFAULT true,
    notification_system boolean DEFAULT true,
    notification_badges boolean DEFAULT true,
    notification_challenges boolean DEFAULT true,
    notification_digest boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text, 'client'::text])))
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    device_info text,
    ip_address text,
    last_active_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


--
-- Name: video_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    related_type text NOT NULL,
    related_id uuid,
    video_url text NOT NULL,
    thumbnail_url text,
    duration integer,
    message text,
    viewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT video_responses_related_type_check CHECK ((related_type = ANY (ARRAY['call'::text, 'coaching_session'::text, 'question'::text])))
);


--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_id uuid NOT NULL,
    event text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    response_status integer,
    response_body text,
    duration_ms integer,
    success boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    secret text NOT NULL,
    events text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: workbook_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workbook_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workbook_id uuid NOT NULL,
    client_id uuid NOT NULL,
    call_id uuid,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    reviewer_notes text,
    reviewed_by uuid,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workbook_submissions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'reviewed'::text])))
);


--
-- Name: workbooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workbooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    course_id uuid,
    module_type text,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role text,
    CONSTRAINT workbooks_module_type_check CHECK ((module_type = ANY (ARRAY['marche'::text, 'offre'::text, 'communication'::text, 'acquisition'::text, 'conversion'::text, 'diagnostic'::text, 'general'::text])))
);


--
-- Name: xp_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    xp_amount integer DEFAULT 0 NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_question_log ai_question_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_question_log
    ADD CONSTRAINT ai_question_log_pkey PRIMARY KEY (id);


--
-- Name: ai_reports ai_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_reports
    ADD CONSTRAINT ai_reports_pkey PRIMARY KEY (id);


--
-- Name: announcement_dismissals announcement_dismissals_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_dismissals
    ADD CONSTRAINT announcement_dismissals_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: announcement_dismissals announcement_dismissals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_dismissals
    ADD CONSTRAINT announcement_dismissals_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_key UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: availability_overrides availability_overrides_coach_id_override_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_overrides
    ADD CONSTRAINT availability_overrides_coach_id_override_date_key UNIQUE (coach_id, override_date);


--
-- Name: availability_overrides availability_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_overrides
    ADD CONSTRAINT availability_overrides_pkey PRIMARY KEY (id);


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_user_id_key UNIQUE (user_id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: booking_availability booking_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_pkey PRIMARY KEY (id);


--
-- Name: booking_exceptions booking_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_exceptions
    ADD CONSTRAINT booking_exceptions_pkey PRIMARY KEY (id);


--
-- Name: booking_page_views booking_page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_page_views
    ADD CONSTRAINT booking_page_views_pkey PRIMARY KEY (id);


--
-- Name: booking_pages booking_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_pages
    ADD CONSTRAINT booking_pages_pkey PRIMARY KEY (id);


--
-- Name: booking_pages booking_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_pages
    ADD CONSTRAINT booking_pages_slug_key UNIQUE (slug);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: branding branding_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding
    ADD CONSTRAINT branding_key_key UNIQUE (key);


--
-- Name: branding_pages branding_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding_pages
    ADD CONSTRAINT branding_pages_pkey PRIMARY KEY (id);


--
-- Name: branding_pages branding_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding_pages
    ADD CONSTRAINT branding_pages_slug_key UNIQUE (slug);


--
-- Name: branding branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding
    ADD CONSTRAINT branding_pkey PRIMARY KEY (id);


--
-- Name: branding_settings branding_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding_settings
    ADD CONSTRAINT branding_settings_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: call_calendar call_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_calendar
    ADD CONSTRAINT call_calendar_pkey PRIMARY KEY (id);


--
-- Name: call_documents call_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_documents
    ADD CONSTRAINT call_documents_pkey PRIMARY KEY (id);


--
-- Name: call_note_templates call_note_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_note_templates
    ADD CONSTRAINT call_note_templates_pkey PRIMARY KEY (id);


--
-- Name: call_notes call_notes_call_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_notes
    ADD CONSTRAINT call_notes_call_id_key UNIQUE (call_id);


--
-- Name: call_notes call_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_notes
    ADD CONSTRAINT call_notes_pkey PRIMARY KEY (id);


--
-- Name: call_recordings call_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_pkey PRIMARY KEY (id);


--
-- Name: call_session_notes call_session_notes_call_id_author_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session_notes
    ADD CONSTRAINT call_session_notes_call_id_author_id_key UNIQUE (call_id, author_id);


--
-- Name: call_session_notes call_session_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session_notes
    ADD CONSTRAINT call_session_notes_pkey PRIMARY KEY (id);


--
-- Name: call_summaries call_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_summaries
    ADD CONSTRAINT call_summaries_pkey PRIMARY KEY (id);


--
-- Name: call_transcripts call_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_transcripts
    ADD CONSTRAINT call_transcripts_pkey PRIMARY KEY (id);


--
-- Name: certificate_entries certificate_entries_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_entries
    ADD CONSTRAINT certificate_entries_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificate_entries certificate_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_entries
    ADD CONSTRAINT certificate_entries_pkey PRIMARY KEY (id);


--
-- Name: certificate_entries certificate_entries_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_entries
    ADD CONSTRAINT certificate_entries_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: challenge_entries challenge_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_entries
    ADD CONSTRAINT challenge_entries_pkey PRIMARY KEY (id);


--
-- Name: challenge_participants challenge_participants_challenge_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_profile_id_key UNIQUE (challenge_id, profile_id);


--
-- Name: challenge_participants challenge_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: channel_members channel_members_channel_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_channel_id_profile_id_key UNIQUE (channel_id, profile_id);


--
-- Name: channel_members channel_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_pkey PRIMARY KEY (id);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_client_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_client_id_date_key UNIQUE (client_id, date);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: client_ai_memory client_ai_memory_client_id_coach_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ai_memory
    ADD CONSTRAINT client_ai_memory_client_id_coach_id_key UNIQUE (client_id, coach_id);


--
-- Name: client_ai_memory client_ai_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ai_memory
    ADD CONSTRAINT client_ai_memory_pkey PRIMARY KEY (id);


--
-- Name: client_assignments client_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assignments
    ADD CONSTRAINT client_assignments_pkey PRIMARY KEY (id);


--
-- Name: client_flag_history client_flag_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flag_history
    ADD CONSTRAINT client_flag_history_pkey PRIMARY KEY (id);


--
-- Name: client_flags client_flags_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flags
    ADD CONSTRAINT client_flags_client_id_key UNIQUE (client_id);


--
-- Name: client_flags client_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flags
    ADD CONSTRAINT client_flags_pkey PRIMARY KEY (id);


--
-- Name: client_roadmaps client_roadmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_roadmaps
    ADD CONSTRAINT client_roadmaps_pkey PRIMARY KEY (id);


--
-- Name: closer_calls closer_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closer_calls
    ADD CONSTRAINT closer_calls_pkey PRIMARY KEY (id);


--
-- Name: coach_ai_chunks coach_ai_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_chunks
    ADD CONSTRAINT coach_ai_chunks_pkey PRIMARY KEY (id);


--
-- Name: coach_ai_config coach_ai_config_coach_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_config
    ADD CONSTRAINT coach_ai_config_coach_id_key UNIQUE (coach_id);


--
-- Name: coach_ai_config coach_ai_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_config
    ADD CONSTRAINT coach_ai_config_pkey PRIMARY KEY (id);


--
-- Name: coach_ai_documents coach_ai_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_documents
    ADD CONSTRAINT coach_ai_documents_pkey PRIMARY KEY (id);


--
-- Name: coach_alerts coach_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_alerts
    ADD CONSTRAINT coach_alerts_pkey PRIMARY KEY (id);


--
-- Name: coach_assignments coach_assignments_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_client_id_key UNIQUE (client_id);


--
-- Name: coach_assignments coach_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_pkey PRIMARY KEY (id);


--
-- Name: coaching_goals coaching_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_goals
    ADD CONSTRAINT coaching_goals_pkey PRIMARY KEY (id);


--
-- Name: coaching_milestones coaching_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_milestones
    ADD CONSTRAINT coaching_milestones_pkey PRIMARY KEY (id);


--
-- Name: coaching_sessions coaching_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_sessions
    ADD CONSTRAINT coaching_sessions_pkey PRIMARY KEY (id);


--
-- Name: commission_rules commission_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_pkey PRIMARY KEY (id);


--
-- Name: commission_rules commission_rules_setter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_setter_id_key UNIQUE (setter_id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: communities communities_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_slug_key UNIQUE (slug);


--
-- Name: community_members community_members_community_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_user_id_key UNIQUE (community_id, user_id);


--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);


--
-- Name: competition_participants competition_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_participants
    ADD CONSTRAINT competition_participants_pkey PRIMARY KEY (id);


--
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- Name: contact_interactions contact_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_interactions
    ADD CONSTRAINT contact_interactions_pkey PRIMARY KEY (id);


--
-- Name: contract_renewal_logs contract_renewal_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_renewal_logs
    ADD CONSTRAINT contract_renewal_logs_pkey PRIMARY KEY (id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: course_prerequisites course_prerequisites_course_id_prerequisite_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_course_id_prerequisite_id_key UNIQUE (course_id, prerequisite_id);


--
-- Name: course_prerequisites course_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);


--
-- Name: currency_rates currency_rates_base_target_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_rates
    ADD CONSTRAINT currency_rates_base_target_key UNIQUE (base, target);


--
-- Name: currency_rates currency_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_rates
    ADD CONSTRAINT currency_rates_pkey PRIMARY KEY (id);


--
-- Name: custom_roles custom_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_name_key UNIQUE (name);


--
-- Name: custom_roles custom_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_user_id_activity_date_activity_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_user_id_activity_date_activity_type_key UNIQUE (user_id, activity_date, activity_type);


--
-- Name: daily_checkins daily_checkins_client_id_checkin_date_checkin_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_checkins
    ADD CONSTRAINT daily_checkins_client_id_checkin_date_checkin_type_key UNIQUE (client_id, checkin_date, checkin_type);


--
-- Name: daily_checkins daily_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_checkins
    ADD CONSTRAINT daily_checkins_pkey PRIMARY KEY (id);


--
-- Name: dashboard_layouts dashboard_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT dashboard_layouts_pkey PRIMARY KEY (id);


--
-- Name: dashboard_layouts dashboard_layouts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT dashboard_layouts_user_id_key UNIQUE (user_id);


--
-- Name: enrichment_results enrichment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrichment_results
    ADD CONSTRAINT enrichment_results_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: exercise_submissions exercise_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_submissions
    ADD CONSTRAINT exercise_submissions_pkey PRIMARY KEY (id);


--
-- Name: faq_entries faq_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_entries
    ADD CONSTRAINT faq_entries_pkey PRIMARY KEY (id);


--
-- Name: faq_question_logs faq_question_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_question_logs
    ADD CONSTRAINT faq_question_logs_pkey PRIMARY KEY (id);


--
-- Name: feed_comments feed_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_pkey PRIMARY KEY (id);


--
-- Name: feed_likes feed_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_pkey PRIMARY KEY (id);


--
-- Name: feed_likes feed_likes_post_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_post_id_profile_id_key UNIQUE (post_id, profile_id);


--
-- Name: feed_posts feed_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_posts
    ADD CONSTRAINT feed_posts_pkey PRIMARY KEY (id);


--
-- Name: feed_reports feed_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reports
    ADD CONSTRAINT feed_reports_pkey PRIMARY KEY (id);


--
-- Name: financial_entries financial_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_pkey PRIMARY KEY (id);


--
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: formation_enrollments formation_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formation_enrollments
    ADD CONSTRAINT formation_enrollments_pkey PRIMARY KEY (id);


--
-- Name: formation_enrollments formation_enrollments_user_id_formation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formation_enrollments
    ADD CONSTRAINT formation_enrollments_user_id_formation_id_key UNIQUE (user_id, formation_id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- Name: google_calendar_tokens google_calendar_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY (id);


--
-- Name: google_calendar_tokens google_calendar_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_user_id_key UNIQUE (user_id);


--
-- Name: hall_of_fame hall_of_fame_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hall_of_fame
    ADD CONSTRAINT hall_of_fame_pkey PRIMARY KEY (id);


--
-- Name: instagram_accounts instagram_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_accounts
    ADD CONSTRAINT instagram_accounts_pkey PRIMARY KEY (id);


--
-- Name: instagram_post_stats instagram_post_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_post_stats
    ADD CONSTRAINT instagram_post_stats_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: journal_attachments journal_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_attachments
    ADD CONSTRAINT journal_attachments_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_prompts journal_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_prompts
    ADD CONSTRAINT journal_prompts_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base_entries knowledge_base_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base_entries
    ADD CONSTRAINT knowledge_base_entries_pkey PRIMARY KEY (id);


--
-- Name: kpi_goals kpi_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_goals
    ADD CONSTRAINT kpi_goals_pkey PRIMARY KEY (id);


--
-- Name: lesson_action_completions lesson_action_completions_action_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_action_completions
    ADD CONSTRAINT lesson_action_completions_action_id_user_id_key UNIQUE (action_id, user_id);


--
-- Name: lesson_action_completions lesson_action_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_action_completions
    ADD CONSTRAINT lesson_action_completions_pkey PRIMARY KEY (id);


--
-- Name: lesson_actions lesson_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_actions
    ADD CONSTRAINT lesson_actions_pkey PRIMARY KEY (id);


--
-- Name: lesson_comments lesson_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_lesson_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_student_id_key UNIQUE (lesson_id, student_id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: level_config level_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_config
    ADD CONSTRAINT level_config_pkey PRIMARY KEY (level);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: message_bookmarks message_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_bookmarks
    ADD CONSTRAINT message_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: message_bookmarks message_bookmarks_user_id_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_bookmarks
    ADD CONSTRAINT message_bookmarks_user_id_message_id_key UNIQUE (user_id, message_id);


--
-- Name: message_reactions message_reactions_message_id_profile_id_emoji_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_message_id_profile_id_emoji_key UNIQUE (message_id, profile_id, emoji);


--
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- Name: message_templates message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: miro_boards miro_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_boards
    ADD CONSTRAINT miro_boards_pkey PRIMARY KEY (id);


--
-- Name: miro_cards miro_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_cards
    ADD CONSTRAINT miro_cards_pkey PRIMARY KEY (id);


--
-- Name: miro_connections miro_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_connections
    ADD CONSTRAINT miro_connections_pkey PRIMARY KEY (id);


--
-- Name: miro_sections miro_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_sections
    ADD CONSTRAINT miro_sections_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offboarding_requests offboarding_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_pkey PRIMARY KEY (id);


--
-- Name: onboarding_checklist_items onboarding_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_checklist_items
    ADD CONSTRAINT onboarding_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: onboarding_checklist_items onboarding_checklist_items_user_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_checklist_items
    ADD CONSTRAINT onboarding_checklist_items_user_id_key_key UNIQUE (user_id, key);


--
-- Name: onboarding_offers onboarding_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_offers
    ADD CONSTRAINT onboarding_offers_pkey PRIMARY KEY (id);


--
-- Name: onboarding_offers onboarding_offers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_offers
    ADD CONSTRAINT onboarding_offers_slug_key UNIQUE (slug);


--
-- Name: onboarding_progress onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);


--
-- Name: onboarding_progress onboarding_progress_user_id_step_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_user_id_step_key UNIQUE (user_id, step);


--
-- Name: onboarding_steps onboarding_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_steps
    ADD CONSTRAINT onboarding_steps_pkey PRIMARY KEY (id);


--
-- Name: onboarding_steps onboarding_steps_profile_id_step_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_steps
    ADD CONSTRAINT onboarding_steps_profile_id_step_key_key UNIQUE (profile_id, step_key);


--
-- Name: payment_reminders payment_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_pkey PRIMARY KEY (id);


--
-- Name: payment_schedules payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_pkey PRIMARY KEY (id);


--
-- Name: pipeline_columns pipeline_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_columns
    ADD CONSTRAINT pipeline_columns_pkey PRIMARY KEY (id);


--
-- Name: pre_call_answers pre_call_answers_call_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_call_answers
    ADD CONSTRAINT pre_call_answers_call_id_user_id_key UNIQUE (call_id, user_id);


--
-- Name: pre_call_answers pre_call_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_call_answers
    ADD CONSTRAINT pre_call_answers_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_slug_key UNIQUE (slug);


--
-- Name: relance_enrollments relance_enrollments_contact_id_sequence_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_enrollments
    ADD CONSTRAINT relance_enrollments_contact_id_sequence_id_key UNIQUE (contact_id, sequence_id);


--
-- Name: relance_enrollments relance_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_enrollments
    ADD CONSTRAINT relance_enrollments_pkey PRIMARY KEY (id);


--
-- Name: relance_logs relance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_logs
    ADD CONSTRAINT relance_logs_pkey PRIMARY KEY (id);


--
-- Name: relance_sequences relance_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_sequences
    ADD CONSTRAINT relance_sequences_pkey PRIMARY KEY (id);


--
-- Name: relance_steps relance_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_steps
    ADD CONSTRAINT relance_steps_pkey PRIMARY KEY (id);


--
-- Name: replays replays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replays
    ADD CONSTRAINT replays_pkey PRIMARY KEY (id);


--
-- Name: resource_folder_access resource_folder_access_folder_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folder_access
    ADD CONSTRAINT resource_folder_access_folder_id_user_id_key UNIQUE (folder_id, user_id);


--
-- Name: resource_folder_access resource_folder_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folder_access
    ADD CONSTRAINT resource_folder_access_pkey PRIMARY KEY (id);


--
-- Name: resource_folders resource_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folders
    ADD CONSTRAINT resource_folders_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: reward_redemptions reward_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: rituals rituals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rituals
    ADD CONSTRAINT rituals_pkey PRIMARY KEY (id);


--
-- Name: roadmap_milestones roadmap_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_milestones
    ADD CONSTRAINT roadmap_milestones_pkey PRIMARY KEY (id);


--
-- Name: saved_segments saved_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_segments
    ADD CONSTRAINT saved_segments_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: setter_activities setter_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_activities
    ADD CONSTRAINT setter_activities_pkey PRIMARY KEY (id);


--
-- Name: setter_activities setter_activities_user_client_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_activities
    ADD CONSTRAINT setter_activities_user_client_date_key UNIQUE (user_id, client_id, date);


--
-- Name: setter_leads setter_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_leads
    ADD CONSTRAINT setter_leads_pkey PRIMARY KEY (id);


--
-- Name: sms_reminders sms_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_reminders
    ADD CONSTRAINT sms_reminders_pkey PRIMARY KEY (id);


--
-- Name: social_content social_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content
    ADD CONSTRAINT social_content_pkey PRIMARY KEY (id);


--
-- Name: streaks streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_pkey PRIMARY KEY (id);


--
-- Name: streaks streaks_user_id_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_user_id_type_key UNIQUE (user_id, type);


--
-- Name: student_activities student_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_activities
    ADD CONSTRAINT student_activities_pkey PRIMARY KEY (id);


--
-- Name: student_details student_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_pkey PRIMARY KEY (id);


--
-- Name: student_details student_details_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_profile_id_key UNIQUE (profile_id);


--
-- Name: student_flag_history student_flag_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_flag_history
    ADD CONSTRAINT student_flag_history_pkey PRIMARY KEY (id);


--
-- Name: student_notes student_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_pkey PRIMARY KEY (id);


--
-- Name: student_tasks student_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_tasks
    ADD CONSTRAINT student_tasks_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: call_summaries unique_call_summary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_summaries
    ADD CONSTRAINT unique_call_summary UNIQUE (call_id);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: upsell_opportunities upsell_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_opportunities
    ADD CONSTRAINT upsell_opportunities_pkey PRIMARY KEY (id);


--
-- Name: upsell_rules upsell_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_rules
    ADD CONSTRAINT upsell_rules_pkey PRIMARY KEY (id);


--
-- Name: upsell_triggers upsell_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_triggers
    ADD CONSTRAINT upsell_triggers_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_profile_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_profile_id_badge_id_key UNIQUE (profile_id, badge_id);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_user_id_consent_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_consent_type_key UNIQUE (user_id, consent_type);


--
-- Name: user_follows user_follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- Name: user_invites user_invites_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invites
    ADD CONSTRAINT user_invites_invite_code_key UNIQUE (invite_code);


--
-- Name: user_invites user_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invites
    ADD CONSTRAINT user_invites_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: video_responses video_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_responses
    ADD CONSTRAINT video_responses_pkey PRIMARY KEY (id);


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: weekly_checkins weekly_checkins_client_id_week_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_checkins
    ADD CONSTRAINT weekly_checkins_client_id_week_start_key UNIQUE (client_id, week_start);


--
-- Name: weekly_checkins weekly_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_checkins
    ADD CONSTRAINT weekly_checkins_pkey PRIMARY KEY (id);


--
-- Name: workbook_submissions workbook_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbook_submissions
    ADD CONSTRAINT workbook_submissions_pkey PRIMARY KEY (id);


--
-- Name: workbooks workbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_pkey PRIMARY KEY (id);


--
-- Name: xp_config xp_config_action_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_config
    ADD CONSTRAINT xp_config_action_key UNIQUE (action);


--
-- Name: xp_config xp_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_config
    ADD CONSTRAINT xp_config_pkey PRIMARY KEY (id);


--
-- Name: xp_transactions xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages USING btree (conversation_id, created_at);


--
-- Name: idx_ai_questions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_questions_user ON public.ai_question_log USING btree (user_id);


--
-- Name: idx_ai_reports_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_reports_unread ON public.ai_reports USING btree (user_id) WHERE (read_at IS NULL);


--
-- Name: idx_ai_reports_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_reports_user_type ON public.ai_reports USING btree (user_id, type, generated_at DESC);


--
-- Name: idx_announcement_dismissals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcement_dismissals_user ON public.announcement_dismissals USING btree (user_id);


--
-- Name: idx_announcements_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_active ON public.announcements USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_api_keys_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_hash ON public.api_keys USING btree (key_hash);


--
-- Name: idx_api_keys_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_owner ON public.api_keys USING btree (owner_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_availability_overrides_coach_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_overrides_coach_date ON public.availability_overrides USING btree (coach_id, override_date);


--
-- Name: idx_availability_slots_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_slots_coach ON public.availability_slots USING btree (coach_id);


--
-- Name: idx_booking_availability_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_availability_page ON public.booking_availability USING btree (booking_page_id);


--
-- Name: idx_booking_exceptions_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_exceptions_page ON public.booking_exceptions USING btree (booking_page_id);


--
-- Name: idx_booking_page_views_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_page_views_created ON public.booking_page_views USING btree (created_at);


--
-- Name: idx_booking_page_views_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_page_views_page ON public.booking_page_views USING btree (booking_page_id);


--
-- Name: idx_booking_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_pages_slug ON public.booking_pages USING btree (slug);


--
-- Name: idx_bookings_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_date ON public.bookings USING btree (date);


--
-- Name: idx_bookings_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_page ON public.bookings USING btree (booking_page_id);


--
-- Name: idx_branding_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branding_pages_slug ON public.branding_pages USING btree (slug);


--
-- Name: idx_branding_singleton; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_branding_singleton ON public.branding_settings USING btree ((true));


--
-- Name: idx_calendar_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_created_by ON public.calendar_events USING btree (created_by);


--
-- Name: idx_calendar_events_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_events_start ON public.calendar_events USING btree (start_at);


--
-- Name: idx_call_calendar_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_calendar_assigned_to ON public.call_calendar USING btree (assigned_to);


--
-- Name: idx_call_calendar_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_calendar_client_id ON public.call_calendar USING btree (client_id);


--
-- Name: idx_call_calendar_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_calendar_date ON public.call_calendar USING btree (date);


--
-- Name: idx_call_notes_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_notes_author ON public.call_notes USING btree (author_id);


--
-- Name: idx_call_notes_call_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_notes_call_id ON public.call_notes USING btree (call_id);


--
-- Name: idx_call_session_notes_call; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_session_notes_call ON public.call_session_notes USING btree (call_id);


--
-- Name: idx_call_summaries_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_summaries_author_id ON public.call_summaries USING btree (author_id);


--
-- Name: idx_call_summaries_call_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_summaries_call_id ON public.call_summaries USING btree (call_id);


--
-- Name: idx_call_transcripts_call_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_call_transcripts_call_id ON public.call_transcripts USING btree (call_id);


--
-- Name: idx_certificate_entries_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_entries_course ON public.certificate_entries USING btree (course_id);


--
-- Name: idx_certificate_entries_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_entries_student ON public.certificate_entries USING btree (student_id);


--
-- Name: idx_certificates_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_course ON public.certificates USING btree (course_id);


--
-- Name: idx_certificates_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_student ON public.certificates USING btree (student_id);


--
-- Name: idx_challenge_participants_challenge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants USING btree (challenge_id);


--
-- Name: idx_challenge_participants_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenge_participants_profile_id ON public.challenge_participants USING btree (profile_id);


--
-- Name: idx_challenges_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_active ON public.challenges USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_challenges_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_dates ON public.challenges USING btree (starts_at, ends_at);


--
-- Name: idx_channel_members_channel_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_members_channel_profile ON public.channel_members USING btree (channel_id, profile_id);


--
-- Name: idx_channel_members_last_read_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_members_last_read_at ON public.channel_members USING btree (channel_id, last_read_at DESC);


--
-- Name: idx_channel_members_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_members_profile ON public.channel_members USING btree (profile_id);


--
-- Name: idx_channel_members_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_members_profile_id ON public.channel_members USING btree (profile_id);


--
-- Name: idx_channels_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channels_archived ON public.channels USING btree (is_archived) WHERE (is_archived = false);


--
-- Name: idx_channels_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channels_type ON public.channels USING btree (type);


--
-- Name: idx_checkins_client_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkins_client_date ON public.checkins USING btree (client_id, date DESC);


--
-- Name: idx_client_ai_memory_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_ai_memory_client ON public.client_ai_memory USING btree (client_id);


--
-- Name: idx_client_ai_memory_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_ai_memory_coach ON public.client_ai_memory USING btree (coach_id);


--
-- Name: idx_client_flags_flag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_flags_flag ON public.client_flags USING btree (flag);


--
-- Name: idx_client_roadmaps_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_roadmaps_client ON public.client_roadmaps USING btree (client_id);


--
-- Name: idx_closer_calls_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_closer_calls_client_id ON public.closer_calls USING btree (client_id);


--
-- Name: idx_coach_ai_chunks_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_ai_chunks_coach ON public.coach_ai_chunks USING btree (coach_id);


--
-- Name: idx_coach_ai_chunks_document; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_ai_chunks_document ON public.coach_ai_chunks USING btree (document_id);


--
-- Name: idx_coach_ai_chunks_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_ai_chunks_embedding ON public.coach_ai_chunks USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='50');


--
-- Name: idx_coach_ai_documents_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_ai_documents_coach ON public.coach_ai_documents USING btree (coach_id);


--
-- Name: idx_coach_alerts_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_alerts_client_id ON public.coach_alerts USING btree (client_id);


--
-- Name: idx_coach_alerts_coach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_alerts_coach_id ON public.coach_alerts USING btree (coach_id);


--
-- Name: idx_coach_alerts_is_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_alerts_is_resolved ON public.coach_alerts USING btree (is_resolved) WHERE (is_resolved = false);


--
-- Name: idx_coach_assignments_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_assignments_client_id ON public.coach_assignments USING btree (client_id);


--
-- Name: idx_coach_assignments_coach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_assignments_coach_id ON public.coach_assignments USING btree (coach_id);


--
-- Name: idx_coach_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coach_assignments_status ON public.coach_assignments USING btree (status);


--
-- Name: idx_coaching_goals_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_goals_client_id ON public.coaching_goals USING btree (client_id);


--
-- Name: idx_coaching_goals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_goals_status ON public.coaching_goals USING btree (status);


--
-- Name: idx_coaching_milestones_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_milestones_goal ON public.coaching_milestones USING btree (goal_id);


--
-- Name: idx_coaching_sessions_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_sessions_client ON public.coaching_sessions USING btree (client_id);


--
-- Name: idx_coaching_sessions_coach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_sessions_coach ON public.coaching_sessions USING btree (coach_id);


--
-- Name: idx_coaching_sessions_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_sessions_scheduled ON public.coaching_sessions USING btree (scheduled_at);


--
-- Name: idx_coaching_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coaching_sessions_status ON public.coaching_sessions USING btree (status);


--
-- Name: idx_commissions_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_contractor ON public.commissions USING btree (contractor_id);


--
-- Name: idx_communities_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_communities_slug ON public.communities USING btree (slug);


--
-- Name: idx_community_members_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_members_community ON public.community_members USING btree (community_id);


--
-- Name: idx_community_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_members_user ON public.community_members USING btree (user_id);


--
-- Name: idx_comp_participants_comp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comp_participants_comp ON public.competition_participants USING btree (competition_id);


--
-- Name: idx_competitions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_competitions_status ON public.competitions USING btree (status);


--
-- Name: idx_contact_interactions_contact_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_interactions_contact_created ON public.contact_interactions USING btree (contact_id, created_at DESC);


--
-- Name: idx_contracts_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_client_id ON public.contracts USING btree (client_id);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- Name: idx_course_prerequisites_prereq; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_prerequisites_prereq ON public.course_prerequisites USING btree (prerequisite_course_id);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_crm_contacts_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_assigned ON public.crm_contacts USING btree (assigned_to);


--
-- Name: idx_crm_contacts_closer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_closer_id ON public.crm_contacts USING btree (closer_id) WHERE (closer_id IS NOT NULL);


--
-- Name: idx_crm_contacts_closer_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_closer_stage ON public.crm_contacts USING btree (closer_stage) WHERE (closer_stage IS NOT NULL);


--
-- Name: idx_crm_contacts_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_created_by ON public.crm_contacts USING btree (created_by);


--
-- Name: idx_crm_contacts_enrichment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_enrichment_status ON public.crm_contacts USING btree (enrichment_status) WHERE (enrichment_status IS NOT NULL);


--
-- Name: idx_crm_contacts_lead_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_lead_score ON public.crm_contacts USING btree (lead_score);


--
-- Name: idx_crm_contacts_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_sort ON public.crm_contacts USING btree (stage, sort_order);


--
-- Name: idx_crm_contacts_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_stage ON public.crm_contacts USING btree (stage);


--
-- Name: idx_custom_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_custom_roles_active ON public.custom_roles USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_daily_activity_profile_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_activity_profile_date ON public.daily_activity USING btree (profile_id, activity_date DESC);


--
-- Name: idx_daily_checkins_client_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_checkins_client_date ON public.daily_checkins USING btree (client_id, checkin_date DESC);


--
-- Name: idx_daily_checkins_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_checkins_client_id ON public.daily_checkins USING btree (client_id);


--
-- Name: idx_daily_checkins_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_checkins_date ON public.daily_checkins USING btree (checkin_date DESC);


--
-- Name: idx_dashboard_layouts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_layouts_user_id ON public.dashboard_layouts USING btree (user_id);


--
-- Name: idx_enrichment_results_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrichment_results_contact ON public.enrichment_results USING btree (contact_id);


--
-- Name: idx_enrichment_results_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrichment_results_platform ON public.enrichment_results USING btree (platform);


--
-- Name: idx_error_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC);


--
-- Name: idx_error_logs_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_page ON public.error_logs USING btree (page);


--
-- Name: idx_error_logs_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_resolved ON public.error_logs USING btree (resolved);


--
-- Name: idx_error_logs_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_error_logs_source ON public.error_logs USING btree (source);


--
-- Name: idx_faq_entries_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faq_entries_category ON public.faq_entries USING btree (category);


--
-- Name: idx_faq_entries_occurrence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faq_entries_occurrence ON public.faq_entries USING btree (occurrence_count DESC);


--
-- Name: idx_feed_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_comments_parent_id ON public.feed_comments USING btree (parent_id);


--
-- Name: idx_feed_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_comments_post_id ON public.feed_comments USING btree (post_id);


--
-- Name: idx_feed_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_likes_post_id ON public.feed_likes USING btree (post_id);


--
-- Name: idx_feed_likes_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_likes_profile_id ON public.feed_likes USING btree (profile_id);


--
-- Name: idx_feed_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_posts_author_id ON public.feed_posts USING btree (author_id);


--
-- Name: idx_feed_posts_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_posts_category ON public.feed_posts USING btree (category);


--
-- Name: idx_feed_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_posts_created_at ON public.feed_posts USING btree (created_at DESC);


--
-- Name: idx_feed_posts_is_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_posts_is_pinned ON public.feed_posts USING btree (is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_feed_posts_post_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_posts_post_type ON public.feed_posts USING btree (post_type);


--
-- Name: idx_feed_reports_reporter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_reports_reporter ON public.feed_reports USING btree (reporter_id);


--
-- Name: idx_feed_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_reports_status ON public.feed_reports USING btree (status);


--
-- Name: idx_flag_history_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flag_history_student ON public.student_flag_history USING btree (student_id);


--
-- Name: idx_form_submissions_form; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submissions_form ON public.form_submissions USING btree (form_id, submitted_at DESC);


--
-- Name: idx_form_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_templates_category ON public.form_templates USING btree (category);


--
-- Name: idx_forms_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forms_creator ON public.forms USING btree (created_by);


--
-- Name: idx_forms_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forms_status ON public.forms USING btree (status);


--
-- Name: idx_invoices_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);


--
-- Name: idx_invoices_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_journal_attachments_entry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_attachments_entry ON public.journal_attachments USING btree (journal_entry_id);


--
-- Name: idx_journal_entries_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_author_id ON public.journal_entries USING btree (author_id);


--
-- Name: idx_journal_entries_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_created_at ON public.journal_entries USING btree (created_at DESC);


--
-- Name: idx_kb_entries_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kb_entries_category ON public.knowledge_base_entries USING btree (category);


--
-- Name: idx_lesson_actions_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_actions_lesson ON public.lesson_actions USING btree (lesson_id);


--
-- Name: idx_lesson_progress_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_student ON public.lesson_progress USING btree (student_id);


--
-- Name: idx_message_bookmarks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_bookmarks_user ON public.message_bookmarks USING btree (user_id);


--
-- Name: idx_message_reactions_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_reactions_message_id ON public.message_reactions USING btree (message_id);


--
-- Name: idx_messages_channel_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_channel_created ON public.messages USING btree (channel_id, created_at DESC);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, is_read, created_at DESC);


--
-- Name: idx_offboarding_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offboarding_status ON public.offboarding_requests USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'in_progress'::text]));


--
-- Name: idx_offboarding_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offboarding_user ON public.offboarding_requests USING btree (user_id);


--
-- Name: idx_onboarding_checklist_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_checklist_user ON public.onboarding_checklist_items USING btree (user_id);


--
-- Name: idx_onboarding_offers_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_offers_slug ON public.onboarding_offers USING btree (slug);


--
-- Name: idx_onboarding_steps_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_steps_profile ON public.onboarding_steps USING btree (profile_id);


--
-- Name: idx_onboarding_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_user ON public.onboarding_progress USING btree (user_id);


--
-- Name: idx_payment_reminders_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reminders_invoice_id ON public.payment_reminders USING btree (invoice_id);


--
-- Name: idx_payment_reminders_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reminders_scheduled_at ON public.payment_reminders USING btree (scheduled_at);


--
-- Name: idx_payment_schedules_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_schedules_client_id ON public.payment_schedules USING btree (client_id);


--
-- Name: idx_pipeline_columns_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_columns_client ON public.pipeline_columns USING btree (client_id);


--
-- Name: idx_pre_call_answers_call; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_call_answers_call ON public.pre_call_answers USING btree (call_id);


--
-- Name: idx_profiles_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_archived ON public.profiles USING btree (is_archived) WHERE (is_archived = true);


--
-- Name: idx_profiles_specialties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_specialties ON public.profiles USING gin (specialties);


--
-- Name: idx_quiz_attempts_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempts_lesson ON public.quiz_attempts USING btree (lesson_id);


--
-- Name: idx_quiz_attempts_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts USING btree (student_id);


--
-- Name: idx_relance_enrollments_next; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relance_enrollments_next ON public.relance_enrollments USING btree (next_step_at) WHERE (status = 'active'::text);


--
-- Name: idx_replays_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_replays_category ON public.replays USING btree (category);


--
-- Name: idx_replays_coach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_replays_coach_id ON public.replays USING btree (coach_id);


--
-- Name: idx_resource_folder_access_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_folder_access_folder ON public.resource_folder_access USING btree (folder_id);


--
-- Name: idx_resource_folder_access_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_folder_access_user ON public.resource_folder_access USING btree (user_id);


--
-- Name: idx_resources_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_folder_id ON public.resources USING btree (folder_id);


--
-- Name: idx_reward_redemptions_reward_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_redemptions_reward_id ON public.reward_redemptions USING btree (reward_id);


--
-- Name: idx_reward_redemptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reward_redemptions_user_id ON public.reward_redemptions USING btree (user_id);


--
-- Name: idx_rewards_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rewards_active ON public.rewards USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_rituals_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rituals_active ON public.rituals USING btree (profile_id) WHERE (is_active = true);


--
-- Name: idx_rituals_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rituals_profile ON public.rituals USING btree (profile_id);


--
-- Name: idx_roadmap_milestones_roadmap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roadmap_milestones_roadmap ON public.roadmap_milestones USING btree (roadmap_id);


--
-- Name: idx_sessions_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_client_id ON public.sessions USING btree (client_id);


--
-- Name: idx_sessions_coach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_coach_id ON public.sessions USING btree (coach_id);


--
-- Name: idx_sessions_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_scheduled_at ON public.sessions USING btree (scheduled_at);


--
-- Name: idx_setter_activities_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_setter_activities_user ON public.setter_activities USING btree (user_id);


--
-- Name: idx_setter_activities_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_setter_activities_user_date ON public.setter_activities USING btree (user_id, date DESC);


--
-- Name: idx_setter_leads_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_setter_leads_client ON public.setter_leads USING btree (client_id);


--
-- Name: idx_setter_leads_column; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_setter_leads_column ON public.setter_leads USING btree (column_id);


--
-- Name: idx_setter_leads_setter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_setter_leads_setter ON public.setter_leads USING btree (setter_id);


--
-- Name: idx_sms_reminders_status_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_reminders_status_scheduled ON public.sms_reminders USING btree (status, scheduled_at) WHERE (status = 'pending'::text);


--
-- Name: idx_sms_reminders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_reminders_user_id ON public.sms_reminders USING btree (user_id);


--
-- Name: idx_social_content_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_content_created_by ON public.social_content USING btree (created_by);


--
-- Name: idx_social_content_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_content_platform ON public.social_content USING btree (platform);


--
-- Name: idx_social_content_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_content_status ON public.social_content USING btree (status);


--
-- Name: idx_streaks_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_streaks_profile ON public.streaks USING btree (profile_id);


--
-- Name: idx_streaks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_streaks_user ON public.streaks USING btree (user_id);


--
-- Name: idx_student_activities_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_activities_student ON public.student_activities USING btree (student_id, created_at DESC);


--
-- Name: idx_student_details_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_details_profile ON public.student_details USING btree (profile_id);


--
-- Name: idx_student_notes_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_notes_student ON public.student_notes USING btree (student_id);


--
-- Name: idx_student_tasks_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_tasks_student ON public.student_tasks USING btree (student_id);


--
-- Name: idx_submissions_form; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_form ON public.form_submissions USING btree (form_id);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status, created_at DESC);


--
-- Name: idx_support_tickets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user ON public.support_tickets USING btree (user_id, created_at DESC);


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- Name: idx_upsell_rules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upsell_rules_active ON public.upsell_rules USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_upsell_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upsell_student ON public.upsell_opportunities USING btree (student_id);


--
-- Name: idx_upsell_triggers_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upsell_triggers_client ON public.upsell_triggers USING btree (client_id);


--
-- Name: idx_upsell_triggers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upsell_triggers_status ON public.upsell_triggers USING btree (status);


--
-- Name: idx_user_badges_badge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_badge_id ON public.user_badges USING btree (badge_id);


--
-- Name: idx_user_badges_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_profile_id ON public.user_badges USING btree (profile_id);


--
-- Name: idx_user_consents_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_user ON public.user_consents USING btree (user_id);


--
-- Name: idx_user_follows_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_follows_follower ON public.user_follows USING btree (follower_id);


--
-- Name: idx_user_follows_following; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_follows_following ON public.user_follows USING btree (following_id);


--
-- Name: idx_user_invites_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_invites_code ON public.user_invites USING btree (invite_code);


--
-- Name: idx_user_invites_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_invites_email ON public.user_invites USING btree (email);


--
-- Name: idx_user_invites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_invites_status ON public.user_invites USING btree (status);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_video_responses_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_responses_recipient ON public.video_responses USING btree (recipient_id);


--
-- Name: idx_video_responses_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_responses_sender ON public.video_responses USING btree (sender_id);


--
-- Name: idx_wb_submissions_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wb_submissions_client ON public.workbook_submissions USING btree (client_id);


--
-- Name: idx_wb_submissions_workbook; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wb_submissions_workbook ON public.workbook_submissions USING btree (workbook_id);


--
-- Name: idx_webhook_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_logs_created ON public.webhook_logs USING btree (created_at DESC);


--
-- Name: idx_webhook_logs_webhook; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs USING btree (webhook_id);


--
-- Name: idx_webhooks_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_owner ON public.webhooks USING btree (owner_id);


--
-- Name: idx_weekly_checkins_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_weekly_checkins_client_id ON public.weekly_checkins USING btree (client_id);


--
-- Name: idx_weekly_checkins_week_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_weekly_checkins_week_start ON public.weekly_checkins USING btree (week_start DESC);


--
-- Name: idx_workbooks_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workbooks_course ON public.workbooks USING btree (course_id) WHERE (course_id IS NOT NULL);


--
-- Name: idx_workbooks_module_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workbooks_module_type ON public.workbooks USING btree (module_type);


--
-- Name: idx_xp_transactions_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_transactions_action ON public.xp_transactions USING btree (action);


--
-- Name: idx_xp_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_transactions_created_at ON public.xp_transactions USING btree (created_at DESC);


--
-- Name: idx_xp_transactions_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_transactions_profile ON public.xp_transactions USING btree (profile_id, created_at DESC);


--
-- Name: idx_xp_transactions_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_transactions_profile_id ON public.xp_transactions USING btree (profile_id);


--
-- Name: app_settings app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branding_settings branding_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER branding_updated_at BEFORE UPDATE ON public.branding_settings FOR EACH ROW EXECUTE FUNCTION public.update_branding_updated_at();


--
-- Name: call_summaries call_summaries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER call_summaries_updated_at BEFORE UPDATE ON public.call_summaries FOR EACH ROW EXECUTE FUNCTION public.update_call_summaries_updated_at();


--
-- Name: certificates on_certificate_issued; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_certificate_issued AFTER INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_issued();


--
-- Name: profiles on_client_provisioning; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_client_provisioning AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_provision_client();


--
-- Name: feed_comments on_feed_comment_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_feed_comment_change AFTER INSERT OR DELETE ON public.feed_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();


--
-- Name: feed_likes on_feed_like_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_feed_like_change AFTER INSERT OR DELETE ON public.feed_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();


--
-- Name: feed_posts on_feed_post_notify; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_feed_post_notify AFTER INSERT ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.notify_feed_post();


--
-- Name: messages on_message_notify; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_message_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_channel_members_on_message();


--
-- Name: profiles on_profile_role_set; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_role_set AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_student_profile();


--
-- Name: ai_conversations set_ai_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: call_calendar set_call_calendar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_call_calendar_updated_at BEFORE UPDATE ON public.call_calendar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: call_notes set_call_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_call_notes_updated_at BEFORE UPDATE ON public.call_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: messages set_channel_last_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_channel_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_channel_last_message();


--
-- Name: courses set_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: crm_contacts set_crm_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: forms set_forms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: invoices set_invoice_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW WHEN (((new.invoice_number IS NULL) OR (new.invoice_number = ''::text))) EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: lessons set_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: messages set_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: resource_folders set_resource_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_resource_folders_updated_at BEFORE UPDATE ON public.resource_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_details set_student_details_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_student_details_updated_at BEFORE UPDATE ON public.student_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: student_notes set_student_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_student_notes_updated_at BEFORE UPDATE ON public.student_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: support_tickets support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_details trg_sync_flag_to_client_flags; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_flag_to_client_flags AFTER UPDATE OF flag ON public.student_details FOR EACH ROW EXECUTE FUNCTION public.fn_sync_flag_to_client_flags();


--
-- Name: client_flags trg_sync_flag_to_student_details; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_flag_to_student_details AFTER INSERT OR UPDATE OF flag ON public.client_flags FOR EACH ROW EXECUTE FUNCTION public.fn_sync_flag_to_student_details();


--
-- Name: invoices trg_update_student_ltv; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_student_ltv AFTER UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_student_lifetime_value();


--
-- Name: weekly_checkins update_checkins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON public.weekly_checkins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: coaching_goals update_coaching_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coaching_goals_updated_at BEFORE UPDATE ON public.coaching_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_templates update_contract_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: daily_checkins update_daily_checkins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feed_comments update_feed_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feed_comments_updated_at BEFORE UPDATE ON public.feed_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: feed_posts update_feed_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_feed_posts_updated_at BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: forms update_forms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: journal_entries update_journal_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: journal_entries update_journal_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: payment_schedules update_payment_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: weekly_checkins update_weekly_checkins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_weekly_checkins_updated_at BEFORE UPDATE ON public.weekly_checkins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: webhooks webhooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_webhooks_updated_at();


--
-- Name: ai_conversations ai_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: ai_question_log ai_question_log_kb_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_question_log
    ADD CONSTRAINT ai_question_log_kb_entry_id_fkey FOREIGN KEY (kb_entry_id) REFERENCES public.knowledge_base_entries(id);


--
-- Name: ai_question_log ai_question_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_question_log
    ADD CONSTRAINT ai_question_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: ai_reports ai_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_reports
    ADD CONSTRAINT ai_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: announcement_dismissals announcement_dismissals_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_dismissals
    ADD CONSTRAINT announcement_dismissals_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_dismissals announcement_dismissals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcement_dismissals
    ADD CONSTRAINT announcement_dismissals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: availability_overrides availability_overrides_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_overrides
    ADD CONSTRAINT availability_overrides_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: availability_slots availability_slots_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: avatars avatars_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: booking_availability booking_availability_booking_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_booking_page_id_fkey FOREIGN KEY (booking_page_id) REFERENCES public.booking_pages(id) ON DELETE CASCADE;


--
-- Name: booking_exceptions booking_exceptions_booking_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_exceptions
    ADD CONSTRAINT booking_exceptions_booking_page_id_fkey FOREIGN KEY (booking_page_id) REFERENCES public.booking_pages(id) ON DELETE CASCADE;


--
-- Name: booking_page_views booking_page_views_booking_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_page_views
    ADD CONSTRAINT booking_page_views_booking_page_id_fkey FOREIGN KEY (booking_page_id) REFERENCES public.booking_pages(id) ON DELETE CASCADE;


--
-- Name: booking_pages booking_pages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_pages
    ADD CONSTRAINT booking_pages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: bookings bookings_booking_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_page_id_fkey FOREIGN KEY (booking_page_id) REFERENCES public.booking_pages(id);


--
-- Name: branding_pages branding_pages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding_pages
    ADD CONSTRAINT branding_pages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: branding_settings branding_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branding_settings
    ADD CONSTRAINT branding_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: calendar_events calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: call_calendar call_calendar_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_calendar
    ADD CONSTRAINT call_calendar_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: call_calendar call_calendar_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_calendar
    ADD CONSTRAINT call_calendar_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: call_documents call_documents_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_documents
    ADD CONSTRAINT call_documents_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: call_documents call_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_documents
    ADD CONSTRAINT call_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: call_note_templates call_note_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_note_templates
    ADD CONSTRAINT call_note_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: call_notes call_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_notes
    ADD CONSTRAINT call_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: call_notes call_notes_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_notes
    ADD CONSTRAINT call_notes_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);


--
-- Name: call_session_notes call_session_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session_notes
    ADD CONSTRAINT call_session_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: call_session_notes call_session_notes_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_session_notes
    ADD CONSTRAINT call_session_notes_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: call_summaries call_summaries_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_summaries
    ADD CONSTRAINT call_summaries_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: call_summaries call_summaries_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_summaries
    ADD CONSTRAINT call_summaries_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: call_transcripts call_transcripts_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_transcripts
    ADD CONSTRAINT call_transcripts_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: certificate_entries certificate_entries_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_entries
    ADD CONSTRAINT certificate_entries_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: certificate_entries certificate_entries_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_entries
    ADD CONSTRAINT certificate_entries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: certificates certificates_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: challenge_entries challenge_entries_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_entries
    ADD CONSTRAINT challenge_entries_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_entries challenge_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_entries
    ADD CONSTRAINT challenge_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: challenge_participants challenge_participants_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_participants challenge_participants_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: challenges challenges_badge_reward_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_badge_reward_fkey FOREIGN KEY (badge_reward) REFERENCES public.badges(id) ON DELETE SET NULL;


--
-- Name: challenges challenges_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: channel_members channel_members_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;


--
-- Name: channel_members channel_members_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: channels channels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: checkins checkins_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: client_ai_memory client_ai_memory_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ai_memory
    ADD CONSTRAINT client_ai_memory_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: client_ai_memory client_ai_memory_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ai_memory
    ADD CONSTRAINT client_ai_memory_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: client_assignments client_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_assignments
    ADD CONSTRAINT client_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: client_flag_history client_flag_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flag_history
    ADD CONSTRAINT client_flag_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);


--
-- Name: client_flags client_flags_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flags
    ADD CONSTRAINT client_flags_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: client_flags client_flags_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_flags
    ADD CONSTRAINT client_flags_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: client_roadmaps client_roadmaps_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_roadmaps
    ADD CONSTRAINT client_roadmaps_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: client_roadmaps client_roadmaps_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_roadmaps
    ADD CONSTRAINT client_roadmaps_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: client_roadmaps client_roadmaps_source_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_roadmaps
    ADD CONSTRAINT client_roadmaps_source_call_id_fkey FOREIGN KEY (source_call_id) REFERENCES public.call_calendar(id) ON DELETE SET NULL;


--
-- Name: closer_calls closer_calls_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closer_calls
    ADD CONSTRAINT closer_calls_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id);


--
-- Name: closer_calls closer_calls_closer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closer_calls
    ADD CONSTRAINT closer_calls_closer_id_fkey FOREIGN KEY (closer_id) REFERENCES public.profiles(id);


--
-- Name: closer_calls closer_calls_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closer_calls
    ADD CONSTRAINT closer_calls_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: closer_calls closer_calls_setter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.closer_calls
    ADD CONSTRAINT closer_calls_setter_id_fkey FOREIGN KEY (setter_id) REFERENCES public.profiles(id);


--
-- Name: coach_ai_chunks coach_ai_chunks_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_chunks
    ADD CONSTRAINT coach_ai_chunks_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coach_ai_chunks coach_ai_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_chunks
    ADD CONSTRAINT coach_ai_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.coach_ai_documents(id) ON DELETE CASCADE;


--
-- Name: coach_ai_config coach_ai_config_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_config
    ADD CONSTRAINT coach_ai_config_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coach_ai_documents coach_ai_documents_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_ai_documents
    ADD CONSTRAINT coach_ai_documents_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coach_alerts coach_alerts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_alerts
    ADD CONSTRAINT coach_alerts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coach_alerts coach_alerts_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_alerts
    ADD CONSTRAINT coach_alerts_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: coach_assignments coach_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: coach_assignments coach_assignments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coach_assignments coach_assignments_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coaching_goals coaching_goals_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_goals
    ADD CONSTRAINT coaching_goals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coaching_goals coaching_goals_set_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_goals
    ADD CONSTRAINT coaching_goals_set_by_fkey FOREIGN KEY (set_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: coaching_milestones coaching_milestones_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_milestones
    ADD CONSTRAINT coaching_milestones_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.coaching_goals(id) ON DELETE CASCADE;


--
-- Name: coaching_sessions coaching_sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_sessions
    ADD CONSTRAINT coaching_sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coaching_sessions coaching_sessions_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaching_sessions
    ADD CONSTRAINT coaching_sessions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: commission_rules commission_rules_setter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_setter_id_fkey FOREIGN KEY (setter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_closer_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_closer_call_id_fkey FOREIGN KEY (closer_call_id) REFERENCES public.closer_calls(id) ON DELETE SET NULL;


--
-- Name: commissions commissions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: commissions commissions_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: communities communities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: community_members community_members_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_members community_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: competition_participants competition_participants_competition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_participants
    ADD CONSTRAINT competition_participants_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;


--
-- Name: competition_participants competition_participants_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_participants
    ADD CONSTRAINT competition_participants_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: competition_participants competition_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competition_participants
    ADD CONSTRAINT competition_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: competitions competitions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: contact_interactions contact_interactions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_interactions
    ADD CONSTRAINT contact_interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;


--
-- Name: contact_interactions contact_interactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_interactions
    ADD CONSTRAINT contact_interactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: contract_renewal_logs contract_renewal_logs_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_renewal_logs
    ADD CONSTRAINT contract_renewal_logs_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_renewal_logs contract_renewal_logs_new_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_renewal_logs
    ADD CONSTRAINT contract_renewal_logs_new_contract_id_fkey FOREIGN KEY (new_contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_templates contract_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_renewed_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_renewed_to_fkey FOREIGN KEY (renewed_to) REFERENCES public.contracts(id);


--
-- Name: contracts contracts_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE SET NULL;


--
-- Name: course_prerequisites course_prerequisites_prerequisite_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_prerequisite_course_id_fkey FOREIGN KEY (prerequisite_course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: crm_contacts crm_contacts_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_contacts crm_contacts_closer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_closer_id_fkey FOREIGN KEY (closer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_contacts crm_contacts_converted_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_converted_profile_id_fkey FOREIGN KEY (converted_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: crm_contacts crm_contacts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: custom_roles custom_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_roles
    ADD CONSTRAINT custom_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: daily_activity daily_activity_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: daily_activity daily_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: daily_checkins daily_checkins_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_checkins
    ADD CONSTRAINT daily_checkins_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: dashboard_layouts dashboard_layouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT dashboard_layouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: enrichment_results enrichment_results_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrichment_results
    ADD CONSTRAINT enrichment_results_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;


--
-- Name: error_logs error_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: error_logs error_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: exercise_submissions exercise_submissions_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_submissions
    ADD CONSTRAINT exercise_submissions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: exercise_submissions exercise_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_submissions
    ADD CONSTRAINT exercise_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id);


--
-- Name: faq_entries faq_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_entries
    ADD CONSTRAINT faq_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: faq_entries faq_entries_source_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_entries
    ADD CONSTRAINT faq_entries_source_message_id_fkey FOREIGN KEY (source_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: faq_question_logs faq_question_logs_asked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_question_logs
    ADD CONSTRAINT faq_question_logs_asked_by_fkey FOREIGN KEY (asked_by) REFERENCES public.profiles(id);


--
-- Name: feed_comments feed_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id) ON DELETE CASCADE;


--
-- Name: feed_likes feed_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id) ON DELETE CASCADE;


--
-- Name: feed_likes feed_likes_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feed_posts feed_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_posts
    ADD CONSTRAINT feed_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feed_reports feed_reports_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reports
    ADD CONSTRAINT feed_reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_reports feed_reports_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reports
    ADD CONSTRAINT feed_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id) ON DELETE CASCADE;


--
-- Name: feed_reports feed_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reports
    ADD CONSTRAINT feed_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: feed_reports feed_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reports
    ADD CONSTRAINT feed_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);


--
-- Name: financial_entries financial_entries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: form_fields form_fields_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_respondent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_respondent_id_fkey FOREIGN KEY (respondent_id) REFERENCES public.profiles(id);


--
-- Name: form_templates form_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: formation_enrollments formation_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formation_enrollments
    ADD CONSTRAINT formation_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forms forms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: google_calendar_tokens google_calendar_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: hall_of_fame hall_of_fame_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hall_of_fame
    ADD CONSTRAINT hall_of_fame_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: instagram_post_stats instagram_post_stats_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_post_stats
    ADD CONSTRAINT instagram_post_stats_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.instagram_accounts(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: journal_attachments journal_attachments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_attachments
    ADD CONSTRAINT journal_attachments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: knowledge_base_entries knowledge_base_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_base_entries
    ADD CONSTRAINT knowledge_base_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: kpi_goals kpi_goals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_goals
    ADD CONSTRAINT kpi_goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lesson_action_completions lesson_action_completions_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_action_completions
    ADD CONSTRAINT lesson_action_completions_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.lesson_actions(id) ON DELETE CASCADE;


--
-- Name: lesson_action_completions lesson_action_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_action_completions
    ADD CONSTRAINT lesson_action_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lesson_actions lesson_actions_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_actions
    ADD CONSTRAINT lesson_actions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_comments lesson_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: lesson_comments lesson_comments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_comments lesson_comments_reply_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.lesson_comments(id);


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: message_attachments message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_bookmarks message_bookmarks_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_bookmarks
    ADD CONSTRAINT message_bookmarks_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_bookmarks message_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_bookmarks
    ADD CONSTRAINT message_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: message_templates message_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: messages messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);


--
-- Name: miro_boards miro_boards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_boards
    ADD CONSTRAINT miro_boards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: miro_cards miro_cards_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_cards
    ADD CONSTRAINT miro_cards_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.miro_boards(id) ON DELETE CASCADE;


--
-- Name: miro_connections miro_connections_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_connections
    ADD CONSTRAINT miro_connections_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.miro_boards(id) ON DELETE CASCADE;


--
-- Name: miro_connections miro_connections_from_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_connections
    ADD CONSTRAINT miro_connections_from_card_id_fkey FOREIGN KEY (from_card_id) REFERENCES public.miro_cards(id) ON DELETE CASCADE;


--
-- Name: miro_connections miro_connections_to_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_connections
    ADD CONSTRAINT miro_connections_to_card_id_fkey FOREIGN KEY (to_card_id) REFERENCES public.miro_cards(id) ON DELETE CASCADE;


--
-- Name: miro_sections miro_sections_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.miro_sections
    ADD CONSTRAINT miro_sections_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.miro_boards(id) ON DELETE CASCADE;


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: offboarding_requests offboarding_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: offboarding_requests offboarding_requests_transfer_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_transfer_to_id_fkey FOREIGN KEY (transfer_to_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: offboarding_requests offboarding_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offboarding_requests
    ADD CONSTRAINT offboarding_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: onboarding_checklist_items onboarding_checklist_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_checklist_items
    ADD CONSTRAINT onboarding_checklist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: onboarding_progress onboarding_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_steps onboarding_steps_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_steps
    ADD CONSTRAINT onboarding_steps_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payment_reminders payment_reminders_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: payment_schedules payment_schedules_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payment_schedules payment_schedules_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: pipeline_columns pipeline_columns_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_columns
    ADD CONSTRAINT pipeline_columns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pre_call_answers pre_call_answers_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_call_answers
    ADD CONSTRAINT pre_call_answers_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE CASCADE;


--
-- Name: pre_call_answers pre_call_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_call_answers
    ADD CONSTRAINT pre_call_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_archived_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_archived_by_fkey FOREIGN KEY (archived_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_assigned_coach_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_assigned_coach_fkey FOREIGN KEY (assigned_coach) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: quiz_submissions quiz_submissions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: quiz_submissions quiz_submissions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: relance_enrollments relance_enrollments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_enrollments
    ADD CONSTRAINT relance_enrollments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;


--
-- Name: relance_enrollments relance_enrollments_enrolled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_enrollments
    ADD CONSTRAINT relance_enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES auth.users(id);


--
-- Name: relance_enrollments relance_enrollments_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_enrollments
    ADD CONSTRAINT relance_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.relance_sequences(id) ON DELETE CASCADE;


--
-- Name: relance_sequences relance_sequences_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_sequences
    ADD CONSTRAINT relance_sequences_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: relance_steps relance_steps_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relance_steps
    ADD CONSTRAINT relance_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.relance_sequences(id) ON DELETE CASCADE;


--
-- Name: replays replays_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replays
    ADD CONSTRAINT replays_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES auth.users(id);


--
-- Name: resource_folder_access resource_folder_access_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folder_access
    ADD CONSTRAINT resource_folder_access_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.resource_folders(id) ON DELETE CASCADE;


--
-- Name: resource_folder_access resource_folder_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folder_access
    ADD CONSTRAINT resource_folder_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: resource_folders resource_folders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_folders
    ADD CONSTRAINT resource_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: resources resources_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.resource_folders(id) ON DELETE SET NULL;


--
-- Name: resources resources_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions reward_redemptions_fulfilled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_fulfilled_by_fkey FOREIGN KEY (fulfilled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: reward_redemptions reward_redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions reward_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: rewards rewards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: rituals rituals_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rituals
    ADD CONSTRAINT rituals_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: rituals rituals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rituals
    ADD CONSTRAINT rituals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: roadmap_milestones roadmap_milestones_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_milestones
    ADD CONSTRAINT roadmap_milestones_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: roadmap_milestones roadmap_milestones_roadmap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roadmap_milestones
    ADD CONSTRAINT roadmap_milestones_roadmap_id_fkey FOREIGN KEY (roadmap_id) REFERENCES public.client_roadmaps(id) ON DELETE CASCADE;


--
-- Name: saved_segments saved_segments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_segments
    ADD CONSTRAINT saved_segments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: saved_segments saved_segments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_segments
    ADD CONSTRAINT saved_segments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: setter_activities setter_activities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_activities
    ADD CONSTRAINT setter_activities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id);


--
-- Name: setter_activities setter_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_activities
    ADD CONSTRAINT setter_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: setter_leads setter_leads_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_leads
    ADD CONSTRAINT setter_leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id);


--
-- Name: setter_leads setter_leads_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_leads
    ADD CONSTRAINT setter_leads_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.pipeline_columns(id) ON DELETE SET NULL;


--
-- Name: setter_leads setter_leads_setter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setter_leads
    ADD CONSTRAINT setter_leads_setter_id_fkey FOREIGN KEY (setter_id) REFERENCES public.profiles(id);


--
-- Name: sms_reminders sms_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_reminders
    ADD CONSTRAINT sms_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: social_content social_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content
    ADD CONSTRAINT social_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: streaks streaks_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: streaks streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streaks
    ADD CONSTRAINT streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_activities student_activities_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_activities
    ADD CONSTRAINT student_activities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_details student_details_assigned_coach_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_assigned_coach_fkey FOREIGN KEY (assigned_coach) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_details student_details_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_details
    ADD CONSTRAINT student_details_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_flag_history student_flag_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_flag_history
    ADD CONSTRAINT student_flag_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_flag_history student_flag_history_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_flag_history
    ADD CONSTRAINT student_flag_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_notes student_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: student_notes student_notes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_tasks student_tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_tasks
    ADD CONSTRAINT student_tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: student_tasks student_tasks_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_tasks
    ADD CONSTRAINT student_tasks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: teams teams_captain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES public.profiles(id);


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: uploads uploads_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: upsell_opportunities upsell_opportunities_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_opportunities
    ADD CONSTRAINT upsell_opportunities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_details(id) ON DELETE CASCADE;


--
-- Name: upsell_rules upsell_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_rules
    ADD CONSTRAINT upsell_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: upsell_triggers upsell_triggers_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_triggers
    ADD CONSTRAINT upsell_triggers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: upsell_triggers upsell_triggers_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upsell_triggers
    ADD CONSTRAINT upsell_triggers_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.upsell_rules(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_consents user_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_invites user_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invites
    ADD CONSTRAINT user_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_responses video_responses_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_responses
    ADD CONSTRAINT video_responses_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: video_responses video_responses_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_responses
    ADD CONSTRAINT video_responses_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: webhook_logs webhook_logs_webhook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id) ON DELETE CASCADE;


--
-- Name: webhooks webhooks_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weekly_checkins weekly_checkins_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_checkins
    ADD CONSTRAINT weekly_checkins_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: workbook_submissions workbook_submissions_call_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbook_submissions
    ADD CONSTRAINT workbook_submissions_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.call_calendar(id) ON DELETE SET NULL;


--
-- Name: workbook_submissions workbook_submissions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbook_submissions
    ADD CONSTRAINT workbook_submissions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: workbook_submissions workbook_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbook_submissions
    ADD CONSTRAINT workbook_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: workbook_submissions workbook_submissions_workbook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbook_submissions
    ADD CONSTRAINT workbook_submissions_workbook_id_fkey FOREIGN KEY (workbook_id) REFERENCES public.workbooks(id) ON DELETE CASCADE;


--
-- Name: workbooks workbooks_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: workbooks workbooks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: xp_transactions xp_transactions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: forms Active forms visible to targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active forms visible to targets" ON public.forms FOR SELECT USING (((status = 'active'::text) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))));


--
-- Name: profiles Admin can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: coach_ai_documents Admin full access documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access documents" ON public.coach_ai_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: booking_availability Admin manage availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage availability" ON public.booking_availability USING ((public.get_my_role() = 'admin'::text));


--
-- Name: bookings Admin manage bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage bookings" ON public.bookings USING ((public.get_my_role() = 'admin'::text));


--
-- Name: booking_exceptions Admin manage exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage exceptions" ON public.booking_exceptions USING ((public.get_my_role() = 'admin'::text));


--
-- Name: booking_pages Admin manage pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage pages" ON public.booking_pages USING ((public.get_my_role() = 'admin'::text));


--
-- Name: crm_contacts Admin manages all contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manages all contacts" ON public.crm_contacts USING ((public.get_my_role() = 'admin'::text)) WITH CHECK ((public.get_my_role() = 'admin'::text));


--
-- Name: contact_interactions Admin manages all interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manages all interactions" ON public.contact_interactions USING ((public.get_my_role() = 'admin'::text)) WITH CHECK ((public.get_my_role() = 'admin'::text));


--
-- Name: client_ai_memory Admin sees all memories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin sees all memories" ON public.client_ai_memory FOR SELECT USING ((public.get_my_role() = 'admin'::text));


--
-- Name: messages Admin/Coach can delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can delete messages" ON public.messages FOR DELETE USING (((sender_id = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))));


--
-- Name: channel_members Admin/Coach can manage channel members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage channel members" ON public.channel_members USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: channels Admin/Coach can manage channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage channels" ON public.channels USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: courses Admin/Coach can manage courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage courses" ON public.courses USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: form_fields Admin/Coach can manage fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage fields" ON public.form_fields USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: forms Admin/Coach can manage forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage forms" ON public.forms USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: ai_insights Admin/Coach can manage insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage insights" ON public.ai_insights USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: lessons Admin/Coach can manage lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage lessons" ON public.lessons USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: modules Admin/Coach can manage modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage modules" ON public.modules USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_details Admin/Coach can manage student_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can manage student_details" ON public.student_details USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: messages Admin/Coach can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can view all messages" ON public.messages FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: form_submissions Admin/Coach can view all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can view all submissions" ON public.form_submissions FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: ai_insights Admin/Coach can view insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin/Coach can view insights" ON public.ai_insights FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: notifications Admins and coaches can insert notifications for anyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and coaches can insert notifications for anyone" ON public.notifications FOR INSERT WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: app_settings Admins can manage app_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage app_settings" ON public.app_settings USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: user_invites Admins can manage invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invites" ON public.user_invites USING ((public.get_my_role() = 'admin'::text));


--
-- Name: call_session_notes Admins can view all session notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all session notes" ON public.call_session_notes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: support_tickets Admins full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins full access" ON public.support_tickets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: commissions Admins manage commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage commissions" ON public.commissions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: contract_templates All authenticated can view active templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated can view active templates" ON public.contract_templates FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: badges All can read badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All can read badges" ON public.badges FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: challenges All can read challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All can read challenges" ON public.challenges FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: level_config All can read level_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All can read level_config" ON public.level_config FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: xp_config All can read xp_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All can read xp_config" ON public.xp_config FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: coach_ai_config Anyone can read AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read AI config" ON public.coach_ai_config FOR SELECT USING (true);


--
-- Name: badges Anyone can view badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);


--
-- Name: lesson_actions Anyone can view lesson actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view lesson actions" ON public.lesson_actions FOR SELECT USING (true);


--
-- Name: rewards Anyone can view rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING ((is_active = true));


--
-- Name: bookings Auth read bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth read bookings" ON public.bookings FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: booking_page_views Auth read views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth read views" ON public.booking_page_views FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: lesson_comments Authenticated can add comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can add comments" ON public.lesson_comments FOR INSERT WITH CHECK ((author_id = auth.uid()));


--
-- Name: student_activities Authenticated can insert activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can insert activities" ON public.student_activities FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: student_details Authenticated can read student_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read student_details" ON public.student_details FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: profiles Authenticated can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view all profiles" ON public.profiles FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: lesson_comments Authenticated can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view comments" ON public.lesson_comments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: feed_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create comments" ON public.feed_comments FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: feed_posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.feed_posts FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: feed_posts Authenticated users can view all posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all posts" ON public.feed_posts FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: feed_comments Authenticated users can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view comments" ON public.feed_comments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: feed_likes Authenticated users can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view likes" ON public.feed_likes FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: call_notes Author manages own call notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Author manages own call notes" ON public.call_notes USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: feed_comments Authors can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete own comments" ON public.feed_comments FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: feed_posts Authors can delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete own posts" ON public.feed_posts FOR DELETE USING ((auth.uid() = author_id));


--
-- Name: journal_entries Authors can manage own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can manage own journal entries" ON public.journal_entries USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: call_session_notes Authors can manage their own session notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can manage their own session notes" ON public.call_session_notes USING ((auth.uid() = author_id));


--
-- Name: feed_comments Authors can update own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update own comments" ON public.feed_comments FOR UPDATE USING ((auth.uid() = author_id)) WITH CHECK ((auth.uid() = author_id));


--
-- Name: feed_posts Authors can update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update own posts" ON public.feed_posts FOR UPDATE USING ((auth.uid() = author_id)) WITH CHECK ((auth.uid() = author_id));


--
-- Name: client_ai_memory Client sees own memory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Client sees own memory" ON public.client_ai_memory FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: weekly_checkins Clients can create own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can create own checkins" ON public.weekly_checkins FOR INSERT WITH CHECK ((client_id = auth.uid()));


--
-- Name: daily_checkins Clients can create own daily checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can create own daily checkins" ON public.daily_checkins FOR INSERT WITH CHECK ((client_id = auth.uid()));


--
-- Name: knowledge_base_entries Clients can read KB; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can read KB" ON public.knowledge_base_entries FOR SELECT USING (true);


--
-- Name: weekly_checkins Clients can update own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can update own checkins" ON public.weekly_checkins FOR UPDATE USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: contracts Clients can update own contracts for signing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can update own contracts for signing" ON public.contracts FOR UPDATE USING (((client_id = auth.uid()) AND (status = 'sent'::text))) WITH CHECK ((client_id = auth.uid()));


--
-- Name: daily_checkins Clients can update own daily checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can update own daily checkins" ON public.daily_checkins FOR UPDATE USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: coaching_goals Clients can update own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can update own goals" ON public.coaching_goals FOR UPDATE USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: weekly_checkins Clients can view own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own checkins" ON public.weekly_checkins FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: contracts Clients can view own contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own contracts" ON public.contracts FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: daily_checkins Clients can view own daily checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own daily checkins" ON public.daily_checkins FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: coaching_goals Clients can view own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own goals" ON public.coaching_goals FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: invoices Clients can view own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own invoices" ON public.invoices FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: payment_schedules Clients can view own payment schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own payment schedules" ON public.payment_schedules FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: sessions Clients can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view own sessions" ON public.sessions FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: crm_contacts Closer manages assigned contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Closer manages assigned contacts" ON public.crm_contacts USING (((public.get_my_role() = 'closer'::text) AND (closer_id = auth.uid()))) WITH CHECK (((public.get_my_role() = 'closer'::text) AND (closer_id = auth.uid())));


--
-- Name: coach_ai_documents Coach deletes own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach deletes own documents" ON public.coach_ai_documents FOR DELETE USING ((coach_id = auth.uid()));


--
-- Name: coach_ai_documents Coach inserts own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach inserts own documents" ON public.coach_ai_documents FOR INSERT WITH CHECK ((coach_id = auth.uid()));


--
-- Name: crm_contacts Coach manages all contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach manages all contacts" ON public.crm_contacts USING ((public.get_my_role() = 'coach'::text)) WITH CHECK ((public.get_my_role() = 'coach'::text));


--
-- Name: contact_interactions Coach manages all interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach manages all interactions" ON public.contact_interactions USING ((public.get_my_role() = 'coach'::text)) WITH CHECK ((public.get_my_role() = 'coach'::text));


--
-- Name: coach_ai_config Coach manages own AI config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach manages own AI config" ON public.coach_ai_config USING ((coach_id = auth.uid()));


--
-- Name: coach_ai_documents Coach manages own AI documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach manages own AI documents" ON public.coach_ai_documents USING ((coach_id = auth.uid()));


--
-- Name: client_ai_memory Coach sees client memories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach sees client memories" ON public.client_ai_memory USING ((coach_id = auth.uid()));


--
-- Name: coach_ai_chunks Coach sees own chunks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach sees own chunks" ON public.coach_ai_chunks FOR SELECT USING ((coach_id = auth.uid()));


--
-- Name: coach_ai_documents Coach sees own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach sees own documents" ON public.coach_ai_documents FOR SELECT USING ((coach_id = auth.uid()));


--
-- Name: coach_ai_documents Coach updates own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coach updates own documents" ON public.coach_ai_documents FOR UPDATE USING ((coach_id = auth.uid())) WITH CHECK ((coach_id = auth.uid()));


--
-- Name: pre_call_answers Coaches and admins can view pre-call answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coaches and admins can view pre-call answers" ON public.pre_call_answers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: commissions Contractors view own commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Contractors view own commissions" ON public.commissions FOR SELECT USING ((auth.uid() = contractor_id));


--
-- Name: form_fields Fields visible with form; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Fields visible with form" ON public.form_fields FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.forms f
  WHERE ((f.id = form_fields.form_id) AND ((f.status = 'active'::text) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])))))));


--
-- Name: coach_ai_chunks Insert chunks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Insert chunks" ON public.coach_ai_chunks FOR INSERT WITH CHECK (true);


--
-- Name: lessons Lessons visible with module; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lessons visible with module" ON public.lessons FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.modules m
     JOIN public.courses c ON ((c.id = m.course_id)))
  WHERE ((m.id = lessons.module_id) AND ((c.status = 'published'::text) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])))))));


--
-- Name: message_attachments Members can add attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can add attachments" ON public.message_attachments FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: message_reactions Members can react; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can react" ON public.message_reactions FOR INSERT WITH CHECK ((profile_id = auth.uid()));


--
-- Name: message_attachments Members can view attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view attachments" ON public.message_attachments FOR SELECT USING (public.is_channel_member(( SELECT messages.channel_id
   FROM public.messages
  WHERE (messages.id = message_attachments.message_id))));


--
-- Name: message_reactions Members can view reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view reactions" ON public.message_reactions FOR SELECT USING (public.is_channel_member(( SELECT messages.channel_id
   FROM public.messages
  WHERE (messages.id = message_reactions.message_id))));


--
-- Name: modules Modules visible with course; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modules visible with course" ON public.modules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = modules.course_id) AND ((c.status = 'published'::text) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])))))));


--
-- Name: contracts Prospects can sign own contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prospects can sign own contracts" ON public.contracts FOR UPDATE USING (((client_id = auth.uid()) AND (public.get_my_role() = 'prospect'::text) AND (status = 'sent'::text))) WITH CHECK (((client_id = auth.uid()) AND (public.get_my_role() = 'prospect'::text)));


--
-- Name: contracts Prospects can view own contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prospects can view own contracts" ON public.contracts FOR SELECT USING (((client_id = auth.uid()) AND (public.get_my_role() = 'prospect'::text)));


--
-- Name: resources Prospects can view resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prospects can view resources" ON public.resources FOR SELECT USING (((visibility = 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'prospect'::public.user_role))))));


--
-- Name: bookings Public insert bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);


--
-- Name: booking_page_views Public insert views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public insert views" ON public.booking_page_views FOR INSERT WITH CHECK (true);


--
-- Name: booking_pages Public read active pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active pages" ON public.booking_pages FOR SELECT USING ((is_active = true));


--
-- Name: booking_availability Public read availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read availability" ON public.booking_availability FOR SELECT USING (true);


--
-- Name: booking_exceptions Public read exceptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read exceptions" ON public.booking_exceptions FOR SELECT USING (true);


--
-- Name: courses Published courses visible to all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published courses visible to all" ON public.courses FOR SELECT USING (((status = 'published'::text) OR (public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))));


--
-- Name: commissions Sales can insert commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales can insert commissions" ON public.commissions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['setter'::public.user_role, 'closer'::public.user_role, 'coach'::public.user_role, 'admin'::public.user_role]))))));


--
-- Name: crm_contacts Sales can view and manage own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales can view and manage own contacts" ON public.crm_contacts USING (((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])) AND ((assigned_to = auth.uid()) OR (created_by = auth.uid())))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])));


--
-- Name: contact_interactions Sales manages own interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sales manages own interactions" ON public.contact_interactions USING ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])));


--
-- Name: message_attachments Senders can manage attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can manage attachments" ON public.message_attachments USING ((EXISTS ( SELECT 1
   FROM public.messages
  WHERE ((messages.id = message_attachments.message_id) AND (messages.sender_id = auth.uid())))));


--
-- Name: channels Staff can create channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create channels" ON public.channels FOR INSERT WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: course_prerequisites Staff can delete prerequisites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can delete prerequisites" ON public.course_prerequisites FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: course_prerequisites Staff can insert prerequisites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert prerequisites" ON public.course_prerequisites FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: knowledge_base_entries Staff can manage KB; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage KB" ON public.knowledge_base_entries USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: coach_alerts Staff can manage all alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all alerts" ON public.coach_alerts USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: call_notes Staff can manage all call notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all call notes" ON public.call_notes USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: weekly_checkins Staff can manage all checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all checkins" ON public.weekly_checkins USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: feed_comments Staff can manage all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all comments" ON public.feed_comments USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: contracts Staff can manage all contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all contracts" ON public.contracts USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: daily_checkins Staff can manage all daily checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all daily checkins" ON public.daily_checkins USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: coaching_goals Staff can manage all goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all goals" ON public.coaching_goals USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: invoices Staff can manage all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all invoices" ON public.invoices USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: payment_schedules Staff can manage all payment schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all payment schedules" ON public.payment_schedules USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: feed_posts Staff can manage all posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all posts" ON public.feed_posts USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: sessions Staff can manage all sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage all sessions" ON public.sessions USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: badges Staff can manage badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage badges" ON public.badges USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: challenges Staff can manage challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage challenges" ON public.challenges USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: contract_templates Staff can manage contract templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage contract templates" ON public.contract_templates USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_flag_history Staff can manage flag history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage flag history" ON public.student_flag_history USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: lesson_actions Staff can manage lesson actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage lesson actions" ON public.lesson_actions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: level_config Staff can manage level_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage level_config" ON public.level_config USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_notes Staff can manage notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage notes" ON public.student_notes USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text])));


--
-- Name: challenge_participants Staff can manage participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage participants" ON public.challenge_participants USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: payment_reminders Staff can manage payment reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage payment reminders" ON public.payment_reminders USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_tasks Staff can manage tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage tasks" ON public.student_tasks USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text])));


--
-- Name: upsell_opportunities Staff can manage upsells; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage upsells" ON public.upsell_opportunities USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: xp_config Staff can manage xp_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage xp_config" ON public.xp_config USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_activities Staff can view all activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all activities" ON public.student_activities FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text])));


--
-- Name: call_notes Staff can view all call notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all call notes" ON public.call_notes FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: student_details Staff can view all client_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all client_details" ON public.student_details FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text])));


--
-- Name: challenge_participants Staff can view all participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all participants" ON public.challenge_participants FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: lesson_progress Staff can view all progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all progress" ON public.lesson_progress FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text, 'setter'::text, 'closer'::text])));


--
-- Name: ai_question_log Staff can view all questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all questions" ON public.ai_question_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: user_badges Staff can view all user_badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all user_badges" ON public.user_badges FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: xp_transactions Staff can view all xp; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all xp" ON public.xp_transactions FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: journal_entries Staff can view non-private journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view non-private journal entries" ON public.journal_entries FOR SELECT USING (((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])) AND (is_private = false)));


--
-- Name: daily_activity Staff view all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff view all activity" ON public.daily_activity FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: rituals Staff view all rituals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff view all rituals" ON public.rituals FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: streaks Staff view all streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff view all streaks" ON public.streaks FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: lesson_progress Students can manage own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can manage own progress" ON public.lesson_progress USING ((student_id = auth.uid()));


--
-- Name: form_submissions Students can submit forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can submit forms" ON public.form_submissions FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: student_tasks Students can update own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update own tasks" ON public.student_tasks FOR UPDATE USING ((student_id = auth.uid()));


--
-- Name: student_activities Students can view own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own activities" ON public.student_activities FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: student_details Students can view own details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own details" ON public.student_details FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: form_submissions Students can view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own submissions" ON public.form_submissions FOR SELECT USING ((respondent_id = auth.uid()));


--
-- Name: student_tasks Students can view own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own tasks" ON public.student_tasks FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: user_badges System can insert user_badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert user_badges" ON public.user_badges FOR INSERT WITH CHECK (true);


--
-- Name: xp_transactions System can insert xp; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert xp" ON public.xp_transactions FOR INSERT WITH CHECK (true);


--
-- Name: daily_activity System can manage activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage activity" ON public.daily_activity USING (true) WITH CHECK (true);


--
-- Name: streaks System can manage streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can manage streaks" ON public.streaks USING (true) WITH CHECK (true);


--
-- Name: ai_messages Users can add messages to own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add messages to own conversations" ON public.ai_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: saved_segments Users can create own segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own segments" ON public.saved_segments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: lesson_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comments" ON public.lesson_comments FOR DELETE USING ((author_id = auth.uid()));


--
-- Name: saved_segments Users can delete own segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own segments" ON public.saved_segments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can insert self notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert self notifications" ON public.notifications FOR INSERT WITH CHECK ((recipient_id = auth.uid()));


--
-- Name: challenge_participants Users can join challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK ((profile_id = auth.uid()));


--
-- Name: channel_members Users can join public channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join public channels" ON public.channel_members FOR INSERT WITH CHECK (((profile_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = channel_members.channel_id) AND (channels.type = 'public'::text))))));


--
-- Name: feed_likes Users can like posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like posts" ON public.feed_likes FOR INSERT WITH CHECK (((auth.uid() = profile_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: ai_conversations Users can manage own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own conversations" ON public.ai_conversations USING ((user_id = auth.uid()));


--
-- Name: ai_question_log Users can manage own questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own questions" ON public.ai_question_log USING ((auth.uid() = user_id));


--
-- Name: pre_call_answers Users can manage their own pre-call answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own pre-call answers" ON public.pre_call_answers USING ((auth.uid() = user_id));


--
-- Name: message_reactions Users can remove own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING ((profile_id = auth.uid()));


--
-- Name: feed_likes Users can unlike posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike posts" ON public.feed_likes FOR DELETE USING ((auth.uid() = profile_id));


--
-- Name: messages Users can update own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING ((sender_id = auth.uid()));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((recipient_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: challenge_participants Users can update own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own progress" ON public.challenge_participants FOR UPDATE USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: saved_segments Users can update own segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own segments" ON public.saved_segments FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_messages Users can view messages in own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in own conversations" ON public.ai_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: saved_segments Users can view own and shared segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own and shared segments" ON public.saved_segments FOR SELECT USING (((auth.uid() = user_id) OR (is_shared = true)));


--
-- Name: user_badges Users can view own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((recipient_id = auth.uid()));


--
-- Name: challenge_participants Users can view own participation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own participation" ON public.challenge_participants FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: xp_transactions Users can view own xp; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own xp" ON public.xp_transactions FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: lesson_action_completions Users manage own action completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own action completions" ON public.lesson_action_completions USING ((auth.uid() = user_id));


--
-- Name: message_bookmarks Users manage own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bookmarks" ON public.message_bookmarks USING ((auth.uid() = user_id));


--
-- Name: message_reactions Users manage own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own reactions" ON public.message_reactions USING ((profile_id = auth.uid()));


--
-- Name: rituals Users manage own rituals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own rituals" ON public.rituals USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: daily_activity Users view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own activity" ON public.daily_activity FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: user_badges Users view own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: streaks Users view own streak; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own streak" ON public.streaks FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: commission_rules admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.commission_rules USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: miro_boards admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.miro_boards USING ((public.get_my_role() = 'admin'::text));


--
-- Name: miro_cards admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.miro_cards USING ((public.get_my_role() = 'admin'::text));


--
-- Name: miro_connections admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.miro_connections USING ((public.get_my_role() = 'admin'::text));


--
-- Name: miro_sections admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.miro_sections USING ((public.get_my_role() = 'admin'::text));


--
-- Name: pipeline_columns admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.pipeline_columns USING ((public.get_my_role() = 'admin'::text));


--
-- Name: quizzes admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.quizzes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: setter_activities admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.setter_activities USING ((public.get_my_role() = 'admin'::text));


--
-- Name: setter_leads admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all ON public.setter_leads USING ((public.get_my_role() = 'admin'::text));


--
-- Name: call_calendar admin_all_calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_calls ON public.call_calendar USING ((public.get_my_role() = 'admin'::text));


--
-- Name: call_transcripts admin_all_transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_transcripts ON public.call_transcripts USING ((public.get_my_role() = 'admin'::text));


--
-- Name: call_summaries admin_call_summaries_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_call_summaries_all ON public.call_summaries USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: error_logs admin_delete_error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_delete_error_logs ON public.error_logs FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: coach_assignments admin_full_access_coach_assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_coach_assignments ON public.coach_assignments TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: resource_folders admin_full_access_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_folders ON public.resource_folders USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: resource_folder_access admin_manage_folder_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_folder_access ON public.resource_folder_access USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: quiz_submissions admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read ON public.quiz_submissions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: error_logs admin_read_error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read_error_logs ON public.error_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: error_logs admin_update_error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_update_error_logs ON public.error_logs FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_question_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_question_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_reports ai_reports_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_reports_own ON public.ai_reports USING ((user_id = auth.uid()));


--
-- Name: announcement_dismissals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements announcements_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_admin_manage ON public.announcements TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: announcements announcements_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_select ON public.announcements FOR SELECT TO authenticated USING (true);


--
-- Name: error_logs anon_insert_error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_insert_error_logs ON public.error_logs FOR INSERT TO anon WITH CHECK (true);


--
-- Name: quiz_submissions anyone_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_insert ON public.quiz_submissions FOR INSERT WITH CHECK (true);


--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys api_keys_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY api_keys_admin_all ON public.api_keys USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: api_keys api_keys_owner_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY api_keys_owner_select ON public.api_keys FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_admin_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_admin_read ON public.audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: audit_logs audit_logs_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_insert_auth ON public.audit_logs FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: error_logs authenticated_insert_error_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_insert_error_logs ON public.error_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: availability_overrides avail_overrides_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avail_overrides_manage ON public.availability_overrides USING (((coach_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: availability_overrides avail_overrides_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avail_overrides_select ON public.availability_overrides FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: availability_slots avail_slots_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avail_slots_manage ON public.availability_slots USING (((coach_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: availability_slots avail_slots_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avail_slots_select ON public.availability_slots FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: availability_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: avatars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: badges badges_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY badges_admin ON public.badges USING ((public.get_my_role() = 'admin'::text));


--
-- Name: booking_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_exceptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_exceptions ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;

--
-- Name: branding_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branding_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: branding_pages branding_pages_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branding_pages_admin ON public.branding_pages USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: branding_pages branding_pages_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branding_pages_select ON public.branding_pages FOR SELECT USING (((is_published = true) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: branding_settings branding_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branding_select_all ON public.branding_settings FOR SELECT USING (true);


--
-- Name: branding_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: branding_settings branding_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branding_update_admin ON public.branding_settings FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_events calendar_events_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_events_delete ON public.calendar_events FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: calendar_events calendar_events_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_events_insert ON public.calendar_events FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: calendar_events calendar_events_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_events_select ON public.calendar_events FOR SELECT TO authenticated USING (true);


--
-- Name: calendar_events calendar_events_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY calendar_events_update ON public.calendar_events FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: call_calendar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_calendar ENABLE ROW LEVEL SECURITY;

--
-- Name: call_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: call_documents call_documents_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_documents_all ON public.call_documents TO authenticated USING (true) WITH CHECK (true);


--
-- Name: call_documents call_documents_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_documents_select ON public.call_documents FOR SELECT TO authenticated USING (true);


--
-- Name: call_note_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_note_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: call_note_templates call_note_templates_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_note_templates_all ON public.call_note_templates TO authenticated USING (true) WITH CHECK (true);


--
-- Name: call_note_templates call_note_templates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_note_templates_select ON public.call_note_templates FOR SELECT TO authenticated USING (true);


--
-- Name: call_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: call_recordings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: call_recordings call_recordings_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_recordings_all ON public.call_recordings TO authenticated USING (true) WITH CHECK (true);


--
-- Name: call_recordings call_recordings_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY call_recordings_select ON public.call_recordings FOR SELECT TO authenticated USING (true);


--
-- Name: call_session_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_session_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: call_summaries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: call_transcripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;

--
-- Name: certificate_entries cert_entries_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cert_entries_insert ON public.certificate_entries FOR INSERT WITH CHECK (((student_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: certificate_entries cert_entries_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cert_entries_select ON public.certificate_entries FOR SELECT USING (((student_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: certificate_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificate_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: certificates certificates_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY certificates_all ON public.certificates TO authenticated USING (true) WITH CHECK (true);


--
-- Name: certificates certificates_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY certificates_insert ON public.certificates FOR INSERT WITH CHECK (((student_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: certificates certificates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY certificates_select ON public.certificates FOR SELECT USING (((student_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: challenge_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: challenge_entries challenge_entries_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY challenge_entries_all ON public.challenge_entries TO authenticated USING (true) WITH CHECK (true);


--
-- Name: challenge_entries challenge_entries_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY challenge_entries_select ON public.challenge_entries FOR SELECT TO authenticated USING (true);


--
-- Name: challenge_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_members channel_members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channel_members_delete ON public.channel_members FOR DELETE USING (((profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = channel_members.channel_id) AND (channels.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: channel_members channel_members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channel_members_insert ON public.channel_members FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = channel_members.channel_id) AND (channels.created_by = auth.uid())))) OR ((profile_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = channel_members.channel_id) AND (channels.type = 'public'::text))))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: channel_members channel_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channel_members_select ON public.channel_members FOR SELECT USING ((public.is_channel_member(channel_id) OR (profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: channel_members channel_members_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channel_members_update ON public.channel_members FOR UPDATE USING (((profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

--
-- Name: channels channels_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channels_delete ON public.channels FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: channels channels_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channels_insert ON public.channels FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (created_by = auth.uid())));


--
-- Name: channels channels_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channels_select ON public.channels FOR SELECT USING (((type = 'public'::text) OR public.is_channel_member(id) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: channels channels_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY channels_update ON public.channels FOR UPDATE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: checkins checkins_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checkins_own ON public.checkins USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: checkins checkins_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checkins_staff ON public.checkins USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: onboarding_checklist_items checklist_items_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checklist_items_own ON public.onboarding_checklist_items USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: onboarding_checklist_items checklist_items_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checklist_items_staff_read ON public.onboarding_checklist_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: client_ai_memory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_ai_memory ENABLE ROW LEVEL SECURITY;

--
-- Name: client_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: client_assignments client_assignments_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assignments_all ON public.client_assignments TO authenticated USING (true) WITH CHECK (true);


--
-- Name: client_assignments client_assignments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_assignments_select ON public.client_assignments FOR SELECT TO authenticated USING (true);


--
-- Name: call_calendar client_can_book_calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_can_book_calls ON public.call_calendar FOR INSERT WITH CHECK (((public.get_my_role() = 'client'::text) AND (client_id = auth.uid()) AND (call_type = 'booking'::text)));


--
-- Name: client_flag_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_flag_history ENABLE ROW LEVEL SECURITY;

--
-- Name: client_flag_history client_flag_history_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_flag_history_all ON public.client_flag_history TO authenticated USING (true) WITH CHECK (true);


--
-- Name: client_flag_history client_flag_history_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_flag_history_select ON public.client_flag_history FOR SELECT TO authenticated USING (true);


--
-- Name: client_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: client_flags client_flags_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_flags_read ON public.client_flags FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: roadmap_milestones client_milestones_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_milestones_read ON public.roadmap_milestones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.client_roadmaps
  WHERE ((client_roadmaps.id = roadmap_milestones.roadmap_id) AND (client_roadmaps.client_id = auth.uid())))));


--
-- Name: setter_activities client_own_activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_own_activities ON public.setter_activities USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: call_calendar client_own_calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_own_calls ON public.call_calendar FOR SELECT USING (((public.get_my_role() = 'client'::text) AND (client_id = auth.uid())));


--
-- Name: pipeline_columns client_own_columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_own_columns ON public.pipeline_columns USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: setter_leads client_own_leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_own_leads ON public.setter_leads USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: call_transcripts client_own_transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_own_transcripts ON public.call_transcripts FOR SELECT USING (((public.get_my_role() = 'client'::text) AND (call_id IN ( SELECT call_calendar.id
   FROM public.call_calendar
  WHERE (call_calendar.client_id = auth.uid())))));


--
-- Name: client_roadmaps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_roadmaps ENABLE ROW LEVEL SECURITY;

--
-- Name: client_roadmaps client_roadmaps_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_roadmaps_read ON public.client_roadmaps FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: resource_folders client_select_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_select_folders ON public.resource_folders FOR SELECT USING ((((visibility = ANY (ARRAY['all'::text, 'clients'::text])) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['client'::public.user_role, 'prospect'::public.user_role])))))) OR (EXISTS ( SELECT 1
   FROM public.resource_folder_access
  WHERE ((resource_folder_access.folder_id = resource_folders.id) AND (resource_folder_access.user_id = auth.uid()))))));


--
-- Name: coach_assignments client_select_own_assignment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY client_select_own_assignment ON public.coach_assignments FOR SELECT TO authenticated USING ((client_id = auth.uid()));


--
-- Name: closer_calls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.closer_calls ENABLE ROW LEVEL SECURITY;

--
-- Name: closer_calls closer_calls_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY closer_calls_all ON public.closer_calls TO authenticated USING (true) WITH CHECK (true);


--
-- Name: closer_calls closer_calls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY closer_calls_select ON public.closer_calls FOR SELECT TO authenticated USING (true);


--
-- Name: coach_ai_chunks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coach_ai_chunks ENABLE ROW LEVEL SECURITY;

--
-- Name: coach_ai_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coach_ai_config ENABLE ROW LEVEL SECURITY;

--
-- Name: coach_ai_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coach_ai_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: coach_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coach_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: coach_assignments coach_assign_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_assign_admin ON public.coach_assignments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: coach_assignments coach_assign_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_assign_read ON public.coach_assignments FOR SELECT USING (((client_id = auth.uid()) OR (coach_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: coach_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: call_summaries coach_call_summaries_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_call_summaries_insert ON public.call_summaries FOR INSERT WITH CHECK ((author_id = auth.uid()));


--
-- Name: call_summaries coach_call_summaries_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_call_summaries_select ON public.call_summaries FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.call_calendar cc
  WHERE ((cc.id = call_summaries.call_id) AND ((cc.assigned_to = auth.uid()) OR (cc.client_id = auth.uid()))))));


--
-- Name: call_summaries coach_call_summaries_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_call_summaries_update ON public.call_summaries FOR UPDATE USING ((author_id = auth.uid()));


--
-- Name: call_calendar coach_own_calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_own_calls ON public.call_calendar USING (((public.get_my_role() = 'coach'::text) AND (assigned_to = auth.uid())));


--
-- Name: call_transcripts coach_own_transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_own_transcripts ON public.call_transcripts USING (((public.get_my_role() = 'coach'::text) AND (call_id IN ( SELECT call_calendar.id
   FROM public.call_calendar
  WHERE (call_calendar.assigned_to = auth.uid())))));


--
-- Name: coach_assignments coach_select_own_assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_select_own_assignments ON public.coach_assignments FOR SELECT TO authenticated USING ((coach_id = auth.uid()));


--
-- Name: setter_leads coach_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_view ON public.setter_leads FOR SELECT USING ((public.get_my_role() = 'coach'::text));


--
-- Name: setter_activities coach_view_activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coach_view_activities ON public.setter_activities FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'coach'::text])));


--
-- Name: coaching_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coaching_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: coaching_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coaching_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: coaching_milestones coaching_milestones_client_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coaching_milestones_client_read ON public.coaching_milestones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.coaching_goals
  WHERE ((coaching_goals.id = coaching_milestones.goal_id) AND (coaching_goals.client_id = auth.uid())))));


--
-- Name: coaching_milestones coaching_milestones_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coaching_milestones_staff ON public.coaching_milestones USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: coaching_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: coaching_sessions coaching_sessions_client_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coaching_sessions_client_read ON public.coaching_sessions FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: coaching_sessions coaching_sessions_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coaching_sessions_staff ON public.coaching_sessions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: commission_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

--
-- Name: communities communities_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY communities_delete ON public.communities FOR DELETE TO authenticated USING (true);


--
-- Name: communities communities_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY communities_insert ON public.communities FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: communities communities_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY communities_select ON public.communities FOR SELECT TO authenticated USING (true);


--
-- Name: communities communities_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY communities_update ON public.communities FOR UPDATE TO authenticated USING (true);


--
-- Name: community_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

--
-- Name: community_members community_members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_delete ON public.community_members FOR DELETE TO authenticated USING (true);


--
-- Name: community_members community_members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_insert ON public.community_members FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: community_members community_members_join; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_join ON public.community_members FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.communities
  WHERE ((communities.id = community_members.community_id) AND (communities.is_private = false))))));


--
-- Name: community_members community_members_leave; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_leave ON public.community_members FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: community_members community_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_select ON public.community_members FOR SELECT TO authenticated USING (true);


--
-- Name: community_members community_members_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY community_members_update ON public.community_members FOR UPDATE TO authenticated USING (true);


--
-- Name: competition_participants comp_participants_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_participants_insert ON public.competition_participants FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))) OR (auth.uid() = user_id)));


--
-- Name: competition_participants comp_participants_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_participants_select ON public.competition_participants FOR SELECT TO authenticated USING (true);


--
-- Name: competition_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: competitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

--
-- Name: competitions competitions_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY competitions_admin_manage ON public.competitions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: competitions competitions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY competitions_select ON public.competitions FOR SELECT TO authenticated USING (true);


--
-- Name: user_consents consents_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY consents_admin_select ON public.user_consents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: user_consents consents_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY consents_insert_own ON public.user_consents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_consents consents_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY consents_select_own ON public.user_consents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents consents_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY consents_update_own ON public.user_consents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contact_interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_renewal_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_renewal_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_renewal_logs contract_renewal_logs_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contract_renewal_logs_all ON public.contract_renewal_logs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: contract_renewal_logs contract_renewal_logs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contract_renewal_logs_select ON public.contract_renewal_logs FOR SELECT TO authenticated USING (true);


--
-- Name: contract_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: course_prerequisites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

--
-- Name: course_prerequisites course_prerequisites_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_prerequisites_select ON public.course_prerequisites FOR SELECT TO authenticated USING (true);


--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_contacts crm_contacts_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_contacts_select ON public.crm_contacts FOR SELECT TO authenticated USING (true);


--
-- Name: currency_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: currency_rates currency_rates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY currency_rates_select ON public.currency_rates FOR SELECT TO authenticated USING (true);


--
-- Name: custom_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_roles custom_roles_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY custom_roles_admin_delete ON public.custom_roles FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))) AND (is_system = false)));


--
-- Name: custom_roles custom_roles_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY custom_roles_admin_insert ON public.custom_roles FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: custom_roles custom_roles_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY custom_roles_admin_update ON public.custom_roles FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: custom_roles custom_roles_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY custom_roles_select ON public.custom_roles FOR SELECT TO authenticated USING (true);


--
-- Name: daily_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_activity daily_activity_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY daily_activity_own ON public.daily_activity USING ((user_id = auth.uid()));


--
-- Name: daily_checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_layouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_layouts dashboard_layouts_own_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dashboard_layouts_own_delete ON public.dashboard_layouts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts dashboard_layouts_own_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dashboard_layouts_own_insert ON public.dashboard_layouts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dashboard_layouts dashboard_layouts_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dashboard_layouts_own_select ON public.dashboard_layouts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts dashboard_layouts_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dashboard_layouts_own_update ON public.dashboard_layouts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: announcement_dismissals dismissals_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dismissals_own ON public.announcement_dismissals USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: enrichment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enrichment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: enrichment_results enrichment_results_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY enrichment_results_staff ON public.enrichment_results USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: error_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_submissions exercise_submissions_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exercise_submissions_all ON public.exercise_submissions TO authenticated USING (true) WITH CHECK (true);


--
-- Name: exercise_submissions exercise_submissions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exercise_submissions_select ON public.exercise_submissions FOR SELECT TO authenticated USING (true);


--
-- Name: faq_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: faq_entries faq_entries_client_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY faq_entries_client_read ON public.faq_entries FOR SELECT TO authenticated USING ((auto_answer_enabled = true));


--
-- Name: faq_entries faq_entries_staff_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY faq_entries_staff_all ON public.faq_entries TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: faq_question_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faq_question_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: faq_question_logs faq_question_logs_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY faq_question_logs_all ON public.faq_question_logs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: faq_question_logs faq_question_logs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY faq_question_logs_select ON public.faq_question_logs FOR SELECT TO authenticated USING (true);


--
-- Name: feed_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_reports feed_reports_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feed_reports_insert ON public.feed_reports FOR INSERT TO authenticated WITH CHECK ((reporter_id = auth.uid()));


--
-- Name: feed_reports feed_reports_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feed_reports_own_select ON public.feed_reports FOR SELECT TO authenticated USING ((reporter_id = auth.uid()));


--
-- Name: feed_reports feed_reports_staff_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feed_reports_staff_select ON public.feed_reports FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: feed_reports feed_reports_staff_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feed_reports_staff_update ON public.feed_reports FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: financial_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_entries financial_entries_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY financial_entries_all ON public.financial_entries TO authenticated USING (true) WITH CHECK (true);


--
-- Name: financial_entries financial_entries_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY financial_entries_select ON public.financial_entries FOR SELECT TO authenticated USING (true);


--
-- Name: flag_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flag_history ENABLE ROW LEVEL SECURITY;

--
-- Name: form_fields; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: form_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: form_templates form_templates_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_templates_admin_manage ON public.form_templates TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))) OR (created_by = auth.uid())));


--
-- Name: form_templates form_templates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_templates_select ON public.form_templates FOR SELECT TO authenticated USING (true);


--
-- Name: forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

--
-- Name: forms forms_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forms_manage ON public.forms USING (((auth.uid() = created_by) OR (public.get_my_role() = 'admin'::text)));


--
-- Name: google_calendar_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: google_calendar_tokens google_calendar_tokens_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY google_calendar_tokens_all ON public.google_calendar_tokens TO authenticated USING (true) WITH CHECK (true);


--
-- Name: google_calendar_tokens google_calendar_tokens_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY google_calendar_tokens_select ON public.google_calendar_tokens FOR SELECT TO authenticated USING (true);


--
-- Name: hall_of_fame; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

--
-- Name: hall_of_fame hall_of_fame_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hall_of_fame_all ON public.hall_of_fame TO authenticated USING (true) WITH CHECK (true);


--
-- Name: hall_of_fame hall_of_fame_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hall_of_fame_select ON public.hall_of_fame FOR SELECT TO authenticated USING (true);


--
-- Name: instagram_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_accounts instagram_accounts_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instagram_accounts_all ON public.instagram_accounts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: instagram_accounts instagram_accounts_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instagram_accounts_select ON public.instagram_accounts FOR SELECT TO authenticated USING (true);


--
-- Name: instagram_post_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instagram_post_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_post_stats instagram_post_stats_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instagram_post_stats_all ON public.instagram_post_stats TO authenticated USING (true) WITH CHECK (true);


--
-- Name: instagram_post_stats instagram_post_stats_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instagram_post_stats_select ON public.instagram_post_stats FOR SELECT TO authenticated USING (true);


--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_attachments journal_attachments_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY journal_attachments_own ON public.journal_attachments USING ((EXISTS ( SELECT 1
   FROM public.journal_entries
  WHERE ((journal_entries.id = journal_attachments.journal_entry_id) AND (journal_entries.author_id = auth.uid())))));


--
-- Name: journal_attachments journal_attachments_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY journal_attachments_staff_read ON public.journal_attachments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_prompts journal_prompts_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY journal_prompts_admin ON public.journal_prompts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: journal_prompts journal_prompts_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY journal_prompts_read ON public.journal_prompts FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_active = true)));


--
-- Name: knowledge_base_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_goals kpi_goals_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_goals_staff ON public.kpi_goals USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: lesson_action_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_action_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: level_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.level_config ENABLE ROW LEVEL SECURITY;

--
-- Name: message_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: message_bookmarks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.message_bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: message_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: message_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: message_templates message_templates_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY message_templates_delete_auth ON public.message_templates FOR DELETE TO authenticated USING (true);


--
-- Name: message_templates message_templates_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY message_templates_insert_auth ON public.message_templates FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: message_templates message_templates_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY message_templates_select_all ON public.message_templates FOR SELECT TO authenticated USING (true);


--
-- Name: message_templates message_templates_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY message_templates_update_auth ON public.message_templates FOR UPDATE TO authenticated USING (true);


--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages messages_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_delete ON public.messages FOR DELETE USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: messages messages_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND ((EXISTS ( SELECT 1
   FROM public.channel_members
  WHERE ((channel_members.channel_id = messages.channel_id) AND (channel_members.profile_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = messages.channel_id) AND (channels.type = 'public'::text)))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))))));


--
-- Name: messages messages_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_select ON public.messages FOR SELECT USING ((public.is_channel_member(channel_id) OR (EXISTS ( SELECT 1
   FROM public.channels
  WHERE ((channels.id = messages.channel_id) AND (channels.type = 'public'::text)))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: messages messages_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY messages_update_own ON public.messages FOR UPDATE USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: miro_boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.miro_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: miro_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.miro_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: miro_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.miro_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: miro_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.miro_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences notif_prefs_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_prefs_insert ON public.notification_preferences FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: notification_preferences notif_prefs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_prefs_select ON public.notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_preferences notif_prefs_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_prefs_update ON public.notification_preferences FOR UPDATE USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_requests offboarding_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offboarding_admin_insert ON public.offboarding_requests FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: offboarding_requests offboarding_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offboarding_admin_select ON public.offboarding_requests FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: offboarding_requests offboarding_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offboarding_admin_update ON public.offboarding_requests FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: offboarding_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.offboarding_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_checklist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_offers onboarding_offers_admin_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_offers_admin_manage ON public.onboarding_offers TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: onboarding_offers onboarding_offers_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_offers_read ON public.onboarding_offers FOR SELECT TO authenticated USING (true);


--
-- Name: onboarding_progress onboarding_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_own ON public.onboarding_progress USING (((auth.uid() = user_id) OR (public.get_my_role() = 'admin'::text)));


--
-- Name: onboarding_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_steps onboarding_steps_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_steps_own ON public.onboarding_steps USING ((auth.uid() = profile_id)) WITH CHECK ((auth.uid() = profile_id));


--
-- Name: onboarding_steps onboarding_steps_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_steps_staff_read ON public.onboarding_steps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: quiz_submissions own_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY own_read ON public.quiz_submissions FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: payment_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: pipeline_columns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;

--
-- Name: pre_call_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pre_call_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: course_prerequisites prereqs_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY prereqs_read ON public.course_prerequisites FOR SELECT USING (true);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_authenticated ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: quizzes public_read_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_published ON public.quizzes FOR SELECT USING ((is_published = true));


--
-- Name: push_subscriptions push_subs_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY push_subs_own ON public.push_subscriptions USING ((user_id = auth.uid()));


--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts quiz_attempts_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_attempts_own ON public.quiz_attempts USING ((student_id = auth.uid())) WITH CHECK ((student_id = auth.uid()));


--
-- Name: quiz_attempts quiz_attempts_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_attempts_staff_read ON public.quiz_attempts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: quiz_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_redemptions redemptions_own_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY redemptions_own_insert ON public.reward_redemptions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: reward_redemptions redemptions_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY redemptions_own_select ON public.reward_redemptions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: reward_redemptions redemptions_staff_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY redemptions_staff_all ON public.reward_redemptions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_enrollments relance_enroll_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_enroll_manage ON public.relance_enrollments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_enrollments relance_enroll_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_enroll_select ON public.relance_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.relance_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: relance_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.relance_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: relance_logs relance_logs_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_logs_all ON public.relance_logs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: relance_logs relance_logs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_logs_select ON public.relance_logs FOR SELECT TO authenticated USING (true);


--
-- Name: relance_sequences relance_seq_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_seq_manage ON public.relance_sequences USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_sequences relance_seq_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_seq_select ON public.relance_sequences FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.relance_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: relance_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.relance_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: relance_steps relance_steps_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_steps_manage ON public.relance_steps USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: relance_steps relance_steps_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relance_steps_select ON public.relance_steps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: replays; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.replays ENABLE ROW LEVEL SECURITY;

--
-- Name: replays replays_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY replays_select ON public.replays FOR SELECT USING (true);


--
-- Name: replays replays_staff_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY replays_staff_manage ON public.replays USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: resource_folder_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resource_folder_access ENABLE ROW LEVEL SECURITY;

--
-- Name: resource_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

--
-- Name: resources resources_clients_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resources_clients_read ON public.resources FOR SELECT USING (((visibility = ANY (ARRAY['all'::text, 'clients'::text])) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: resources resources_staff_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resources_staff_all ON public.resources USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: reward_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: rewards rewards_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rewards_select_active ON public.rewards FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_active = true)));


--
-- Name: rewards rewards_staff_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rewards_staff_manage ON public.rewards USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: rituals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;

--
-- Name: roadmap_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: call_calendar sales_own_calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sales_own_calls ON public.call_calendar USING (((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])) AND (assigned_to = auth.uid())));


--
-- Name: call_transcripts sales_own_transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sales_own_transcripts ON public.call_transcripts USING (((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])) AND (call_id IN ( SELECT call_calendar.id
   FROM public.call_calendar
  WHERE (call_calendar.assigned_to = auth.uid())))));


--
-- Name: resource_folders sales_select_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sales_select_folders ON public.resource_folders FOR SELECT USING ((((visibility = 'all'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['setter'::public.user_role, 'closer'::public.user_role])))))) OR (EXISTS ( SELECT 1
   FROM public.resource_folder_access
  WHERE ((resource_folder_access.folder_id = resource_folders.id) AND (resource_folder_access.user_id = auth.uid()))))));


--
-- Name: saved_segments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_segments ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: setter_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setter_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: setter_activities setter_closer_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY setter_closer_all ON public.setter_activities USING ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])));


--
-- Name: setter_leads setter_closer_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY setter_closer_all ON public.setter_leads USING ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text]))) WITH CHECK ((public.get_my_role() = ANY (ARRAY['setter'::text, 'closer'::text])));


--
-- Name: pipeline_columns setter_columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY setter_columns ON public.pipeline_columns FOR SELECT USING (true);


--
-- Name: setter_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setter_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: pipeline_columns setter_manage_columns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY setter_manage_columns ON public.pipeline_columns USING ((public.get_my_role() = ANY (ARRAY['admin'::text, 'setter'::text, 'closer'::text])));


--
-- Name: commission_rules setter_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY setter_view_own ON public.commission_rules FOR SELECT USING ((auth.uid() = setter_id));


--
-- Name: sms_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sms_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: sms_reminders sms_reminders_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sms_reminders_insert_own ON public.sms_reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: sms_reminders sms_reminders_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sms_reminders_select_own ON public.sms_reminders FOR SELECT USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: sms_reminders sms_reminders_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sms_reminders_update_own ON public.sms_reminders FOR UPDATE USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: social_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;

--
-- Name: social_content social_content_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY social_content_manage ON public.social_content TO authenticated USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: social_content social_content_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY social_content_select ON public.social_content FOR SELECT TO authenticated USING (true);


--
-- Name: client_flags staff_flags_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_flags_all ON public.client_flags USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: resource_folders staff_manage_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_manage_folders ON public.resource_folders USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'coach'::public.user_role)))));


--
-- Name: roadmap_milestones staff_milestones_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_milestones_all ON public.roadmap_milestones USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: client_roadmaps staff_roadmaps_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_roadmaps_all ON public.client_roadmaps USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: resource_folders staff_select_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_folders ON public.resource_folders FOR SELECT USING ((((visibility = ANY (ARRAY['all'::text, 'staff'::text])) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'coach'::public.user_role))))) OR (EXISTS ( SELECT 1
   FROM public.resource_folder_access
  WHERE ((resource_folder_access.folder_id = resource_folders.id) AND (resource_folder_access.user_id = auth.uid()))))));


--
-- Name: streaks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: streaks streaks_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY streaks_own ON public.streaks USING (((auth.uid() = user_id) OR (public.get_my_role() = 'admin'::text)));


--
-- Name: student_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: student_activities student_activities_client_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_activities_client_insert ON public.student_activities FOR INSERT TO authenticated WITH CHECK ((student_id = auth.uid()));


--
-- Name: student_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

--
-- Name: student_flag_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_flag_history ENABLE ROW LEVEL SECURITY;

--
-- Name: student_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: student_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submissions submissions_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submissions_insert ON public.form_submissions FOR INSERT WITH CHECK (true);


--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members team_members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_members_delete ON public.team_members FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND (teams.captain_id = auth.uid()))))));


--
-- Name: team_members team_members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_members_insert ON public.team_members FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.teams
  WHERE ((teams.id = team_members.team_id) AND (teams.captain_id = auth.uid()))))));


--
-- Name: team_members team_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_members_select ON public.team_members FOR SELECT TO authenticated USING (true);


--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: teams teams_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: teams teams_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_select ON public.teams FOR SELECT TO authenticated USING (true);


--
-- Name: teams teams_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_update ON public.teams FOR UPDATE TO authenticated USING (((auth.uid() = captain_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));


--
-- Name: message_templates templates_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_delete ON public.message_templates FOR DELETE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: message_templates templates_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_insert ON public.message_templates FOR INSERT WITH CHECK ((created_by = auth.uid()));


--
-- Name: message_templates templates_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_select ON public.message_templates FOR SELECT USING (((created_by = auth.uid()) OR (is_shared = true) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: message_templates templates_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_update ON public.message_templates FOR UPDATE USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: upsell_opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upsell_opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: upsell_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: upsell_rules upsell_rules_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upsell_rules_staff ON public.upsell_rules USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: upsell_triggers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upsell_triggers ENABLE ROW LEVEL SECURITY;

--
-- Name: upsell_triggers upsell_triggers_client_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upsell_triggers_client_read ON public.upsell_triggers FOR SELECT USING ((client_id = auth.uid()));


--
-- Name: upsell_triggers upsell_triggers_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upsell_triggers_staff ON public.upsell_triggers USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges user_badges_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_badges_insert ON public.user_badges FOR INSERT WITH CHECK ((public.get_my_role() = 'admin'::text));


--
-- Name: user_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows user_follows_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_follows_delete ON public.user_follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: user_follows user_follows_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_follows_insert ON public.user_follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: user_follows user_follows_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_follows_select ON public.user_follows FOR SELECT USING (true);


--
-- Name: user_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences user_prefs_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_prefs_insert ON public.user_preferences FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: user_preferences user_prefs_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_prefs_own ON public.user_preferences USING ((user_id = auth.uid()));


--
-- Name: user_preferences user_prefs_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_prefs_update ON public.user_preferences FOR UPDATE USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_all ON public.user_roles USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: user_roles user_roles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions user_sessions_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_sessions_delete_own ON public.user_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_sessions user_sessions_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_sessions_insert_own ON public.user_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_sessions user_sessions_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_sessions_select_own ON public.user_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions user_sessions_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_sessions_update_own ON public.user_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: resource_folder_access user_view_own_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_view_own_access ON public.resource_folder_access FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: video_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: video_responses video_responses_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_responses_delete ON public.video_responses FOR DELETE USING ((auth.uid() = sender_id));


--
-- Name: video_responses video_responses_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_responses_insert ON public.video_responses FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: video_responses video_responses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_responses_select ON public.video_responses FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: video_responses video_responses_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_responses_update ON public.video_responses FOR UPDATE USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: workbook_submissions wb_submissions_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wb_submissions_own ON public.workbook_submissions TO authenticated USING ((client_id = auth.uid())) WITH CHECK ((client_id = auth.uid()));


--
-- Name: workbook_submissions wb_submissions_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wb_submissions_staff ON public.workbook_submissions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: webhook_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_logs webhook_logs_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY webhook_logs_admin_all ON public.webhook_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: webhooks webhooks_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY webhooks_admin_all ON public.webhooks USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: weekly_checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: workbook_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workbook_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: workbooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;

--
-- Name: workbooks workbooks_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY workbooks_manage ON public.workbooks TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'coach'::public.user_role]))))));


--
-- Name: workbooks workbooks_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY workbooks_read ON public.workbooks FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: xp_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;

--
-- Name: xp_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict WTyFxhjGhRzrgMF17nZ4n637K0puHN0gZZ0KU4myJnQaF1rb9irGhjE8WyXqRtS

