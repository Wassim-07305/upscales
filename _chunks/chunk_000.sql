CREATE SCHEMA IF NOT EXISTS "backup_20260324";


ALTER SCHEMA "backup_20260324" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."user_role" AS ENUM (
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


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_provision_client"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."auto_provision_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_xp"("p_profile_id" "uuid", "p_action" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."award_xp"("p_profile_id" "uuid", "p_action" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_account"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."delete_user_account"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sync_flag_to_client_flags"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."fn_sync_flag_to_client_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sync_flag_to_student_details"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE student_details
  SET flag = NEW.flag, updated_at = now()
  WHERE profile_id = NEW.client_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_sync_flag_to_student_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.invoice_number := 'OM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_student_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."handle_student_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_download_count"("resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE resources
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = resource_id;
END;
$$;


ALTER FUNCTION "public"."increment_download_count"("resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_channel_member"("p_channel_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = p_channel_id
      AND profile_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_channel_member"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_channel_read"("p_channel_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."mark_channel_read"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_coach_chunks"("query_embedding" "public"."vector", "p_coach_id" "uuid", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 5) RETURNS TABLE("id" "uuid", "content" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT c.id, c.content, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM coach_ai_chunks c
  WHERE c.coach_id = p_coach_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_coach_chunks"("query_embedding" "public"."vector", "p_coach_id" "uuid", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_certificate_issued"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."notify_certificate_issued"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_channel_members_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."notify_channel_members_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_feed_post"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."notify_feed_post"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_activity"("p_profile_id" "uuid", "p_action" "text" DEFAULT 'login'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."record_activity"("p_profile_id" "uuid", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_reward"("p_user_id" "uuid", "p_reward_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."redeem_reward"("p_user_id" "uuid", "p_reward_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_branding_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_branding_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_call_summaries_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_call_summaries_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_channel_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.channels SET last_message_at = NEW.created_at WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_channel_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."update_post_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."update_post_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_student_lifetime_value"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."update_student_lifetime_value"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_webhooks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_webhooks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invite_code"("code" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."validate_invite_code"("code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_user_password"("password" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'extensions', 'public', 'pg_catalog'
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


ALTER FUNCTION "public"."verify_user_password"("password" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "backup_20260324"."announcements" (
    "id" "uuid",
    "title" "text",
    "content" "text",
    "type" "text",
    "is_active" boolean,
    "target_roles" "text"[],
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."audit_logs" (
    "id" "uuid",
    "user_id" "uuid",
    "action" "text",
    "entity_type" "text",
    "entity_id" "text",
    "metadata" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone
);
