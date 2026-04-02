
ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text",
    "value" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."branding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branding_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content_html" "text",
    "is_published" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."branding_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branding_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_name" "text" DEFAULT 'Off Market'::"text" NOT NULL,
    "logo_url" "text",
    "favicon_url" "text",
    "primary_color" "text" DEFAULT '#c41e3a'::"text" NOT NULL,
    "primary_color_dark" "text" DEFAULT '#e8374e'::"text" NOT NULL,
    "accent_color" "text" DEFAULT '#f97316'::"text" NOT NULL,
    "accent_color_dark" "text" DEFAULT '#fb923c'::"text" NOT NULL,
    "font_family" "text" DEFAULT 'Inter'::"text" NOT NULL,
    "border_radius" "text" DEFAULT '12'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."branding_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone,
    "event_type" "text" DEFAULT 'event'::"text" NOT NULL,
    "color" "text" DEFAULT '#8B5CF6'::"text" NOT NULL,
    "attendees" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_calendar" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "assigned_to" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "call_type" "text" DEFAULT 'manuel'::"text" NOT NULL,
    "status" "text" DEFAULT 'planifie'::"text" NOT NULL,
    "link" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "room_status" "text" DEFAULT 'idle'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "actual_duration_seconds" integer,
    "reschedule_reason" "text",
    "original_date" "date",
    "original_time" time without time zone,
    "satisfaction_rating" integer,
    CONSTRAINT "call_calendar_call_type_check" CHECK (("call_type" = ANY (ARRAY['manuel'::"text", 'iclosed'::"text", 'calendly'::"text", 'booking'::"text", 'autre'::"text", 'one_on_one'::"text", 'live'::"text"]))),
    CONSTRAINT "call_calendar_room_status_check" CHECK (("room_status" = ANY (ARRAY['idle'::"text", 'waiting'::"text", 'active'::"text", 'ended'::"text"]))),
    CONSTRAINT "call_calendar_satisfaction_rating_check" CHECK ((("satisfaction_rating" >= 1) AND ("satisfaction_rating" <= 5))),
    CONSTRAINT "call_calendar_status_check" CHECK (("status" = ANY (ARRAY['planifie'::"text", 'realise'::"text", 'no_show'::"text", 'annule'::"text", 'reporte'::"text"])))
);


ALTER TABLE "public"."call_calendar" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid",
    "type" "text",
    "title" "text",
    "content" "text",
    "url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content_html" "text",
    "content_markdown" "text",
    "generated_by" "text" DEFAULT 'ai'::"text",
    "model" "text"
);


ALTER TABLE "public"."call_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_note_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid",
    "is_shared" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."call_note_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "summary" "text",
    "client_mood" "text",
    "outcome" "text",
    "next_steps" "text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "call_notes_client_mood_check" CHECK (("client_mood" = ANY (ARRAY['tres_positif'::"text", 'positif'::"text", 'neutre'::"text", 'negatif'::"text", 'tres_negatif'::"text"]))),
    CONSTRAINT "call_notes_outcome_check" CHECK (("outcome" = ANY (ARRAY['interested'::"text", 'follow_up'::"text", 'not_interested'::"text", 'closed'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."call_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_recordings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid",
    "recording_url" "text",
    "duration" integer,
    "size" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "recorded_by" "uuid",
    "storage_path" "text",
    "duration_seconds" integer,
    "file_size_bytes" bigint,
    "mime_type" "text" DEFAULT 'video/webm'::"text"
);


ALTER TABLE "public"."call_recordings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_session_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" DEFAULT ''::"text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "is_shared_with_client" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."call_session_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "sections" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "model" "text" DEFAULT 'claude-sonnet-4-5-20250514'::"text" NOT NULL,
    "tokens_used" integer,
    "generation_time_ms" integer,
    "sources" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."call_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_transcripts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "content" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "language" "text" DEFAULT 'fr-FR'::"text" NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."call_transcripts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificate_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "certificate_number" "text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "course_title" "text" NOT NULL,
    "student_name" "text" NOT NULL,
    "total_lessons" integer DEFAULT 0 NOT NULL,
    "total_modules" integer DEFAULT 0 NOT NULL,
    "quiz_average" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificate_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "course_id" "uuid",
    "certificate_number" "text",
    "total_lessons" integer DEFAULT 0,
    "total_modules" integer DEFAULT 0,
    "quiz_average" numeric(5,2),
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "course_title" "text",
    "student_name" "text"
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "content" "text",
    "proof_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone,
    "verification_source" "text",
    "metric_type" "text",
    "metric_value" numeric,
    "review_note" "text",
    "review_status" "text",
    CONSTRAINT "challenge_entries_review_status_check" CHECK ((("review_status" IS NULL) OR ("review_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))))
);


ALTER TABLE "public"."challenge_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "progress" numeric(10,2) DEFAULT 0,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challenge_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "challenge_type" "text" NOT NULL,
    "condition" "jsonb" DEFAULT '{}'::"jsonb",
    "xp_reward" integer DEFAULT 0,
    "badge_reward" "uuid",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenges_challenge_type_check" CHECK (("challenge_type" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'community'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channel_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "last_read_at" timestamp with time zone DEFAULT "now"(),
    "notifications_muted" boolean DEFAULT false,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false NOT NULL,
    CONSTRAINT "channel_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'moderator'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'public'::"text" NOT NULL,
    "created_by" "uuid",
    "is_archived" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "avatar_url" "text",
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "write_mode" "text" DEFAULT 'all'::"text",
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    CONSTRAINT "channels_type_check" CHECK (("type" = ANY (ARRAY['public'::"text", 'private'::"text", 'dm'::"text", 'direct'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "mood" integer,
    "energy" integer,
    "revenue" numeric(10,2) DEFAULT 0,
    "prospection_count" integer DEFAULT 0,
    "win" "text",
    "blocker" "text",
    "goal_next_week" "text",
    "gratitudes" "text"[] DEFAULT '{}'::"text"[],
    "daily_goals" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "coach_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checkins_energy_check" CHECK ((("energy" >= 1) AND ("energy" <= 5))),
    CONSTRAINT "checkins_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_ai_memory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "summary" "text" DEFAULT ''::"text" NOT NULL,
    "key_facts" "jsonb" DEFAULT '[]'::"jsonb",
    "last_topics" "jsonb" DEFAULT '[]'::"jsonb",
    "conversation_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_ai_memory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'coach'::"text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."client_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_flag_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "previous_flag" "text",
    "new_flag" "text",
    "reason" "text",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_flag_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "flag" "text" DEFAULT 'green'::"text" NOT NULL,
    "reason" "text",
    "changed_by" "uuid",
    "notified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_flags_flag_check" CHECK (("flag" = ANY (ARRAY['green'::"text", 'yellow'::"text", 'orange'::"text", 'red'::"text"])))
);


ALTER TABLE "public"."client_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_roadmaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "generated_from" "text" DEFAULT 'manual'::"text" NOT NULL,
    "source_call_id" "uuid",
    "milestones_snapshot" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_roadmaps_generated_from_check" CHECK (("generated_from" = ANY (ARRAY['kickoff_call'::"text", 'manual'::"text", 'ai_suggestion'::"text"])))
);


ALTER TABLE "public"."client_roadmaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "company" "text",
    "source" "text",
    "stage" "text" DEFAULT 'prospect'::"text" NOT NULL,
    "assigned_to" "uuid",
    "estimated_value" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "last_contact_at" timestamp with time zone,
    "converted_profile_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lead_score" integer DEFAULT 0,
    "last_interaction_at" timestamp with time zone,
    "interaction_count" integer DEFAULT 0,
    "pipeline_stage" "text" GENERATED ALWAYS AS ("stage") STORED,
    "closer_stage" "text",
    "closer_id" "uuid",
    "returned_by_closer" boolean DEFAULT false,
    "enrichment_data" "jsonb",
    "enrichment_status" "text",
    "last_enriched_at" timestamp with time zone,
    "qualification_score" integer DEFAULT 0,
    "revenue_range" "text",
    "goals" "text",
    "captured_at" timestamp with time zone,
    "lost_reason" "text",
    "linkedin_url" "text",
    "instagram_url" "text",
    "tiktok_url" "text",
    "facebook_url" "text",
    "website_url" "text",
    "youtube_url" "text",
    CONSTRAINT "crm_contacts_closer_stage_check" CHECK (("closer_stage" = ANY (ARRAY['a_appeler'::"text", 'en_negociation'::"text", 'close'::"text", 'perdu'::"text"]))),
    CONSTRAINT "crm_contacts_lead_score_check" CHECK ((("lead_score" >= 0) AND ("lead_score" <= 100))),
    CONSTRAINT "crm_contacts_stage_check" CHECK (("stage" = ANY (ARRAY['prospect'::"text", 'qualifie'::"text", 'proposition'::"text", 'closing'::"text", 'client'::"text", 'perdu'::"text"])))
);


ALTER TABLE "public"."crm_contacts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clients" AS
 SELECT "id",
    "full_name",
    "email",
    "phone",
    "company",
    "source",
    "stage",
    "assigned_to",
    "estimated_value",
    "notes",
    "tags",
    "last_contact_at",
    "converted_profile_id",
    "sort_order",
    "created_by",
    "created_at",
    "updated_at",
    "lead_score",
    "last_interaction_at",
    "interaction_count"
   FROM "public"."crm_contacts";


ALTER VIEW "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."closer_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "closer_id" "uuid",
    "date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "revenue" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "setter_id" "uuid",
    "lead_id" "uuid",
    "nombre_paiements" integer DEFAULT 0,
    "link" "text",
    "debrief" "text",
    "client_id" "uuid"
);


ALTER TABLE "public"."closer_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_ai_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768),
    "chunk_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_ai_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_ai_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "ai_name" "text" DEFAULT 'AlexIA'::"text",
    "system_instructions" "text" DEFAULT ''::"text",
    "tone" "text" DEFAULT 'professionnel'::"text",
    "greeting_message" "text" DEFAULT 'Bonjour ! Je suis AlexIA, l''assistante de ton coach. Comment puis-je t''aider ?'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_ai_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_ai_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text",
    "file_size" integer DEFAULT 0,
    "file_type" "text" DEFAULT 'text'::"text",
    "chunk_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coach_ai_documents_status_check" CHECK (("status" = ANY (ARRAY['processing'::"text", 'ready'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."coach_ai_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "coach_id" "uuid",
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coach_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['no_checkin'::"text", 'revenue_drop'::"text", 'inactive_7d'::"text", 'inactive_14d'::"text", 'goal_at_risk'::"text", 'low_mood'::"text", 'payment_overdue'::"text"]))),
    CONSTRAINT "coach_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."coach_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "coach_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid",
    CONSTRAINT "coach_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."coach_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'client'::"public"."user_role" NOT NULL,
    "phone" "text",
    "bio" "text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "onboarding_completed" boolean DEFAULT false,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_step" integer DEFAULT 0,
    "status_text" "text",
    "status_emoji" "text",
    "status_expires_at" timestamp with time zone,
    "dnd_enabled" boolean DEFAULT false,
    "dnd_start" "text",
    "dnd_end" "text",
    "ai_consent" boolean,
    "ai_consent_at" timestamp with time zone,
    "notification_sounds" boolean DEFAULT true,
    "urgent_sounds" boolean DEFAULT true,
    "onboarding_offer_id" "uuid",
    "onboarding_answers" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_completed_at" timestamp with time zone,
    "default_currency" "text" DEFAULT 'EUR'::"text",
    "ai_consent_given_at" timestamp with time zone,
    "ai_consent_scope" "jsonb" DEFAULT '[]'::"jsonb",
    "leaderboard_anonymous" boolean DEFAULT false,
    "anonymous_alias" "text",
    "custom_role_id" "uuid",
    "business_type" "text",
    "current_revenue" "text",
    "goals" "text",
    "how_found" "text",
    "specialties" "text"[] DEFAULT '{}'::"text"[],
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "siret" "text",
    "company_name" "text",
    "company_address" "text",
    "legal_form" "text",
    "assigned_coach" "uuid",
    "last_sign_in_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role", 'team'::"public"."user_role", 'student'::"public"."user_role", 'prospect'::"public"."user_role", 'setter'::"public"."user_role", 'closer'::"public"."user_role", 'client'::"public"."user_role", 'sales'::"public"."user_role"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "tag" "text" DEFAULT 'standard'::"text",
    "revenue" numeric(10,2) DEFAULT 0,
    "lifetime_value" numeric(10,2) DEFAULT 0,
    "acquisition_source" "text",
    "enrollment_date" "date" DEFAULT CURRENT_DATE,
    "program" "text",
    "goals" "text",
    "coach_notes" "text",
    "health_score" integer DEFAULT 50,
    "last_engagement_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "flag" "text" DEFAULT 'green'::"text",
    "pipeline_stage" "text" DEFAULT 'onboarding'::"text",
    "engagement_score" integer DEFAULT 0,
    "niche" "text",
    "current_revenue" numeric DEFAULT 0,
    "revenue_objective" numeric DEFAULT 0,
    "obstacles" "text",
    "assigned_coach" "uuid",
    "completion_date" "date",
    CONSTRAINT "student_details_flag_check" CHECK (("flag" = ANY (ARRAY['green'::"text", 'yellow'::"text", 'orange'::"text", 'red'::"text"]))),
    CONSTRAINT "student_details_health_score_check" CHECK ((("health_score" >= 0) AND ("health_score" <= 100))),
    CONSTRAINT "student_details_tag_check" CHECK (("tag" = ANY (ARRAY['vip'::"text", 'standard'::"text", 'new'::"text", 'at_risk'::"text", 'churned'::"text"])))
);


ALTER TABLE "public"."student_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."coach_leaderboard" AS
 SELECT "p"."id",
    "p"."full_name" AS "name",
    "p"."avatar_url" AS "avatar",
    COALESCE("ca"."student_count", 0) AS "students",
    COALESCE("sd"."avg_health", 0) AS "avg_health",
    COALESCE("sess"."session_count", 0) AS "sessions_month",
    COALESCE("risk"."at_risk_count", 0) AS "at_risk",
    ("round"((((((((LEAST(COALESCE("ca"."student_count", 0), 20))::numeric / (20)::numeric) * (20)::numeric) + (((COALESCE("sd"."avg_health", 0))::numeric / (100)::numeric) * (25)::numeric)) +
        CASE
            WHEN (COALESCE("ca"."student_count", 0) > 0) THEN ((((COALESCE("ca"."student_count", 0) - COALESCE("risk"."at_risk_count", 0)))::numeric / (COALESCE("ca"."student_count", 0))::numeric) * (25)::numeric)
            ELSE (25)::numeric
        END) + (((LEAST(COALESCE("sess"."session_count", 0), 10))::numeric / (10)::numeric) * (15)::numeric)) +
        CASE
            WHEN (COALESCE("ca"."student_count", 0) > 0) THEN (((1)::numeric - ((COALESCE("risk"."at_risk_count", 0))::numeric / (COALESCE("ca"."student_count", 0))::numeric)) * (15)::numeric)
            ELSE (15)::numeric
        END)))::integer AS "score"
   FROM (((("public"."profiles" "p"
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "student_count"
           FROM "public"."coach_assignments"
          WHERE (("coach_assignments"."coach_id" = "p"."id") AND ("coach_assignments"."status" = 'active'::"text"))) "ca" ON (true))
     LEFT JOIN LATERAL ( SELECT ("round"("avg"("sd2"."health_score")))::integer AS "avg_health"
           FROM ("public"."student_details" "sd2"
             JOIN "public"."coach_assignments" "ca2" ON (("ca2"."client_id" = "sd2"."profile_id")))
          WHERE (("ca2"."coach_id" = "p"."id") AND ("ca2"."status" = 'active'::"text") AND ("sd2"."health_score" IS NOT NULL))) "sd" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "at_risk_count"
           FROM ("public"."student_details" "sd3"
             JOIN "public"."coach_assignments" "ca3" ON (("ca3"."client_id" = "sd3"."profile_id")))
          WHERE (("ca3"."coach_id" = "p"."id") AND ("ca3"."status" = 'active'::"text") AND (("sd3"."tag" = 'at_risk'::"text") OR ("sd3"."flag" = ANY (ARRAY['red'::"text", 'orange'::"text"]))))) "risk" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "session_count"
           FROM "public"."call_calendar" "cc"
          WHERE (("cc"."assigned_to" = "p"."id") AND ("cc"."status" = ANY (ARRAY['realise'::"text", 'completed'::"text"])) AND ("cc"."date" >= "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))) "sess" ON (true))
  WHERE ("p"."role" = ANY (ARRAY['coach'::"public"."user_role", 'admin'::"public"."user_role"]))
  ORDER BY (("round"((((((((LEAST(COALESCE("ca"."student_count", 0), 20))::numeric / (20)::numeric) * (20)::numeric) + (((COALESCE("sd"."avg_health", 0))::numeric / (100)::numeric) * (25)::numeric)) +
        CASE
            WHEN (COALESCE("ca"."student_count", 0) > 0) THEN ((((COALESCE("ca"."student_count", 0) - COALESCE("risk"."at_risk_count", 0)))::numeric / (COALESCE("ca"."student_count", 0))::numeric) * (25)::numeric)
            ELSE (25)::numeric
        END) + (((LEAST(COALESCE("sess"."session_count", 0), 10))::numeric / (10)::numeric) * (15)::numeric)) +
        CASE
            WHEN (COALESCE("ca"."student_count", 0) > 0) THEN (((1)::numeric - ((COALESCE("risk"."at_risk_count", 0))::numeric / (COALESCE("ca"."student_count", 0))::numeric)) * (15)::numeric)
            ELSE (15)::numeric
        END)))::integer) DESC, COALESCE("ca"."student_count", 0) DESC;


ALTER VIEW "public"."coach_leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaching_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "set_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "target_value" numeric(10,2),
    "current_value" numeric(10,2) DEFAULT 0,
    "unit" "text",
    "deadline" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "difficulty" smallint,
    "coach_notes" "text",
    "milestones" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "coaching_goals_difficulty_check" CHECK ((("difficulty" >= 1) AND ("difficulty" <= 5))),
    CONSTRAINT "coaching_goals_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'paused'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."coaching_goals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."coaching_goals"."difficulty" IS 'SMART: Atteignable - difficulty rating 1-5';



COMMENT ON COLUMN "public"."coaching_goals"."coach_notes" IS 'SMART: Realiste - coach notes on why goal is realistic';



COMMENT ON COLUMN "public"."coaching_goals"."milestones" IS 'Array of {id, title, completed, due_date} milestone objects';



CREATE TABLE IF NOT EXISTS "public"."coaching_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "target_value" numeric(10,2),
    "current_value" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coaching_milestones_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);
