

ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_submissions"
    ADD CONSTRAINT "quiz_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."relance_enrollments"
    ADD CONSTRAINT "relance_enrollments_contact_id_sequence_id_key" UNIQUE ("contact_id", "sequence_id");



ALTER TABLE ONLY "public"."relance_enrollments"
    ADD CONSTRAINT "relance_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relance_logs"
    ADD CONSTRAINT "relance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relance_sequences"
    ADD CONSTRAINT "relance_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relance_steps"
    ADD CONSTRAINT "relance_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."replays"
    ADD CONSTRAINT "replays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_folder_access"
    ADD CONSTRAINT "resource_folder_access_folder_id_user_id_key" UNIQUE ("folder_id", "user_id");



ALTER TABLE ONLY "public"."resource_folder_access"
    ADD CONSTRAINT "resource_folder_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_folders"
    ADD CONSTRAINT "resource_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reward_redemptions"
    ADD CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rituals"
    ADD CONSTRAINT "rituals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmap_milestones"
    ADD CONSTRAINT "roadmap_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_segments"
    ADD CONSTRAINT "saved_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setter_activities"
    ADD CONSTRAINT "setter_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setter_activities"
    ADD CONSTRAINT "setter_activities_user_client_date_key" UNIQUE ("user_id", "client_id", "date");



ALTER TABLE ONLY "public"."setter_leads"
    ADD CONSTRAINT "setter_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_reminders"
    ADD CONSTRAINT "sms_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_content"
    ADD CONSTRAINT "social_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_type_key" UNIQUE ("user_id", "type");



ALTER TABLE ONLY "public"."student_activities"
    ADD CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_details"
    ADD CONSTRAINT "student_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_details"
    ADD CONSTRAINT "student_details_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."student_flag_history"
    ADD CONSTRAINT "student_flag_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_tasks"
    ADD CONSTRAINT "student_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_summaries"
    ADD CONSTRAINT "unique_call_summary" UNIQUE ("call_id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upsell_opportunities"
    ADD CONSTRAINT "upsell_opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upsell_rules"
    ADD CONSTRAINT "upsell_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upsell_triggers"
    ADD CONSTRAINT "upsell_triggers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_profile_id_badge_id_key" UNIQUE ("profile_id", "badge_id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_consent_type_key" UNIQUE ("user_id", "consent_type");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_responses"
    ADD CONSTRAINT "video_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_checkins"
    ADD CONSTRAINT "weekly_checkins_client_id_week_start_key" UNIQUE ("client_id", "week_start");



ALTER TABLE ONLY "public"."weekly_checkins"
    ADD CONSTRAINT "weekly_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workbook_submissions"
    ADD CONSTRAINT "workbook_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workbooks"
    ADD CONSTRAINT "workbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xp_config"
    ADD CONSTRAINT "xp_config_action_key" UNIQUE ("action");



ALTER TABLE ONLY "public"."xp_config"
    ADD CONSTRAINT "xp_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xp_transactions"
    ADD CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_messages_conversation" ON "public"."ai_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_ai_questions_user" ON "public"."ai_question_log" USING "btree" ("user_id");



CREATE INDEX "idx_ai_reports_unread" ON "public"."ai_reports" USING "btree" ("user_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_ai_reports_user_type" ON "public"."ai_reports" USING "btree" ("user_id", "type", "generated_at" DESC);



CREATE INDEX "idx_announcement_dismissals_user" ON "public"."announcement_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_announcements_active" ON "public"."announcements" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_api_keys_hash" ON "public"."api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_api_keys_owner" ON "public"."api_keys" USING "btree" ("owner_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_availability_overrides_coach_date" ON "public"."availability_overrides" USING "btree" ("coach_id", "override_date");



CREATE INDEX "idx_availability_slots_coach" ON "public"."availability_slots" USING "btree" ("coach_id");



CREATE INDEX "idx_booking_availability_page" ON "public"."booking_availability" USING "btree" ("booking_page_id");



CREATE INDEX "idx_booking_exceptions_page" ON "public"."booking_exceptions" USING "btree" ("booking_page_id");



CREATE INDEX "idx_booking_page_views_created" ON "public"."booking_page_views" USING "btree" ("created_at");



CREATE INDEX "idx_booking_page_views_page" ON "public"."booking_page_views" USING "btree" ("booking_page_id");



CREATE INDEX "idx_booking_pages_slug" ON "public"."booking_pages" USING "btree" ("slug");



CREATE INDEX "idx_bookings_date" ON "public"."bookings" USING "btree" ("date");



CREATE INDEX "idx_bookings_page" ON "public"."bookings" USING "btree" ("booking_page_id");



CREATE INDEX "idx_branding_pages_slug" ON "public"."branding_pages" USING "btree" ("slug");



CREATE UNIQUE INDEX "idx_branding_singleton" ON "public"."branding_settings" USING "btree" ((true));



CREATE INDEX "idx_calendar_events_created_by" ON "public"."calendar_events" USING "btree" ("created_by");



CREATE INDEX "idx_calendar_events_start" ON "public"."calendar_events" USING "btree" ("start_at");



CREATE INDEX "idx_call_calendar_assigned_to" ON "public"."call_calendar" USING "btree" ("assigned_to");



CREATE INDEX "idx_call_calendar_client_id" ON "public"."call_calendar" USING "btree" ("client_id");



CREATE INDEX "idx_call_calendar_date" ON "public"."call_calendar" USING "btree" ("date");



CREATE INDEX "idx_call_notes_author" ON "public"."call_notes" USING "btree" ("author_id");



CREATE INDEX "idx_call_notes_call_id" ON "public"."call_notes" USING "btree" ("call_id");



CREATE INDEX "idx_call_session_notes_call" ON "public"."call_session_notes" USING "btree" ("call_id");



CREATE INDEX "idx_call_summaries_author_id" ON "public"."call_summaries" USING "btree" ("author_id");



CREATE INDEX "idx_call_summaries_call_id" ON "public"."call_summaries" USING "btree" ("call_id");



CREATE INDEX "idx_call_transcripts_call_id" ON "public"."call_transcripts" USING "btree" ("call_id");



CREATE INDEX "idx_certificate_entries_course" ON "public"."certificate_entries" USING "btree" ("course_id");



CREATE INDEX "idx_certificate_entries_student" ON "public"."certificate_entries" USING "btree" ("student_id");



CREATE INDEX "idx_certificates_course" ON "public"."certificates" USING "btree" ("course_id");



CREATE INDEX "idx_certificates_student" ON "public"."certificates" USING "btree" ("student_id");



CREATE INDEX "idx_challenge_participants_challenge_id" ON "public"."challenge_participants" USING "btree" ("challenge_id");



CREATE INDEX "idx_challenge_participants_profile_id" ON "public"."challenge_participants" USING "btree" ("profile_id");



CREATE INDEX "idx_challenges_active" ON "public"."challenges" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_challenges_dates" ON "public"."challenges" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "idx_channel_members_channel_profile" ON "public"."channel_members" USING "btree" ("channel_id", "profile_id");



CREATE INDEX "idx_channel_members_last_read_at" ON "public"."channel_members" USING "btree" ("channel_id", "last_read_at" DESC);



CREATE INDEX "idx_channel_members_profile" ON "public"."channel_members" USING "btree" ("profile_id");



CREATE INDEX "idx_channel_members_profile_id" ON "public"."channel_members" USING "btree" ("profile_id");



CREATE INDEX "idx_channels_archived" ON "public"."channels" USING "btree" ("is_archived") WHERE ("is_archived" = false);



CREATE INDEX "idx_channels_type" ON "public"."channels" USING "btree" ("type");



CREATE INDEX "idx_checkins_client_date" ON "public"."checkins" USING "btree" ("client_id", "date" DESC);



CREATE INDEX "idx_client_ai_memory_client" ON "public"."client_ai_memory" USING "btree" ("client_id");



CREATE INDEX "idx_client_ai_memory_coach" ON "public"."client_ai_memory" USING "btree" ("coach_id");



CREATE INDEX "idx_client_flags_flag" ON "public"."client_flags" USING "btree" ("flag");



CREATE INDEX "idx_client_roadmaps_client" ON "public"."client_roadmaps" USING "btree" ("client_id");



CREATE INDEX "idx_closer_calls_client_id" ON "public"."closer_calls" USING "btree" ("client_id");



CREATE INDEX "idx_coach_ai_chunks_coach" ON "public"."coach_ai_chunks" USING "btree" ("coach_id");



CREATE INDEX "idx_coach_ai_chunks_document" ON "public"."coach_ai_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_coach_ai_chunks_embedding" ON "public"."coach_ai_chunks" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='50');



CREATE INDEX "idx_coach_ai_documents_coach" ON "public"."coach_ai_documents" USING "btree" ("coach_id");



CREATE INDEX "idx_coach_alerts_client_id" ON "public"."coach_alerts" USING "btree" ("client_id");



CREATE INDEX "idx_coach_alerts_coach_id" ON "public"."coach_alerts" USING "btree" ("coach_id");



CREATE INDEX "idx_coach_alerts_is_resolved" ON "public"."coach_alerts" USING "btree" ("is_resolved") WHERE ("is_resolved" = false);



CREATE INDEX "idx_coach_assignments_client_id" ON "public"."coach_assignments" USING "btree" ("client_id");



CREATE INDEX "idx_coach_assignments_coach_id" ON "public"."coach_assignments" USING "btree" ("coach_id");



CREATE INDEX "idx_coach_assignments_status" ON "public"."coach_assignments" USING "btree" ("status");



CREATE INDEX "idx_coaching_goals_client_id" ON "public"."coaching_goals" USING "btree" ("client_id");



CREATE INDEX "idx_coaching_goals_status" ON "public"."coaching_goals" USING "btree" ("status");



CREATE INDEX "idx_coaching_milestones_goal" ON "public"."coaching_milestones" USING "btree" ("goal_id");



CREATE INDEX "idx_coaching_sessions_client" ON "public"."coaching_sessions" USING "btree" ("client_id");



CREATE INDEX "idx_coaching_sessions_coach" ON "public"."coaching_sessions" USING "btree" ("coach_id");



CREATE INDEX "idx_coaching_sessions_scheduled" ON "public"."coaching_sessions" USING "btree" ("scheduled_at");



CREATE INDEX "idx_coaching_sessions_status" ON "public"."coaching_sessions" USING "btree" ("status");



CREATE INDEX "idx_commissions_contractor" ON "public"."commissions" USING "btree" ("contractor_id");



CREATE INDEX "idx_communities_slug" ON "public"."communities" USING "btree" ("slug");



CREATE INDEX "idx_community_members_community" ON "public"."community_members" USING "btree" ("community_id");



CREATE INDEX "idx_community_members_user" ON "public"."community_members" USING "btree" ("user_id");



CREATE INDEX "idx_comp_participants_comp" ON "public"."competition_participants" USING "btree" ("competition_id");



CREATE INDEX "idx_competitions_status" ON "public"."competitions" USING "btree" ("status");



CREATE INDEX "idx_contact_interactions_contact_created" ON "public"."contact_interactions" USING "btree" ("contact_id", "created_at" DESC);



CREATE INDEX "idx_contracts_client_id" ON "public"."contracts" USING "btree" ("client_id");



CREATE INDEX "idx_contracts_status" ON "public"."contracts" USING "btree" ("status");



CREATE INDEX "idx_course_prerequisites_prereq" ON "public"."course_prerequisites" USING "btree" ("prerequisite_course_id");



CREATE INDEX "idx_courses_status" ON "public"."courses" USING "btree" ("status");



CREATE INDEX "idx_crm_contacts_assigned" ON "public"."crm_contacts" USING "btree" ("assigned_to");



CREATE INDEX "idx_crm_contacts_closer_id" ON "public"."crm_contacts" USING "btree" ("closer_id") WHERE ("closer_id" IS NOT NULL);



CREATE INDEX "idx_crm_contacts_closer_stage" ON "public"."crm_contacts" USING "btree" ("closer_stage") WHERE ("closer_stage" IS NOT NULL);



CREATE INDEX "idx_crm_contacts_created_by" ON "public"."crm_contacts" USING "btree" ("created_by");



CREATE INDEX "idx_crm_contacts_enrichment_status" ON "public"."crm_contacts" USING "btree" ("enrichment_status") WHERE ("enrichment_status" IS NOT NULL);



CREATE INDEX "idx_crm_contacts_lead_score" ON "public"."crm_contacts" USING "btree" ("lead_score");



CREATE INDEX "idx_crm_contacts_sort" ON "public"."crm_contacts" USING "btree" ("stage", "sort_order");



CREATE INDEX "idx_crm_contacts_stage" ON "public"."crm_contacts" USING "btree" ("stage");



CREATE INDEX "idx_custom_roles_active" ON "public"."custom_roles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_daily_activity_profile_date" ON "public"."daily_activity" USING "btree" ("profile_id", "activity_date" DESC);



CREATE INDEX "idx_daily_checkins_client_date" ON "public"."daily_checkins" USING "btree" ("client_id", "checkin_date" DESC);



CREATE INDEX "idx_daily_checkins_client_id" ON "public"."daily_checkins" USING "btree" ("client_id");



CREATE INDEX "idx_daily_checkins_date" ON "public"."daily_checkins" USING "btree" ("checkin_date" DESC);



CREATE INDEX "idx_dashboard_layouts_user_id" ON "public"."dashboard_layouts" USING "btree" ("user_id");



CREATE INDEX "idx_enrichment_results_contact" ON "public"."enrichment_results" USING "btree" ("contact_id");



CREATE INDEX "idx_enrichment_results_platform" ON "public"."enrichment_results" USING "btree" ("platform");



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_page" ON "public"."error_logs" USING "btree" ("page");



CREATE INDEX "idx_error_logs_resolved" ON "public"."error_logs" USING "btree" ("resolved");



CREATE INDEX "idx_error_logs_source" ON "public"."error_logs" USING "btree" ("source");



CREATE INDEX "idx_faq_entries_category" ON "public"."faq_entries" USING "btree" ("category");



CREATE INDEX "idx_faq_entries_occurrence" ON "public"."faq_entries" USING "btree" ("occurrence_count" DESC);



CREATE INDEX "idx_feed_comments_parent_id" ON "public"."feed_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_feed_comments_post_id" ON "public"."feed_comments" USING "btree" ("post_id");



CREATE INDEX "idx_feed_likes_post_id" ON "public"."feed_likes" USING "btree" ("post_id");



CREATE INDEX "idx_feed_likes_profile_id" ON "public"."feed_likes" USING "btree" ("profile_id");



CREATE INDEX "idx_feed_posts_author_id" ON "public"."feed_posts" USING "btree" ("author_id");



CREATE INDEX "idx_feed_posts_category" ON "public"."feed_posts" USING "btree" ("category");



CREATE INDEX "idx_feed_posts_created_at" ON "public"."feed_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feed_posts_is_pinned" ON "public"."feed_posts" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_feed_posts_post_type" ON "public"."feed_posts" USING "btree" ("post_type");



CREATE INDEX "idx_feed_reports_reporter" ON "public"."feed_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_feed_reports_status" ON "public"."feed_reports" USING "btree" ("status");



CREATE INDEX "idx_flag_history_student" ON "public"."student_flag_history" USING "btree" ("student_id");



CREATE INDEX "idx_form_submissions_form" ON "public"."form_submissions" USING "btree" ("form_id", "submitted_at" DESC);



CREATE INDEX "idx_form_templates_category" ON "public"."form_templates" USING "btree" ("category");


