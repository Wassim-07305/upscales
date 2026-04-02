
ALTER TABLE "backup_20260324"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."bookings" (
    "id" "uuid",
    "booking_page_id" "uuid",
    "prospect_name" "text",
    "prospect_email" "text",
    "prospect_phone" "text",
    "date" "date",
    "start_time" "text",
    "end_time" "text",
    "status" "text",
    "qualification_answers" "jsonb",
    "google_event_id" "text",
    "meet_link" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."call_calendar" (
    "id" "uuid",
    "client_id" "uuid",
    "assigned_to" "uuid",
    "title" "text",
    "date" "date",
    "time" time without time zone,
    "duration_minutes" integer,
    "call_type" "text",
    "status" "text",
    "link" "text",
    "notes" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "room_status" "text",
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "actual_duration_seconds" integer,
    "reschedule_reason" "text",
    "original_date" "date",
    "original_time" time without time zone,
    "satisfaction_rating" integer
);


ALTER TABLE "backup_20260324"."call_calendar" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."channel_members" (
    "id" "uuid",
    "channel_id" "uuid",
    "profile_id" "uuid",
    "role" "text",
    "last_read_at" timestamp with time zone,
    "notifications_muted" boolean,
    "joined_at" timestamp with time zone,
    "is_pinned" boolean
);


ALTER TABLE "backup_20260324"."channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."channels" (
    "id" "uuid",
    "name" "text",
    "description" "text",
    "type" "text",
    "created_by" "uuid",
    "is_archived" boolean,
    "is_default" boolean,
    "avatar_url" "text",
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "write_mode" "text",
    "archived_at" timestamp with time zone,
    "archived_by" "uuid"
);


ALTER TABLE "backup_20260324"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."client_assignments" (
    "id" "uuid",
    "client_id" "uuid",
    "user_id" "uuid",
    "role" "text",
    "assigned_at" timestamp with time zone,
    "status" "text"
);


ALTER TABLE "backup_20260324"."client_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."closer_calls" (
    "id" "uuid",
    "contact_id" "uuid",
    "closer_id" "uuid",
    "date" "date",
    "status" "text",
    "revenue" numeric(12,2),
    "notes" "text",
    "created_at" timestamp with time zone,
    "setter_id" "uuid",
    "lead_id" "uuid",
    "nombre_paiements" integer,
    "link" "text",
    "debrief" "text"
);


ALTER TABLE "backup_20260324"."closer_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."coaching_sessions" (
    "id" "uuid",
    "client_id" "uuid",
    "coach_id" "uuid",
    "title" "text",
    "session_type" "text",
    "scheduled_at" timestamp with time zone,
    "duration_minutes" integer,
    "status" "text",
    "notes" "text",
    "action_items" "jsonb",
    "replay_url" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."coaching_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."commissions" (
    "id" "uuid",
    "contract_id" "uuid",
    "contractor_id" "uuid",
    "contractor_role" "text",
    "percentage" numeric(5,2),
    "amount" numeric(12,2),
    "status" "text",
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone,
    "sale_id" "uuid",
    "sale_amount" numeric(12,2),
    "commission_rate" numeric(5,4),
    "commission_amount" numeric(12,2),
    "updated_at" timestamp with time zone,
    "split_type" "text",
    "closer_call_id" "uuid"
);


ALTER TABLE "backup_20260324"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."contracts" (
    "id" "uuid",
    "template_id" "uuid",
    "client_id" "uuid",
    "title" "text",
    "content" "text",
    "status" "text",
    "signature_data" "jsonb",
    "sent_at" timestamp with time zone,
    "signed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "signature_image" "text",
    "amount" numeric(12,2),
    "auto_renew" boolean,
    "end_date" "date",
    "renewal_status" "text",
    "renewed_to" "uuid",
    "cancellation_reason" "text"
);


ALTER TABLE "backup_20260324"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."crm_contacts" (
    "id" "uuid",
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "company" "text",
    "source" "text",
    "stage" "text",
    "assigned_to" "uuid",
    "estimated_value" numeric(12,2),
    "notes" "text",
    "tags" "text"[],
    "last_contact_at" timestamp with time zone,
    "converted_profile_id" "uuid",
    "sort_order" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "lead_score" integer,
    "last_interaction_at" timestamp with time zone,
    "interaction_count" integer,
    "pipeline_stage" "text",
    "closer_stage" "text",
    "closer_id" "uuid",
    "returned_by_closer" boolean,
    "enrichment_data" "jsonb",
    "enrichment_status" "text",
    "last_enriched_at" timestamp with time zone,
    "qualification_score" integer,
    "revenue_range" "text",
    "goals" "text",
    "captured_at" timestamp with time zone,
    "lost_reason" "text",
    "linkedin_url" "text",
    "instagram_url" "text",
    "tiktok_url" "text",
    "facebook_url" "text",
    "website_url" "text",
    "youtube_url" "text"
);


ALTER TABLE "backup_20260324"."crm_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."feed_posts" (
    "id" "uuid",
    "author_id" "uuid",
    "content" "text",
    "post_type" "text",
    "media_urls" "text"[],
    "is_pinned" boolean,
    "likes_count" integer,
    "comments_count" integer,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "category" "text",
    "win_data" "jsonb",
    "community_id" "uuid"
);


ALTER TABLE "backup_20260324"."feed_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."financial_entries" (
    "id" "uuid",
    "contact_id" "uuid",
    "type" "text",
    "label" "text",
    "amount" numeric(12,2),
    "date" "date",
    "is_paid" boolean,
    "recurrence" "text",
    "created_at" timestamp with time zone,
    "client_id" "uuid",
    "created_by" "uuid",
    "prestataire" "text",
    "currency" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."financial_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."form_submissions" (
    "id" "uuid",
    "form_id" "uuid",
    "respondent_id" "uuid",
    "answers" "jsonb",
    "submitted_at" timestamp with time zone,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "backup_20260324"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."formations_enrollments" (
    "id" "uuid",
    "user_id" "uuid",
    "formation_id" "uuid",
    "progress" numeric,
    "completed" boolean,
    "enrolled_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."formations_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."forms" (
    "id" "uuid",
    "title" "text",
    "description" "text",
    "status" "text",
    "created_by" "uuid",
    "cover_image_url" "text",
    "thank_you_message" "text",
    "is_anonymous" boolean,
    "allow_multiple_submissions" boolean,
    "closes_at" timestamp with time zone,
    "target_audience" "text",
    "target_student_ids" "uuid"[],
    "notification_on_submit" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."journal_entries" (
    "id" "uuid",
    "author_id" "uuid",
    "title" "text",
    "content" "text",
    "mood" integer,
    "tags" "text"[],
    "is_private" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "media_urls" "text"[],
    "shared_with_coach" boolean,
    "prompt_id" "uuid",
    "attachments" "jsonb",
    "template" "text"
);


ALTER TABLE "backup_20260324"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."leads" (
    "id" "uuid",
    "setter_id" "uuid",
    "client_id" "uuid",
    "column_id" "uuid",
    "name" "text",
    "phone" "text",
    "email" "text",
    "instagram_handle" "text",
    "linkedin_handle" "text",
    "objectif" "text",
    "douleur" "text",
    "ca_contracte" numeric,
    "ca_collecte" numeric,
    "duree_collecte" integer,
    "status" "text",
    "date_premier_contact" "date",
    "date_relance" "date",
    "notes" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."messages" (
    "id" "uuid",
    "channel_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "content_type" "text",
    "reply_to" "uuid",
    "is_pinned" boolean,
    "is_edited" boolean,
    "metadata" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "is_ai_generated" boolean,
    "is_urgent" boolean,
    "scheduled_at" timestamp with time zone,
    "reactions" "jsonb",
    "attachments" "jsonb"
);


ALTER TABLE "backup_20260324"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."notifications" (
    "id" "uuid",
    "recipient_id" "uuid",
    "type" "text",
    "title" "text",
    "body" "text",
    "data" "jsonb",
    "is_read" boolean,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "category" "text",
    "action_url" "text",
    "is_archived" boolean,
    "priority" "text",
    "batched_at" timestamp with time zone,
    "batch_id" "uuid",
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."payment_schedules" (
    "id" "uuid",
    "contract_id" "uuid",
    "client_id" "uuid",
    "total_amount" numeric(10,2),
    "installments" integer,
    "frequency" "text",
    "start_date" "date",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "status" "text",
    "due_date" "date",
    "installment_details" "jsonb"
);


ALTER TABLE "backup_20260324"."payment_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."profiles" (
    "id" "uuid",
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role",
    "phone" "text",
    "bio" "text",
    "timezone" "text",
    "onboarding_completed" boolean,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "onboarding_step" integer,
    "status_text" "text",
    "status_emoji" "text",
    "status_expires_at" timestamp with time zone,
    "dnd_enabled" boolean,
    "dnd_start" "text",
    "dnd_end" "text",
    "ai_consent" boolean,
    "ai_consent_at" timestamp with time zone,
    "notification_sounds" boolean,
    "urgent_sounds" boolean,
    "onboarding_offer_id" "uuid",
    "onboarding_answers" "jsonb",
    "onboarding_completed_at" timestamp with time zone,
    "default_currency" "text",
    "ai_consent_given_at" timestamp with time zone,
    "ai_consent_scope" "jsonb",
    "leaderboard_anonymous" boolean,
    "anonymous_alias" "text",
    "custom_role_id" "uuid",
    "business_type" "text",
    "current_revenue" "text",
    "goals" "text",
    "how_found" "text",
    "specialties" "text"[],
    "is_archived" boolean,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "siret" "text",
    "company_name" "text",
    "company_address" "text",
    "legal_form" "text",
    "assigned_coach" "uuid",
    "last_sign_in_at" timestamp with time zone,
    "is_active" boolean
);


ALTER TABLE "backup_20260324"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "backup_20260324"."user_roles" (
    "id" "uuid",
    "user_id" "uuid",
    "role" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "backup_20260324"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" "text" DEFAULT 'medium'::"text",
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_insights_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "ai_insights_type_check" CHECK (("type" = ANY (ARRAY['student_risk'::"text", 'engagement_drop'::"text", 'content_suggestion'::"text", 'revenue_insight'::"text", 'weekly_summary'::"text"])))
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_question_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text",
    "was_escalated" boolean DEFAULT false,
    "was_helpful" boolean,
    "kb_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_question_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_reports_type_check" CHECK (("type" = ANY (ARRAY['weekly_coaching'::"text", 'monthly_performance'::"text", 'client_risk'::"text"])))
);


ALTER TABLE "public"."ai_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcement_dismissals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "announcement_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcement_dismissals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "target_roles" "text"[],
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "announcements_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'urgent'::"text", 'update'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "key_prefix" "text" NOT NULL,
    "scopes" "text"[] DEFAULT '{read}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text",
    "is_secret" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "url" "text",
    "type" "text",
    "size" integer,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "override_date" "date" NOT NULL,
    "is_blocked" boolean DEFAULT true,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."availability_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "slot_duration_minutes" integer DEFAULT 30 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "availability_slots_check" CHECK (("start_time" < "end_time")),
    CONSTRAINT "availability_slots_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."availability_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."avatars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."avatars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "category" "text" NOT NULL,
    "rarity" "text" DEFAULT 'common'::"text" NOT NULL,
    "condition" "jsonb" DEFAULT '{}'::"jsonb",
    "xp_reward" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "badges_category_check" CHECK (("category" = ANY (ARRAY['learning'::"text", 'engagement'::"text", 'social'::"text", 'streak'::"text", 'milestone'::"text", 'onboarding'::"text"]))),
    CONSTRAINT "badges_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'uncommon'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_page_id" "uuid",
    "day_of_week" integer NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."booking_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_page_id" "uuid",
    "exception_date" "date" NOT NULL,
    "type" "text" DEFAULT 'blocked'::"text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_page_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" DEFAULT 'Prendre rendez-vous'::"text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "brand_color" "text" DEFAULT '#AF0000'::"text",
    "slot_duration" integer DEFAULT 30,
    "buffer_minutes" integer DEFAULT 10,
    "min_notice_hours" integer DEFAULT 24,
    "max_days_ahead" integer DEFAULT 30,
    "qualification_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_page_id" "uuid",
    "prospect_name" "text" NOT NULL,
    "prospect_email" "text",
    "prospect_phone" "text",
    "date" "date" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text",
    "qualification_answers" "jsonb" DEFAULT '{}'::"jsonb",
    "google_event_id" "text",
    "meet_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "call_result" "text",
    "objections" "text",
    "follow_up_notes" "text",
    "follow_up_date" timestamp with time zone,
    CONSTRAINT "bookings_call_result_check" CHECK (("call_result" = ANY (ARRAY['vente_réalisée'::"text", 'non_réalisée'::"text", 'suivi_prévu'::"text", 'no_show'::"text"])))
);
