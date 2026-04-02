CREATE INDEX "idx_forms_creator" ON "public"."forms" USING "btree" ("created_by");



CREATE INDEX "idx_forms_status" ON "public"."forms" USING "btree" ("status");



CREATE INDEX "idx_invoices_client_id" ON "public"."invoices" USING "btree" ("client_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_journal_attachments_entry" ON "public"."journal_attachments" USING "btree" ("journal_entry_id");



CREATE INDEX "idx_journal_entries_author_id" ON "public"."journal_entries" USING "btree" ("author_id");



CREATE INDEX "idx_journal_entries_created_at" ON "public"."journal_entries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_kb_entries_category" ON "public"."knowledge_base_entries" USING "btree" ("category");



CREATE INDEX "idx_lesson_actions_lesson" ON "public"."lesson_actions" USING "btree" ("lesson_id");



CREATE INDEX "idx_lesson_progress_student" ON "public"."lesson_progress" USING "btree" ("student_id");



CREATE INDEX "idx_message_bookmarks_user" ON "public"."message_bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_message_reactions_message_id" ON "public"."message_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_messages_channel_created" ON "public"."messages" USING "btree" ("channel_id", "created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_offboarding_status" ON "public"."offboarding_requests" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text"]));



CREATE INDEX "idx_offboarding_user" ON "public"."offboarding_requests" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_checklist_user" ON "public"."onboarding_checklist_items" USING "btree" ("user_id");



CREATE INDEX "idx_onboarding_offers_slug" ON "public"."onboarding_offers" USING "btree" ("slug");



CREATE INDEX "idx_onboarding_steps_profile" ON "public"."onboarding_steps" USING "btree" ("profile_id");



CREATE INDEX "idx_onboarding_user" ON "public"."onboarding_progress" USING "btree" ("user_id");



CREATE INDEX "idx_payment_reminders_invoice_id" ON "public"."payment_reminders" USING "btree" ("invoice_id");



CREATE INDEX "idx_payment_reminders_scheduled_at" ON "public"."payment_reminders" USING "btree" ("scheduled_at");



CREATE INDEX "idx_payment_schedules_client_id" ON "public"."payment_schedules" USING "btree" ("client_id");



CREATE INDEX "idx_pipeline_columns_client" ON "public"."pipeline_columns" USING "btree" ("client_id");



CREATE INDEX "idx_pre_call_answers_call" ON "public"."pre_call_answers" USING "btree" ("call_id");



CREATE INDEX "idx_profiles_archived" ON "public"."profiles" USING "btree" ("is_archived") WHERE ("is_archived" = true);



CREATE INDEX "idx_profiles_specialties" ON "public"."profiles" USING "gin" ("specialties");



CREATE INDEX "idx_quiz_attempts_lesson" ON "public"."quiz_attempts" USING "btree" ("lesson_id");



CREATE INDEX "idx_quiz_attempts_student" ON "public"."quiz_attempts" USING "btree" ("student_id");



CREATE INDEX "idx_relance_enrollments_next" ON "public"."relance_enrollments" USING "btree" ("next_step_at") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_replays_category" ON "public"."replays" USING "btree" ("category");



CREATE INDEX "idx_replays_coach_id" ON "public"."replays" USING "btree" ("coach_id");



CREATE INDEX "idx_resource_folder_access_folder" ON "public"."resource_folder_access" USING "btree" ("folder_id");



CREATE INDEX "idx_resource_folder_access_user" ON "public"."resource_folder_access" USING "btree" ("user_id");



CREATE INDEX "idx_resources_folder_id" ON "public"."resources" USING "btree" ("folder_id");



CREATE INDEX "idx_reward_redemptions_reward_id" ON "public"."reward_redemptions" USING "btree" ("reward_id");



CREATE INDEX "idx_reward_redemptions_user_id" ON "public"."reward_redemptions" USING "btree" ("user_id");



CREATE INDEX "idx_rewards_active" ON "public"."rewards" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_rituals_active" ON "public"."rituals" USING "btree" ("profile_id") WHERE ("is_active" = true);



CREATE INDEX "idx_rituals_profile" ON "public"."rituals" USING "btree" ("profile_id");



CREATE INDEX "idx_roadmap_milestones_roadmap" ON "public"."roadmap_milestones" USING "btree" ("roadmap_id");



CREATE INDEX "idx_sessions_client_id" ON "public"."sessions" USING "btree" ("client_id");



CREATE INDEX "idx_sessions_coach_id" ON "public"."sessions" USING "btree" ("coach_id");



CREATE INDEX "idx_sessions_scheduled_at" ON "public"."sessions" USING "btree" ("scheduled_at");



CREATE INDEX "idx_setter_activities_user" ON "public"."setter_activities" USING "btree" ("user_id");



CREATE INDEX "idx_setter_activities_user_date" ON "public"."setter_activities" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_setter_leads_client" ON "public"."setter_leads" USING "btree" ("client_id");



CREATE INDEX "idx_setter_leads_column" ON "public"."setter_leads" USING "btree" ("column_id");



CREATE INDEX "idx_setter_leads_setter" ON "public"."setter_leads" USING "btree" ("setter_id");



CREATE INDEX "idx_sms_reminders_status_scheduled" ON "public"."sms_reminders" USING "btree" ("status", "scheduled_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_sms_reminders_user_id" ON "public"."sms_reminders" USING "btree" ("user_id");



CREATE INDEX "idx_social_content_created_by" ON "public"."social_content" USING "btree" ("created_by");



CREATE INDEX "idx_social_content_platform" ON "public"."social_content" USING "btree" ("platform");



CREATE INDEX "idx_social_content_status" ON "public"."social_content" USING "btree" ("status");



CREATE INDEX "idx_streaks_profile" ON "public"."streaks" USING "btree" ("profile_id");



CREATE INDEX "idx_streaks_user" ON "public"."streaks" USING "btree" ("user_id");



CREATE INDEX "idx_student_activities_student" ON "public"."student_activities" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "idx_student_details_profile" ON "public"."student_details" USING "btree" ("profile_id");



CREATE INDEX "idx_student_notes_student" ON "public"."student_notes" USING "btree" ("student_id");



CREATE INDEX "idx_student_tasks_student" ON "public"."student_tasks" USING "btree" ("student_id");



CREATE INDEX "idx_submissions_form" ON "public"."form_submissions" USING "btree" ("form_id");



CREATE INDEX "idx_support_tickets_status" ON "public"."support_tickets" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_support_tickets_user" ON "public"."support_tickets" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_team_members_team" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "idx_team_members_user" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "idx_upsell_rules_active" ON "public"."upsell_rules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_upsell_student" ON "public"."upsell_opportunities" USING "btree" ("student_id");



CREATE INDEX "idx_upsell_triggers_client" ON "public"."upsell_triggers" USING "btree" ("client_id");



CREATE INDEX "idx_upsell_triggers_status" ON "public"."upsell_triggers" USING "btree" ("status");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_profile_id" ON "public"."user_badges" USING "btree" ("profile_id");



CREATE INDEX "idx_user_consents_user" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_follows_follower" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE INDEX "idx_user_follows_following" ON "public"."user_follows" USING "btree" ("following_id");



CREATE INDEX "idx_user_invites_code" ON "public"."user_invites" USING "btree" ("invite_code");



CREATE INDEX "idx_user_invites_email" ON "public"."user_invites" USING "btree" ("email");



CREATE INDEX "idx_user_invites_status" ON "public"."user_invites" USING "btree" ("status");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_video_responses_recipient" ON "public"."video_responses" USING "btree" ("recipient_id");



CREATE INDEX "idx_video_responses_sender" ON "public"."video_responses" USING "btree" ("sender_id");



CREATE INDEX "idx_wb_submissions_client" ON "public"."workbook_submissions" USING "btree" ("client_id");



CREATE INDEX "idx_wb_submissions_workbook" ON "public"."workbook_submissions" USING "btree" ("workbook_id");



CREATE INDEX "idx_webhook_logs_created" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_webhook" ON "public"."webhook_logs" USING "btree" ("webhook_id");



CREATE INDEX "idx_webhooks_owner" ON "public"."webhooks" USING "btree" ("owner_id");



CREATE INDEX "idx_weekly_checkins_client_id" ON "public"."weekly_checkins" USING "btree" ("client_id");



CREATE INDEX "idx_weekly_checkins_week_start" ON "public"."weekly_checkins" USING "btree" ("week_start" DESC);



CREATE INDEX "idx_workbooks_course" ON "public"."workbooks" USING "btree" ("course_id") WHERE ("course_id" IS NOT NULL);



CREATE INDEX "idx_workbooks_module_type" ON "public"."workbooks" USING "btree" ("module_type");



CREATE INDEX "idx_xp_transactions_action" ON "public"."xp_transactions" USING "btree" ("action");



CREATE INDEX "idx_xp_transactions_created_at" ON "public"."xp_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_xp_transactions_profile" ON "public"."xp_transactions" USING "btree" ("profile_id", "created_at" DESC);



CREATE INDEX "idx_xp_transactions_profile_id" ON "public"."xp_transactions" USING "btree" ("profile_id");



CREATE OR REPLACE TRIGGER "app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "branding_updated_at" BEFORE UPDATE ON "public"."branding_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_branding_updated_at"();



CREATE OR REPLACE TRIGGER "call_summaries_updated_at" BEFORE UPDATE ON "public"."call_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_call_summaries_updated_at"();



CREATE OR REPLACE TRIGGER "on_certificate_issued" AFTER INSERT ON "public"."certificates" FOR EACH ROW EXECUTE FUNCTION "public"."notify_certificate_issued"();



CREATE OR REPLACE TRIGGER "on_client_provisioning" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."auto_provision_client"();



CREATE OR REPLACE TRIGGER "on_feed_comment_change" AFTER INSERT OR DELETE ON "public"."feed_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comments_count"();



CREATE OR REPLACE TRIGGER "on_feed_like_change" AFTER INSERT OR DELETE ON "public"."feed_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_likes_count"();



CREATE OR REPLACE TRIGGER "on_feed_post_notify" AFTER INSERT ON "public"."feed_posts" FOR EACH ROW EXECUTE FUNCTION "public"."notify_feed_post"();



CREATE OR REPLACE TRIGGER "on_message_notify" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_channel_members_on_message"();



CREATE OR REPLACE TRIGGER "on_profile_role_set" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_student_profile"();



CREATE OR REPLACE TRIGGER "set_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_call_calendar_updated_at" BEFORE UPDATE ON "public"."call_calendar" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_call_notes_updated_at" BEFORE UPDATE ON "public"."call_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_channel_last_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_channel_last_message"();



CREATE OR REPLACE TRIGGER "set_courses_updated_at" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_crm_contacts_updated_at" BEFORE UPDATE ON "public"."crm_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_forms_updated_at" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW WHEN ((("new"."invoice_number" IS NULL) OR ("new"."invoice_number" = ''::"text"))) EXECUTE FUNCTION "public"."generate_invoice_number"();



CREATE OR REPLACE TRIGGER "set_lessons_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_resource_folders_updated_at" BEFORE UPDATE ON "public"."resource_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_student_details_updated_at" BEFORE UPDATE ON "public"."student_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_student_notes_updated_at" BEFORE UPDATE ON "public"."student_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "support_tickets_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_sync_flag_to_client_flags" AFTER UPDATE OF "flag" ON "public"."student_details" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_flag_to_client_flags"();



CREATE OR REPLACE TRIGGER "trg_sync_flag_to_student_details" AFTER INSERT OR UPDATE OF "flag" ON "public"."client_flags" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_flag_to_student_details"();



CREATE OR REPLACE TRIGGER "trg_update_student_ltv" AFTER UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_student_lifetime_value"();



CREATE OR REPLACE TRIGGER "update_checkins_updated_at" BEFORE UPDATE ON "public"."weekly_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_coaching_goals_updated_at" BEFORE UPDATE ON "public"."coaching_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contract_templates_updated_at" BEFORE UPDATE ON "public"."contract_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contracts_updated_at" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_checkins_updated_at" BEFORE UPDATE ON "public"."daily_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_feed_comments_updated_at" BEFORE UPDATE ON "public"."feed_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_feed_posts_updated_at" BEFORE UPDATE ON "public"."feed_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forms_updated_at" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journal_entries_updated_at" BEFORE UPDATE ON "public"."journal_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journal_updated_at" BEFORE UPDATE ON "public"."journal_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_payment_schedules_updated_at" BEFORE UPDATE ON "public"."payment_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_weekly_checkins_updated_at" BEFORE UPDATE ON "public"."weekly_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "webhooks_updated_at" BEFORE UPDATE ON "public"."webhooks" FOR EACH ROW EXECUTE FUNCTION "public"."update_webhooks_updated_at"();



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_question_log"
    ADD CONSTRAINT "ai_question_log_kb_entry_id_fkey" FOREIGN KEY ("kb_entry_id") REFERENCES "public"."knowledge_base_entries"("id");



ALTER TABLE ONLY "public"."ai_question_log"
    ADD CONSTRAINT "ai_question_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_reports"
    ADD CONSTRAINT "ai_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_dismissals"
    ADD CONSTRAINT "announcement_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."availability_slots"
    ADD CONSTRAINT "availability_slots_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."avatars"
    ADD CONSTRAINT "avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."booking_availability"
    ADD CONSTRAINT "booking_availability_booking_page_id_fkey" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_exceptions"
    ADD CONSTRAINT "booking_exceptions_booking_page_id_fkey" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_page_views"
    ADD CONSTRAINT "booking_page_views_booking_page_id_fkey" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_pages"
    ADD CONSTRAINT "booking_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_page_id_fkey" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id");



ALTER TABLE ONLY "public"."branding_pages"
    ADD CONSTRAINT "branding_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."branding_settings"
    ADD CONSTRAINT "branding_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."call_calendar"
    ADD CONSTRAINT "call_calendar_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."call_calendar"
    ADD CONSTRAINT "call_calendar_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."call_documents"
    ADD CONSTRAINT "call_documents_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_documents"
    ADD CONSTRAINT "call_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."call_note_templates"
    ADD CONSTRAINT "call_note_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."call_notes"
    ADD CONSTRAINT "call_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_notes"
    ADD CONSTRAINT "call_notes_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_recordings"
    ADD CONSTRAINT "call_recordings_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_recordings"
    ADD CONSTRAINT "call_recordings_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."call_session_notes"
    ADD CONSTRAINT "call_session_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_session_notes"
    ADD CONSTRAINT "call_session_notes_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_summaries"
    ADD CONSTRAINT "call_summaries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_summaries"
    ADD CONSTRAINT "call_summaries_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_transcripts"
    ADD CONSTRAINT "call_transcripts_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificate_entries"
    ADD CONSTRAINT "certificate_entries_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificate_entries"
    ADD CONSTRAINT "certificate_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."challenge_entries"
    ADD CONSTRAINT "challenge_entries_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_entries"
    ADD CONSTRAINT "challenge_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_badge_reward_fkey" FOREIGN KEY ("badge_reward") REFERENCES "public"."badges"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;
