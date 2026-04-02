
CREATE TABLE IF NOT EXISTS "public"."google_calendar_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "calendar_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."google_calendar_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hall_of_fame" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "achievement" "text",
    "description" "text",
    "featured_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hall_of_fame" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xp_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "xp_amount" integer NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."xp_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."hall_of_fame_enriched" AS
 SELECT "h"."id",
    "h"."user_id" AS "profile_id",
    "h"."achievement",
    "h"."description",
    "h"."featured_at",
    "h"."created_at",
    "p"."full_name",
    "p"."avatar_url",
    "p"."bio",
    COALESCE("xp"."total_xp", 0) AS "total_xp",
    COALESCE("b"."badge_count", 0) AS "badge_count",
    (COALESCE("sd"."current_revenue", (0)::numeric))::integer AS "monthly_revenue",
    "sd"."niche"
   FROM (((("public"."hall_of_fame" "h"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "h"."user_id")))
     LEFT JOIN "public"."student_details" "sd" ON (("sd"."profile_id" = "h"."user_id")))
     LEFT JOIN LATERAL ( SELECT ("sum"("xp_transactions"."xp_amount"))::integer AS "total_xp"
           FROM "public"."xp_transactions"
          WHERE ("xp_transactions"."profile_id" = "h"."user_id")) "xp" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "badge_count"
           FROM "public"."user_badges"
          WHERE ("user_badges"."profile_id" = "h"."user_id")) "b" ON (true))
  ORDER BY "h"."featured_at" DESC;


ALTER VIEW "public"."hall_of_fame_enriched" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "username" "text",
    "followers" integer DEFAULT 0,
    "following" integer DEFAULT 0,
    "media_count" integer DEFAULT 0,
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_post_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid",
    "post_url" "text",
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "reach" integer DEFAULT 0,
    "engagement_rate" numeric(5,2),
    "posted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_post_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoice_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_number_seq" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."item_completions" AS
 SELECT "id",
    "lesson_id",
    "student_id",
    "status",
    "progress_percent",
    "time_spent",
    "completed_at",
    "last_accessed_at",
    "created_at"
   FROM "public"."lesson_progress";


ALTER VIEW "public"."item_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journal_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "mood" integer,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_private" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "shared_with_coach" boolean DEFAULT false,
    "prompt_id" "uuid",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "template" "text",
    CONSTRAINT "journal_entries_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "day_of_week" integer,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journal_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_base_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "source_type" "text" DEFAULT 'manual'::"text",
    "source_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "question_count" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."knowledge_base_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metric" "text" NOT NULL,
    "target_value" numeric DEFAULT 0 NOT NULL,
    "current_value" numeric DEFAULT 0 NOT NULL,
    "unit" "text" DEFAULT ''::"text" NOT NULL,
    "period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date",
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kpi_goals_period_check" CHECK (("period" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."kpi_goals" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leaderboard" AS
 SELECT "p"."id" AS "profile_id",
        CASE
            WHEN COALESCE("p"."leaderboard_anonymous", false) THEN COALESCE("p"."anonymous_alias", 'Anonyme'::"text")
            ELSE "p"."full_name"
        END AS "full_name",
        CASE
            WHEN COALESCE("p"."leaderboard_anonymous", false) THEN NULL::"text"
            ELSE "p"."avatar_url"
        END AS "avatar_url",
    (COALESCE("sum"("xt"."xp_amount"), (0)::bigint))::integer AS "total_xp",
    ("count"(DISTINCT "ub"."badge_id"))::integer AS "badge_count",
    ("rank"() OVER (ORDER BY COALESCE("sum"("xt"."xp_amount"), (0)::bigint) DESC))::integer AS "rank"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."xp_transactions" "xt" ON (("xt"."profile_id" = "p"."id")))
     LEFT JOIN "public"."user_badges" "ub" ON (("ub"."profile_id" = "p"."id")))
  WHERE ("p"."role" = ANY (ARRAY['client'::"public"."user_role", 'prospect'::"public"."user_role"]))
  GROUP BY "p"."id", "p"."full_name", "p"."avatar_url", "p"."leaderboard_anonymous", "p"."anonymous_alias";


ALTER VIEW "public"."leaderboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leads" AS
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


ALTER VIEW "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_action_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_action_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "reply_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."level_config" (
    "level" integer NOT NULL,
    "name" "text" NOT NULL,
    "min_xp" integer NOT NULL,
    "icon" "text",
    "color" "text"
);


ALTER TABLE "public"."level_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."member_stats" AS
 SELECT "p"."id",
    "p"."full_name",
    "p"."avatar_url",
    "p"."role",
    "p"."bio",
    "p"."created_at",
    COALESCE("xp"."total_xp", 0) AS "total_xp",
    COALESCE("b"."badge_count", 0) AS "badge_count",
    COALESCE("lc"."level", 1) AS "level",
    COALESCE("lc"."name", 'Debutant'::"text") AS "level_name",
    COALESCE("lc"."icon", '🌱'::"text") AS "level_icon"
   FROM ((("public"."profiles" "p"
     LEFT JOIN LATERAL ( SELECT ("sum"("xp_transactions"."xp_amount"))::integer AS "total_xp"
           FROM "public"."xp_transactions"
          WHERE ("xp_transactions"."profile_id" = "p"."id")) "xp" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "badge_count"
           FROM "public"."user_badges"
          WHERE ("user_badges"."profile_id" = "p"."id")) "b" ON (true))
     LEFT JOIN LATERAL ( SELECT "lc2"."level",
            "lc2"."name",
            "lc2"."icon"
           FROM "public"."level_config" "lc2"
          WHERE ("lc2"."min_xp" <= COALESCE("xp"."total_xp", 0))
          ORDER BY "lc2"."min_xp" DESC
         LIMIT 1) "lc" ON (true))
  ORDER BY "p"."full_name";


ALTER VIEW "public"."member_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "created_by" "uuid",
    "is_shared" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "usage_count" integer DEFAULT 0,
    "shortcut" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'text'::"text",
    "reply_to" "uuid",
    "is_pinned" boolean DEFAULT false,
    "is_edited" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_ai_generated" boolean DEFAULT false,
    "is_urgent" boolean DEFAULT false,
    "scheduled_at" timestamp with time zone,
    "reactions" "jsonb" DEFAULT '{}'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "messages_content_type_check" CHECK (("content_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text", 'video'::"text", 'audio'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."miro_boards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" DEFAULT 'Nouveau tableau'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."miro_boards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."miro_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "x" numeric DEFAULT 0 NOT NULL,
    "y" numeric DEFAULT 0 NOT NULL,
    "width" numeric DEFAULT 420,
    "title" "text",
    "content" "text",
    "card_type" "text" DEFAULT 'default'::"text",
    "style" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."miro_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."miro_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "from_card_id" "uuid" NOT NULL,
    "to_card_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."miro_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."miro_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "x" numeric DEFAULT 0 NOT NULL,
    "y" numeric DEFAULT 0 NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."miro_sections" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."module_items" AS
 SELECT "id",
    "module_id",
    "title",
    "content_type",
    "content",
    "sort_order",
    "estimated_duration",
    "is_preview",
    "created_at",
    "updated_at",
    "description",
    "attachments",
    "video_url",
    "content_html",
    "embed_url",
    "embed_type",
    "audio_url",
    "audio_duration"
   FROM "public"."lessons";


ALTER VIEW "public"."module_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone NOT NULL,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    "batch_frequency" "text" DEFAULT 'instant'::"text" NOT NULL,
    "priority_threshold" "text" DEFAULT 'all'::"text" NOT NULL,
    "email_digest" boolean DEFAULT true NOT NULL,
    "push_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_preferences_batch_frequency_check" CHECK (("batch_frequency" = ANY (ARRAY['instant'::"text", 'hourly'::"text", 'daily'::"text"]))),
    CONSTRAINT "notification_preferences_priority_threshold_check" CHECK (("priority_threshold" = ANY (ARRAY['all'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'general'::"text",
    "action_url" "text",
    "is_archived" boolean DEFAULT false,
    "priority" "text" DEFAULT 'normal'::"text",
    "batched_at" timestamp with time zone,
    "batch_id" "uuid",
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['new_message'::"text", 'mention'::"text", 'form_response'::"text", 'module_complete'::"text", 'task_assigned'::"text", 'task_due'::"text", 'student_inactive'::"text", 'new_enrollment'::"text", 'ai_insight'::"text", 'system'::"text", 'feed'::"text", 'contract_signed'::"text", 'contract_generated'::"text", 'onboarding_complete'::"text", 'report'::"text", 'checkin'::"text", 'goal'::"text", 'badge'::"text", 'call_reminder'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offboarding_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transfer_to_id" "uuid",
    "reason" "text",
    "requested_by" "uuid" NOT NULL,
    "data_actions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "offboarding_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."offboarding_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "href" "text",
    "icon" "text",
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "welcome_message" "text",
    "recommended_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."onboarding_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "step" "text" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "step_key" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "reminder_type" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_reminders_reminder_type_check" CHECK (("reminder_type" = ANY (ARRAY['j-3'::"text", 'j0'::"text", 'j+3'::"text", 'j+7'::"text", 'j+14'::"text"])))
);


ALTER TABLE "public"."payment_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "installments" integer DEFAULT 1 NOT NULL,
    "frequency" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" "date",
    "installment_details" "jsonb",
    CONSTRAINT "payment_schedules_frequency_check" CHECK (("frequency" = ANY (ARRAY['monthly'::"text", 'weekly'::"text", 'biweekly'::"text", 'custom'::"text"]))),
    CONSTRAINT "payment_schedules_installments_check" CHECK ((("installments" >= 1) AND ("installments" <= 12)))
);


ALTER TABLE "public"."payment_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_columns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "is_terminal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_columns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pre_call_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "objective" "text" NOT NULL,
    "tried_solutions" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pre_call_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "endpoint" "text" NOT NULL,
    "keys" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "answers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "score" numeric(5,2) DEFAULT 0 NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "correct_answers" integer DEFAULT 0 NOT NULL,
    "passed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "time_spent" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "max_score" integer DEFAULT 0 NOT NULL,
    "result_index" integer,
    "email" "text",
    "profile_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cta_text" "text" DEFAULT 'Cree ton compte pour decouvrir ton plan d''action'::"text",
    "cta_url" "text" DEFAULT '/register'::"text",
    "is_published" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relance_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "sequence_id" "uuid",
    "current_step" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "next_step_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "enrolled_by" "uuid"
);


ALTER TABLE "public"."relance_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sequence_id" "uuid",
    "enrollment_id" "uuid",
    "step_index" integer,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'sent'::"text"
);


ALTER TABLE "public"."relance_logs" OWNER TO "postgres";

