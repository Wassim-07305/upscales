CREATE TABLE IF NOT EXISTS "public"."relance_sequences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_stage" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."relance_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relance_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sequence_id" "uuid",
    "step_order" integer NOT NULL,
    "delay_days" integer NOT NULL,
    "channel" "text" DEFAULT 'email'::"text" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."relance_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."replays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "video_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "duration_minutes" integer,
    "coach_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."replays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_folder_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "folder_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."resource_folder_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "visibility" "text" DEFAULT 'all'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "resource_folders_visibility_check" CHECK (("visibility" = ANY (ARRAY['all'::"text", 'staff'::"text", 'clients'::"text"])))
);


ALTER TABLE "public"."resource_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint DEFAULT 0 NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "visibility" "text" DEFAULT 'all'::"text" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "download_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "folder_id" "uuid",
    CONSTRAINT "resources_visibility_check" CHECK (("visibility" = ANY (ARRAY['all'::"text", 'staff'::"text", 'clients'::"text"])))
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."revenue_by_channel" AS
 SELECT COALESCE("sd"."acquisition_source", 'autre'::"text") AS "channel",
    COALESCE("sum"("i"."amount"), (0)::numeric) AS "revenue"
   FROM ("public"."invoices" "i"
     LEFT JOIN "public"."student_details" "sd" ON (("sd"."profile_id" = "i"."client_id")))
  WHERE ("i"."status" = 'paid'::"text")
  GROUP BY COALESCE("sd"."acquisition_source", 'autre'::"text")
  ORDER BY COALESCE("sum"("i"."amount"), (0)::numeric) DESC
 LIMIT 6;


ALTER VIEW "public"."revenue_by_channel" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."revenue_by_month" AS
 SELECT "to_char"("paid_at", 'YYYY-MM'::"text") AS "month",
    "to_char"("paid_at", 'Mon'::"text") AS "label",
    "sum"("total") AS "revenue"
   FROM "public"."invoices"
  WHERE (("status" = 'paid'::"text") AND ("paid_at" IS NOT NULL) AND ("paid_at" >= ("date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone) - '5 mons'::interval)))
  GROUP BY ("to_char"("paid_at", 'YYYY-MM'::"text")), ("to_char"("paid_at", 'Mon'::"text"))
  ORDER BY ("to_char"("paid_at", 'YYYY-MM'::"text"));


ALTER VIEW "public"."revenue_by_month" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."revenue_by_quarter" AS
 SELECT ((('T'::"text" || (EXTRACT(quarter FROM "paid_at"))::integer) || ' '::"text") || (EXTRACT(year FROM "paid_at"))::integer) AS "quarter",
    "sum"("total") AS "revenue"
   FROM "public"."invoices"
  WHERE (("status" = 'paid'::"text") AND ("paid_at" IS NOT NULL))
  GROUP BY ((('T'::"text" || (EXTRACT(quarter FROM "paid_at"))::integer) || ' '::"text") || (EXTRACT(year FROM "paid_at"))::integer)
  ORDER BY ("min"("paid_at")) DESC
 LIMIT 4;


ALTER VIEW "public"."revenue_by_quarter" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reward_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "xp_spent" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"(),
    "fulfilled_at" timestamp with time zone,
    "fulfilled_by" "uuid",
    CONSTRAINT "reward_redemptions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'fulfilled'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."reward_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cost_xp" integer NOT NULL,
    "type" "text" NOT NULL,
    "stock" integer,
    "is_active" boolean DEFAULT true,
    "image_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rewards_cost_xp_check" CHECK (("cost_xp" > 0)),
    CONSTRAINT "rewards_type_check" CHECK (("type" = ANY (ARRAY['session_bonus'::"text", 'resource_unlock'::"text", 'badge_exclusive'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rituals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "frequency" "text" DEFAULT 'daily'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    "time_of_day" "text",
    "streak_count" integer DEFAULT 0 NOT NULL,
    "last_completed_at" timestamp with time zone
);


ALTER TABLE "public"."rituals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roadmap_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "validation_criteria" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roadmap_milestones_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."roadmap_milestones" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sales_pipeline_summary" AS
 SELECT COALESCE("stage", 'prospect'::"text") AS "stage",
    ("count"(*))::integer AS "count"
   FROM "public"."crm_contacts"
  GROUP BY COALESCE("stage", 'prospect'::"text");


ALTER VIEW "public"."sales_pipeline_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_shared" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_segments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "session_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "notes" "text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "replay_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['individual'::"text", 'group'::"text", 'emergency'::"text"]))),
    CONSTRAINT "sessions_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."setter_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "messages_sent" integer DEFAULT 0 NOT NULL,
    "leads_generated" integer DEFAULT 0 NOT NULL,
    "calls_booked" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dms_sent" integer DEFAULT 0,
    "followups_sent" integer DEFAULT 0,
    "links_sent" integer DEFAULT 0,
    "client_id" "uuid"
);


ALTER TABLE "public"."setter_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."setter_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setter_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "column_id" "uuid",
    "name" "text",
    "phone" "text",
    "email" "text",
    "instagram_handle" "text",
    "linkedin_handle" "text",
    "objectif" "text",
    "douleur" "text",
    "ca_contracte" numeric DEFAULT 0,
    "ca_collecte" numeric DEFAULT 0,
    "duree_collecte" integer,
    "status" "text" DEFAULT 'en_cours'::"text",
    "date_premier_contact" "date",
    "date_relance" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."setter_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "recipient_phone" "text" NOT NULL,
    "message" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "related_type" "text",
    "related_id" "uuid",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sms_reminders_related_type_check" CHECK (("related_type" = ANY (ARRAY['call'::"text", 'coaching'::"text", 'payment'::"text"]))),
    CONSTRAINT "sms_reminders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sms_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "caption" "text",
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "platform" "text" DEFAULT 'instagram'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_content_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'linkedin'::"text", 'tiktok'::"text"]))),
    CONSTRAINT "social_content_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."social_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'daily_checkin'::"text" NOT NULL,
    "current_count" integer DEFAULT 0 NOT NULL,
    "longest_count" integer DEFAULT 0 NOT NULL,
    "last_activity_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "xp_multiplier" numeric(3,2) DEFAULT 1.00 NOT NULL,
    "total_active_days" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['module_started'::"text", 'module_completed'::"text", 'lesson_completed'::"text", 'form_submitted'::"text", 'message_sent'::"text", 'login'::"text", 'milestone_reached'::"text", 'note_added'::"text", 'call_scheduled'::"text", 'payment_received'::"text"])))
);


ALTER TABLE "public"."student_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_flag_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "old_flag" "text",
    "new_flag" "text" NOT NULL,
    "reason" "text",
    "changed_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_flag_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_notes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."student_stats_summary" AS
 SELECT (( SELECT "count"(*) AS "count"
           FROM "public"."profiles"
          WHERE ("profiles"."role" = 'client'::"public"."user_role")))::integer AS "total_students",
    (( SELECT "count"(*) AS "count"
           FROM "public"."profiles"
          WHERE (("profiles"."role" = 'client'::"public"."user_role") AND ("profiles"."created_at" >= "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))))::integer AS "new_students_this_month",
    (( SELECT "count"(*) AS "count"
           FROM "public"."student_details"
          WHERE ("student_details"."tag" = 'churned'::"text")))::integer AS "churned_students",
    (( SELECT "count"(*) AS "count"
           FROM "public"."student_details"
          WHERE ("student_details"."flag" = ANY (ARRAY['yellow'::"text", 'orange'::"text", 'red'::"text"]))))::integer AS "at_risk_students",
    (( SELECT COALESCE("round"("avg"(("student_details"."lifetime_value")::numeric)), (0)::numeric) AS "coalesce"
           FROM "public"."student_details"
          WHERE (("student_details"."lifetime_value" IS NOT NULL) AND (("student_details"."lifetime_value")::numeric > (0)::numeric))))::integer AS "average_ltv";


ALTER VIEW "public"."student_stats_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "status" "text" DEFAULT 'todo'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "student_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "student_tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in_progress'::"text", 'done'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."student_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'bug'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "page_url" "text",
    "user_agent" "text",
    "screenshot_url" "text",
    "admin_notes" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'question'::"text", 'autre'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "captain_id" "uuid",
    "avatar_url" "text",
    "color" "text" DEFAULT '#3b82f6'::"text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_emoji" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_name" "text",
    "file_url" "text",
    "file_type" "text",
    "file_size" integer,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upsell_opportunities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_value" "text",
    "offer_name" "text" NOT NULL,
    "status" "text" DEFAULT 'detected'::"text",
    "proposed_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "amount" numeric DEFAULT 0,
    "offer_type" "text" DEFAULT 'avancee'::"text",
    "message" "text",
    CONSTRAINT "upsell_opportunities_status_check" CHECK (("status" = ANY (ARRAY['detected'::"text", 'proposed'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."upsell_opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upsell_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "offer_title" "text" NOT NULL,
    "offer_description" "text",
    "offer_url" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "upsell_rules_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['revenue_threshold'::"text", 'milestone_completion'::"text", 'time_based'::"text"])))
);


ALTER TABLE "public"."upsell_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upsell_triggers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notified_at" timestamp with time zone,
    "converted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "upsell_triggers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'notified'::"text", 'converted'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."upsell_triggers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "consent_version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "accepted" boolean DEFAULT true NOT NULL,
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "invite_code" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "specialties" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "user_invites_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text", 'client'::"text"]))),
    CONSTRAINT "user_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."user_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_messages" boolean DEFAULT true,
    "notification_calls" boolean DEFAULT true,
    "notification_formations" boolean DEFAULT true,
    "notification_community" boolean DEFAULT true,
    "notification_coaching" boolean DEFAULT true,
    "notification_system" boolean DEFAULT true,
    "notification_badges" boolean DEFAULT true,
    "notification_challenges" boolean DEFAULT true,
    "notification_digest" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "device_info" "text",
    "ip_address" "text",
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "related_type" "text" NOT NULL,
    "related_id" "uuid",
    "video_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "duration" integer,
    "message" "text",
    "viewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "video_responses_related_type_check" CHECK (("related_type" = ANY (ARRAY['call'::"text", 'coaching_session'::"text", 'question'::"text"])))
);


ALTER TABLE "public"."video_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid" NOT NULL,
    "event" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "response_status" integer,
    "response_body" "text",
    "duration_ms" integer,
    "success" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "secret" "text" NOT NULL,
    "events" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workbook_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workbook_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "call_id" "uuid",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "reviewer_notes" "text",
    "reviewed_by" "uuid",
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workbook_submissions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'reviewed'::"text"])))
);


ALTER TABLE "public"."workbook_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "course_id" "uuid",
    "module_type" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text",
    CONSTRAINT "workbooks_module_type_check" CHECK (("module_type" = ANY (ARRAY['marche'::"text", 'offre'::"text", 'communication'::"text", 'acquisition'::"text", 'conversion'::"text", 'diagnostic'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."workbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xp_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "xp_amount" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."xp_config" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_question_log"
    ADD CONSTRAINT "ai_question_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_reports"
    ADD CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_announcement_id_user_id_key" UNIQUE ("announcement_id", "user_id");



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_pkey" PRIMARY KEY ("id");
