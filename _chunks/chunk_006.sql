

ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_coach_id_override_date_key" UNIQUE ("coach_id", "override_date");



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability_slots"
    ADD CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avatars"
    ADD CONSTRAINT "avatars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avatars"
    ADD CONSTRAINT "avatars_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_availability"
    ADD CONSTRAINT "booking_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_exceptions"
    ADD CONSTRAINT "booking_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_page_views"
    ADD CONSTRAINT "booking_page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_pages"
    ADD CONSTRAINT "booking_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_pages"
    ADD CONSTRAINT "booking_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding"
    ADD CONSTRAINT "branding_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."branding_pages"
    ADD CONSTRAINT "branding_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding_pages"
    ADD CONSTRAINT "branding_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."branding"
    ADD CONSTRAINT "branding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branding_settings"
    ADD CONSTRAINT "branding_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_calendar"
    ADD CONSTRAINT "call_calendar_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_documents"
    ADD CONSTRAINT "call_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_note_templates"
    ADD CONSTRAINT "call_note_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_notes"
    ADD CONSTRAINT "call_notes_call_id_key" UNIQUE ("call_id");



ALTER TABLE ONLY "public"."call_notes"
    ADD CONSTRAINT "call_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_recordings"
    ADD CONSTRAINT "call_recordings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_session_notes"
    ADD CONSTRAINT "call_session_notes_call_id_author_id_key" UNIQUE ("call_id", "author_id");



ALTER TABLE ONLY "public"."call_session_notes"
    ADD CONSTRAINT "call_session_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_summaries"
    ADD CONSTRAINT "call_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_transcripts"
    ADD CONSTRAINT "call_transcripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificate_entries"
    ADD CONSTRAINT "certificate_entries_certificate_number_key" UNIQUE ("certificate_number");



ALTER TABLE ONLY "public"."certificate_entries"
    ADD CONSTRAINT "certificate_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificate_entries"
    ADD CONSTRAINT "certificate_entries_student_id_course_id_key" UNIQUE ("student_id", "course_id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_entries"
    ADD CONSTRAINT "challenge_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_challenge_id_profile_id_key" UNIQUE ("challenge_id", "profile_id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_channel_id_profile_id_key" UNIQUE ("channel_id", "profile_id");



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_client_id_date_key" UNIQUE ("client_id", "date");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_ai_memory"
    ADD CONSTRAINT "client_ai_memory_client_id_coach_id_key" UNIQUE ("client_id", "coach_id");



ALTER TABLE ONLY "public"."client_ai_memory"
    ADD CONSTRAINT "client_ai_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_assignments"
    ADD CONSTRAINT "client_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_flag_history"
    ADD CONSTRAINT "client_flag_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_flags"
    ADD CONSTRAINT "client_flags_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."client_flags"
    ADD CONSTRAINT "client_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_roadmaps"
    ADD CONSTRAINT "client_roadmaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."closer_calls"
    ADD CONSTRAINT "closer_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_ai_chunks"
    ADD CONSTRAINT "coach_ai_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_ai_config"
    ADD CONSTRAINT "coach_ai_config_coach_id_key" UNIQUE ("coach_id");



ALTER TABLE ONLY "public"."coach_ai_config"
    ADD CONSTRAINT "coach_ai_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_ai_documents"
    ADD CONSTRAINT "coach_ai_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_alerts"
    ADD CONSTRAINT "coach_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_assignments"
    ADD CONSTRAINT "coach_assignments_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."coach_assignments"
    ADD CONSTRAINT "coach_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaching_goals"
    ADD CONSTRAINT "coaching_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaching_milestones"
    ADD CONSTRAINT "coaching_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaching_sessions"
    ADD CONSTRAINT "coaching_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_rules"
    ADD CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_rules"
    ADD CONSTRAINT "commission_rules_setter_id_key" UNIQUE ("setter_id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_user_id_key" UNIQUE ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competition_participants"
    ADD CONSTRAINT "competition_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_interactions"
    ADD CONSTRAINT "contact_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_renewal_logs"
    ADD CONSTRAINT "contract_renewal_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_prerequisites"
    ADD CONSTRAINT "course_prerequisites_course_id_prerequisite_id_key" UNIQUE ("course_id", "prerequisite_id");



ALTER TABLE ONLY "public"."course_prerequisites"
    ADD CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_contacts"
    ADD CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."currency_rates"
    ADD CONSTRAINT "currency_rates_base_target_key" UNIQUE ("base", "target");



ALTER TABLE ONLY "public"."currency_rates"
    ADD CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_activity"
    ADD CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_activity"
    ADD CONSTRAINT "daily_activity_user_id_activity_date_activity_type_key" UNIQUE ("user_id", "activity_date", "activity_type");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_client_id_checkin_date_checkin_type_key" UNIQUE ("client_id", "checkin_date", "checkin_type");



ALTER TABLE ONLY "public"."daily_checkins"
    ADD CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."enrichment_results"
    ADD CONSTRAINT "enrichment_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_submissions"
    ADD CONSTRAINT "exercise_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq_entries"
    ADD CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq_question_logs"
    ADD CONSTRAINT "faq_question_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_comments"
    ADD CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_likes"
    ADD CONSTRAINT "feed_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_likes"
    ADD CONSTRAINT "feed_likes_post_id_profile_id_key" UNIQUE ("post_id", "profile_id");



ALTER TABLE ONLY "public"."feed_posts"
    ADD CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_reports"
    ADD CONSTRAINT "feed_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_fields"
    ADD CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_enrollments"
    ADD CONSTRAINT "formation_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_enrollments"
    ADD CONSTRAINT "formation_enrollments_user_id_formation_id_key" UNIQUE ("user_id", "formation_id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."hall_of_fame"
    ADD CONSTRAINT "hall_of_fame_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_accounts"
    ADD CONSTRAINT "instagram_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_post_stats"
    ADD CONSTRAINT "instagram_post_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_attachments"
    ADD CONSTRAINT "journal_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_prompts"
    ADD CONSTRAINT "journal_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_base_entries"
    ADD CONSTRAINT "knowledge_base_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_goals"
    ADD CONSTRAINT "kpi_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_action_completions"
    ADD CONSTRAINT "lesson_action_completions_action_id_user_id_key" UNIQUE ("action_id", "user_id");



ALTER TABLE ONLY "public"."lesson_action_completions"
    ADD CONSTRAINT "lesson_action_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_actions"
    ADD CONSTRAINT "lesson_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_comments"
    ADD CONSTRAINT "lesson_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_student_id_key" UNIQUE ("lesson_id", "student_id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."level_config"
    ADD CONSTRAINT "level_config_pkey" PRIMARY KEY ("level");



ALTER TABLE ONLY "public"."message_attachments"
    ADD CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_bookmarks"
    ADD CONSTRAINT "message_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_bookmarks"
    ADD CONSTRAINT "message_bookmarks_user_id_message_id_key" UNIQUE ("user_id", "message_id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_profile_id_emoji_key" UNIQUE ("message_id", "profile_id", "emoji");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."miro_boards"
    ADD CONSTRAINT "miro_boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."miro_cards"
    ADD CONSTRAINT "miro_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."miro_connections"
    ADD CONSTRAINT "miro_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."miro_sections"
    ADD CONSTRAINT "miro_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offboarding_requests"
    ADD CONSTRAINT "offboarding_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_checklist_items"
    ADD CONSTRAINT "onboarding_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_checklist_items"
    ADD CONSTRAINT "onboarding_checklist_items_user_id_key_key" UNIQUE ("user_id", "key");



ALTER TABLE ONLY "public"."onboarding_offers"
    ADD CONSTRAINT "onboarding_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_offers"
    ADD CONSTRAINT "onboarding_offers_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_user_id_step_key" UNIQUE ("user_id", "step");



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_steps"
    ADD CONSTRAINT "onboarding_steps_profile_id_step_key_key" UNIQUE ("profile_id", "step_key");



ALTER TABLE ONLY "public"."payment_reminders"
    ADD CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_columns"
    ADD CONSTRAINT "pipeline_columns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_call_answers"
    ADD CONSTRAINT "pre_call_answers_call_id_user_id_key" UNIQUE ("call_id", "user_id");



ALTER TABLE ONLY "public"."pre_call_answers"
    ADD CONSTRAINT "pre_call_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");
