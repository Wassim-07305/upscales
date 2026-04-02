
ALTER TABLE "public"."coaching_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaching_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Session de coaching'::"text" NOT NULL,
    "session_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "notes" "text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "replay_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coaching_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['individual'::"text", 'group'::"text", 'emergency'::"text"]))),
    CONSTRAINT "coaching_sessions_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."coaching_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setter_id" "uuid" NOT NULL,
    "rate" numeric(5,2) DEFAULT 5.00 NOT NULL,
    "split_first" numeric(5,2) DEFAULT 70.00 NOT NULL,
    "split_second" numeric(5,2) DEFAULT 30.00 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."commission_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid",
    "contractor_id" "uuid" NOT NULL,
    "contractor_role" "text" NOT NULL,
    "percentage" numeric(5,2) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sale_id" "uuid",
    "sale_amount" numeric(12,2),
    "commission_rate" numeric(5,4),
    "commission_amount" numeric(12,2),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "split_type" "text" DEFAULT 'full'::"text",
    "closer_call_id" "uuid",
    CONSTRAINT "commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "icon" "text",
    "color" "text" DEFAULT '#ef4444'::"text",
    "is_private" boolean DEFAULT false,
    "max_members" integer,
    "created_by" "uuid",
    "member_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competition_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "competition_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "user_id" "uuid",
    "score" numeric DEFAULT 0 NOT NULL,
    "rank" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "competition_participants_check" CHECK ((("team_id" IS NOT NULL) OR ("user_id" IS NOT NULL)))
);


ALTER TABLE "public"."competition_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'team_vs_team'::"text" NOT NULL,
    "metric" "text" DEFAULT 'xp'::"text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "prize_description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "competitions_metric_check" CHECK (("metric" = ANY (ARRAY['xp'::"text", 'calls'::"text", 'clients'::"text", 'revenue'::"text"]))),
    CONSTRAINT "competitions_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'active'::"text", 'completed'::"text"]))),
    CONSTRAINT "competitions_type_check" CHECK (("type" = ANY (ARRAY['team_vs_team'::"text", 'free_for_all'::"text"])))
);


ALTER TABLE "public"."competitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contact_interactions_type_check" CHECK (("type" = ANY (ARRAY['call'::"text", 'email'::"text", 'meeting'::"text", 'note'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."contact_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_renewal_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid",
    "action" "text",
    "old_end_date" "date",
    "new_end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "details" "jsonb",
    "new_contract_id" "uuid",
    "period_months" integer
);


ALTER TABLE "public"."contract_renewal_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "signature_data" "jsonb",
    "sent_at" timestamp with time zone,
    "signed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "signature_image" "text",
    "amount" numeric(12,2),
    "auto_renew" boolean DEFAULT false,
    "end_date" "date",
    "renewal_status" "text",
    "renewed_to" "uuid",
    "cancellation_reason" "text",
    "signed_pdf_url" "text",
    CONSTRAINT "contracts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'signed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_prerequisites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "prerequisite_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "prerequisite_course_id" "uuid"
);


ALTER TABLE "public"."course_prerequisites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "sort_order" integer DEFAULT 0,
    "is_mandatory" boolean DEFAULT false,
    "estimated_duration" integer,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "drip_type" "text" DEFAULT 'none'::"text",
    "drip_delay_days" integer DEFAULT 0,
    "drip_min_level" integer DEFAULT 0,
    "access_type" "text" DEFAULT 'all'::"text",
    CONSTRAINT "courses_access_type_check" CHECK (("access_type" = ANY (ARRAY['all'::"text", 'level'::"text", 'group'::"text", 'time'::"text", 'manual'::"text"]))),
    CONSTRAINT "courses_drip_type_check" CHECK (("drip_type" = ANY (ARRAY['none'::"text", 'time_based'::"text", 'level_based'::"text", 'completion_based'::"text", 'manual'::"text"]))),
    CONSTRAINT "courses_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."currency_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "base" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "target" "text" NOT NULL,
    "rate" numeric(12,6) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."currency_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "color" "text" DEFAULT '#6B7280'::"text",
    "icon" "text" DEFAULT 'Shield'::"text",
    "is_system" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."custom_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "activity_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "activity_type" "text" NOT NULL,
    "count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    "actions" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."daily_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "checkin_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "checkin_type" "text" NOT NULL,
    "energy" integer,
    "mood" integer,
    "goal_today" "text",
    "priority" "text",
    "wins" "text",
    "learnings" "text",
    "challenges" "text",
    "gratitude" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_checkins_checkin_type_check" CHECK (("checkin_type" = ANY (ARRAY['morning'::"text", 'evening'::"text"]))),
    CONSTRAINT "daily_checkins_energy_check" CHECK ((("energy" >= 1) AND ("energy" <= 5))),
    CONSTRAINT "daily_checkins_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."daily_checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "contract_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax" numeric(10,2) DEFAULT 0 NOT NULL,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "stripe_invoice_id" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tax_rate" numeric DEFAULT 20,
    "discount" numeric(12,2) DEFAULT 0,
    "line_items" "jsonb",
    "description" "text",
    "title" "text",
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text", 'refunded'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "week_start" "date" NOT NULL,
    "revenue" numeric(10,2) DEFAULT 0,
    "prospection_count" integer DEFAULT 0,
    "win" "text",
    "blocker" "text",
    "goal_next_week" "text",
    "mood" integer,
    "coach_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "energy" integer,
    "gratitudes" "text"[] DEFAULT '{}'::"text"[],
    "daily_goals" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "goals_progress" "text",
    CONSTRAINT "weekly_checkins_energy_check" CHECK ((("energy" >= 1) AND ("energy" <= 5))),
    CONSTRAINT "weekly_checkins_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."weekly_checkins" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_kpis" AS
 SELECT (( SELECT "count"(*) AS "count"
           FROM "public"."profiles"
          WHERE ("profiles"."role" = 'client'::"public"."user_role")))::integer AS "total_clients",
    (( SELECT "count"(*) AS "count"
           FROM "public"."profiles"
          WHERE (("profiles"."role" = 'client'::"public"."user_role") AND ("profiles"."created_at" <= ("date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone) - '1 day'::interval)))))::integer AS "last_month_clients",
    ( SELECT COALESCE("sum"("invoices"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."invoices"
          WHERE (("invoices"."status" = 'paid'::"text") AND ("invoices"."created_at" >= "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))) AS "revenue_this_month",
    ( SELECT COALESCE("sum"("invoices"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."invoices"
          WHERE (("invoices"."status" = 'paid'::"text") AND ("invoices"."created_at" >= ("date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone) - '1 mon'::interval)) AND ("invoices"."created_at" < "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))) AS "revenue_last_month",
    (( SELECT "count"(*) AS "count"
           FROM "public"."courses"
          WHERE ("courses"."status" = 'published'::"text")))::integer AS "active_courses",
    (( SELECT "count"(*) AS "count"
           FROM "public"."weekly_checkins"
          WHERE ("weekly_checkins"."week_start" >= "date_trunc"('week'::"text", (CURRENT_DATE)::timestamp with time zone))))::integer AS "weekly_checkins";


ALTER VIEW "public"."dashboard_kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "widgets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text",
    "progress_percent" integer DEFAULT 0,
    "time_spent" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "checklist_completions" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "lesson_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "estimated_duration" integer,
    "is_preview" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "video_url" "text",
    "content_html" "text",
    "embed_url" "text",
    "embed_type" "text",
    "audio_url" "text",
    "audio_duration" integer,
    CONSTRAINT "lessons_content_type_check" CHECK (("content_type" = ANY (ARRAY['video'::"text", 'text'::"text", 'pdf'::"text", 'quiz'::"text", 'assignment'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."engagement_stats" AS
 SELECT (( SELECT "count"(*) AS "count"
           FROM "public"."lesson_progress"))::integer AS "total_completions",
    (( SELECT "count"(*) AS "count"
           FROM "public"."lessons"))::integer AS "total_lessons",
    (( SELECT "count"(*) AS "count"
           FROM "public"."profiles"
          WHERE ("profiles"."role" = 'client'::"public"."user_role")))::integer AS "total_students",
    (( SELECT "count"(*) AS "count"
           FROM "public"."weekly_checkins"
          WHERE ("weekly_checkins"."week_start" >= "date_trunc"('week'::"text", (CURRENT_DATE)::timestamp with time zone))))::integer AS "weekly_checkins";


ALTER VIEW "public"."engagement_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrichment_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "enriched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "enrichment_results_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."enrichment_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "stack" "text",
    "component_stack" "text",
    "page" "text",
    "route" "text",
    "user_id" "uuid",
    "user_email" "text",
    "user_role" "text",
    "source" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "severity" "text" DEFAULT 'error'::"text" NOT NULL,
    "user_agent" "text",
    "viewport" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "resolved" boolean DEFAULT false NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "error_logs_severity_check" CHECK (("severity" = ANY (ARRAY['warning'::"text", 'error'::"text", 'critical'::"text"]))),
    CONSTRAINT "error_logs_source_check" CHECK (("source" = ANY (ARRAY['error-boundary'::"text", 'unhandled-error'::"text", 'unhandled-rejection'::"text", 'api-error'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid",
    "student_id" "uuid",
    "content" "text",
    "file_url" "text",
    "status" "text" DEFAULT 'submitted'::"text",
    "feedback" "text",
    "grade" numeric(5,2),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exercise_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faq_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" DEFAULT ''::"text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "occurrence_count" integer DEFAULT 1 NOT NULL,
    "auto_answer_enabled" boolean DEFAULT false NOT NULL,
    "source_message_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "last_asked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."faq_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faq_question_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text",
    "matched_faq_id" "uuid",
    "confidence" numeric(3,2),
    "asked_by" "uuid",
    "auto_answered" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."faq_question_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "post_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "is_pinned" boolean DEFAULT false,
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'general'::"text",
    "win_data" "jsonb",
    "community_id" "uuid",
    CONSTRAINT "feed_posts_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'wins'::"text", 'questions'::"text", 'resources'::"text", 'off_topic'::"text"]))),
    CONSTRAINT "feed_posts_post_type_check" CHECK (("post_type" = ANY (ARRAY['victory'::"text", 'question'::"text", 'experience'::"text", 'general'::"text", 'resource'::"text", 'off_topic'::"text"])))
);


ALTER TABLE "public"."feed_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "comment_id" "uuid",
    "reporter_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "action_taken" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feed_reports_action_taken_check" CHECK (("action_taken" = ANY (ARRAY['warning'::"text", 'content_removed'::"text", 'user_suspended'::"text", NULL::"text"]))),
    CONSTRAINT "feed_reports_reason_check" CHECK (("reason" = ANY (ARRAY['spam'::"text", 'harassment'::"text", 'inappropriate'::"text", 'misinformation'::"text", 'other'::"text"]))),
    CONSTRAINT "feed_reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'actioned'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "report_target" CHECK (((("post_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("post_id" IS NULL) AND ("comment_id" IS NOT NULL))))
);


ALTER TABLE "public"."feed_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "type" "text",
    "label" "text",
    "amount" numeric(12,2),
    "date" "date",
    "is_paid" boolean DEFAULT false,
    "recurrence" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid",
    "created_by" "uuid",
    "prestataire" "text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flag_history" (
    "id" "uuid",
    "client_id" "uuid",
    "previous_flag" "text",
    "new_flag" "text",
    "reason" "text",
    "changed_by" "uuid",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."flag_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "field_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "placeholder" "text",
    "is_required" boolean DEFAULT false,
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "validation" "jsonb" DEFAULT '{}'::"jsonb",
    "conditional_logic" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "form_fields_field_type_check" CHECK (("field_type" = ANY (ARRAY['short_text'::"text", 'long_text'::"text", 'email'::"text", 'phone'::"text", 'number'::"text", 'single_select'::"text", 'multi_select'::"text", 'dropdown'::"text", 'rating'::"text", 'nps'::"text", 'scale'::"text", 'date'::"text", 'time'::"text", 'file_upload'::"text", 'heading'::"text", 'paragraph'::"text", 'divider'::"text", 'step'::"text", 'callout'::"text", 'checklist'::"text"])))
);


ALTER TABLE "public"."form_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "respondent_id" "uuid",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "thumbnail_emoji" "text" DEFAULT '📋'::"text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_system" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "form_templates_category_check" CHECK (("category" = ANY (ARRAY['onboarding'::"text", 'feedback'::"text", 'evaluation'::"text", 'intake'::"text", 'survey'::"text"])))
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."formation_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "formation_id" "uuid" NOT NULL,
    "progress" numeric DEFAULT 0,
    "completed" boolean DEFAULT false,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."formation_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_locked" boolean DEFAULT false,
    "unlock_condition" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."formation_modules" AS
 SELECT "id",
    "course_id",
    "title",
    "description",
    "sort_order",
    "is_locked",
    "unlock_condition",
    "created_at"
   FROM "public"."modules";


ALTER VIEW "public"."formation_modules" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."formations" AS
 SELECT "id",
    "title",
    "description",
    "cover_image_url",
    "status",
    "sort_order",
    "is_mandatory",
    "estimated_duration",
    "created_by",
    "created_at",
    "updated_at",
    "drip_type",
    "drip_delay_days",
    "drip_min_level",
    "access_type"
   FROM "public"."courses";


ALTER VIEW "public"."formations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_by" "uuid" NOT NULL,
    "cover_image_url" "text",
    "thank_you_message" "text" DEFAULT 'Merci pour ta reponse !'::"text",
    "is_anonymous" boolean DEFAULT false,
    "allow_multiple_submissions" boolean DEFAULT false,
    "closes_at" timestamp with time zone,
    "target_audience" "text" DEFAULT 'all'::"text",
    "target_student_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "notification_on_submit" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" DEFAULT 'form'::"text" NOT NULL,
    CONSTRAINT "forms_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text", 'archived'::"text"]))),
    CONSTRAINT "forms_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['all'::"text", 'vip'::"text", 'standard'::"text", 'new'::"text", 'custom'::"text"]))),
    CONSTRAINT "forms_type_check" CHECK (("type" = ANY (ARRAY['form'::"text", 'workbook'::"text"])))
);


ALTER TABLE "public"."forms" OWNER TO "postgres";
