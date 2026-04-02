CREATE POLICY "client_own_calls" ON "public"."call_calendar" FOR SELECT USING ((("public"."get_my_role"() = 'client'::"text") AND ("client_id" = "auth"."uid"())));



CREATE POLICY "client_own_columns" ON "public"."pipeline_columns" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "client_own_leads" ON "public"."setter_leads" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "client_own_transcripts" ON "public"."call_transcripts" FOR SELECT USING ((("public"."get_my_role"() = 'client'::"text") AND ("call_id" IN ( SELECT "call_calendar"."id"
   FROM "public"."call_calendar"
  WHERE ("call_calendar"."client_id" = "auth"."uid"())))));



ALTER TABLE "public"."client_roadmaps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_roadmaps_read" ON "public"."client_roadmaps" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "client_select_folders" ON "public"."resource_folders" FOR SELECT USING (((("visibility" = ANY (ARRAY['all'::"text", 'clients'::"text"])) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['client'::"public"."user_role", 'prospect'::"public"."user_role"])))))) OR (EXISTS ( SELECT 1
   FROM "public"."resource_folder_access"
  WHERE (("resource_folder_access"."folder_id" = "resource_folders"."id") AND ("resource_folder_access"."user_id" = "auth"."uid"()))))));



CREATE POLICY "client_select_own_assignment" ON "public"."coach_assignments" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



ALTER TABLE "public"."closer_calls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "closer_calls_all" ON "public"."closer_calls" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "closer_calls_select" ON "public"."closer_calls" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."coach_ai_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_ai_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_ai_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coach_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coach_assign_admin" ON "public"."coach_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "coach_assign_read" ON "public"."coach_assignments" FOR SELECT USING ((("client_id" = "auth"."uid"()) OR ("coach_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



ALTER TABLE "public"."coach_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coach_call_summaries_insert" ON "public"."call_summaries" FOR INSERT WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "coach_call_summaries_select" ON "public"."call_summaries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."call_calendar" "cc"
  WHERE (("cc"."id" = "call_summaries"."call_id") AND (("cc"."assigned_to" = "auth"."uid"()) OR ("cc"."client_id" = "auth"."uid"()))))));



CREATE POLICY "coach_call_summaries_update" ON "public"."call_summaries" FOR UPDATE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "coach_own_calls" ON "public"."call_calendar" USING ((("public"."get_my_role"() = 'coach'::"text") AND ("assigned_to" = "auth"."uid"())));



CREATE POLICY "coach_own_transcripts" ON "public"."call_transcripts" USING ((("public"."get_my_role"() = 'coach'::"text") AND ("call_id" IN ( SELECT "call_calendar"."id"
   FROM "public"."call_calendar"
  WHERE ("call_calendar"."assigned_to" = "auth"."uid"())))));



CREATE POLICY "coach_select_own_assignments" ON "public"."coach_assignments" FOR SELECT TO "authenticated" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "coach_view" ON "public"."setter_leads" FOR SELECT USING (("public"."get_my_role"() = 'coach'::"text"));



CREATE POLICY "coach_view_activities" ON "public"."setter_activities" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



ALTER TABLE "public"."coaching_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coaching_milestones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coaching_milestones_client_read" ON "public"."coaching_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."coaching_goals"
  WHERE (("coaching_goals"."id" = "coaching_milestones"."goal_id") AND ("coaching_goals"."client_id" = "auth"."uid"())))));



CREATE POLICY "coaching_milestones_staff" ON "public"."coaching_milestones" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."coaching_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coaching_sessions_client_read" ON "public"."coaching_sessions" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "coaching_sessions_staff" ON "public"."coaching_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."commission_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "communities_delete" ON "public"."communities" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "communities_insert" ON "public"."communities" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "communities_select" ON "public"."communities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "communities_update" ON "public"."communities" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."community_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_members_delete" ON "public"."community_members" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "community_members_insert" ON "public"."community_members" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "community_members_join" ON "public"."community_members" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."communities"
  WHERE (("communities"."id" = "community_members"."community_id") AND ("communities"."is_private" = false))))));



CREATE POLICY "community_members_leave" ON "public"."community_members" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "community_members_select" ON "public"."community_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "community_members_update" ON "public"."community_members" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "comp_participants_insert" ON "public"."competition_participants" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "comp_participants_select" ON "public"."competition_participants" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."competition_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "competitions_admin_manage" ON "public"."competitions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "competitions_select" ON "public"."competitions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "consents_admin_select" ON "public"."user_consents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "consents_insert_own" ON "public"."user_consents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "consents_select_own" ON "public"."user_consents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "consents_update_own" ON "public"."user_consents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."contact_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_renewal_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contract_renewal_logs_all" ON "public"."contract_renewal_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "contract_renewal_logs_select" ON "public"."contract_renewal_logs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."contract_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_prerequisites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "course_prerequisites_select" ON "public"."course_prerequisites" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_contacts_select" ON "public"."crm_contacts" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."currency_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "currency_rates_select" ON "public"."currency_rates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."custom_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_roles_admin_delete" ON "public"."custom_roles" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) AND ("is_system" = false)));



CREATE POLICY "custom_roles_admin_insert" ON "public"."custom_roles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "custom_roles_admin_update" ON "public"."custom_roles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "custom_roles_select" ON "public"."custom_roles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."daily_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_activity_own" ON "public"."daily_activity" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."daily_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_layouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_layouts_own_delete" ON "public"."dashboard_layouts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dashboard_layouts_own_insert" ON "public"."dashboard_layouts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "dashboard_layouts_own_select" ON "public"."dashboard_layouts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dashboard_layouts_own_update" ON "public"."dashboard_layouts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dismissals_own" ON "public"."announcement_dismissals" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."enrichment_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enrichment_results_staff" ON "public"."enrichment_results" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercise_submissions_all" ON "public"."exercise_submissions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "exercise_submissions_select" ON "public"."exercise_submissions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."faq_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "faq_entries_client_read" ON "public"."faq_entries" FOR SELECT TO "authenticated" USING (("auto_answer_enabled" = true));



CREATE POLICY "faq_entries_staff_all" ON "public"."faq_entries" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."faq_question_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "faq_question_logs_all" ON "public"."faq_question_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "faq_question_logs_select" ON "public"."faq_question_logs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."feed_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_reports_insert" ON "public"."feed_reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "feed_reports_own_select" ON "public"."feed_reports" FOR SELECT TO "authenticated" USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "feed_reports_staff_select" ON "public"."feed_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "feed_reports_staff_update" ON "public"."feed_reports" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."financial_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_entries_all" ON "public"."financial_entries" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "financial_entries_select" ON "public"."financial_entries" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."flag_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_templates_admin_manage" ON "public"."form_templates" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "form_templates_select" ON "public"."form_templates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."forms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "forms_manage" ON "public"."forms" USING ((("auth"."uid"() = "created_by") OR ("public"."get_my_role"() = 'admin'::"text")));



ALTER TABLE "public"."google_calendar_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "google_calendar_tokens_all" ON "public"."google_calendar_tokens" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "google_calendar_tokens_select" ON "public"."google_calendar_tokens" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."hall_of_fame" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hall_of_fame_all" ON "public"."hall_of_fame" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "hall_of_fame_select" ON "public"."hall_of_fame" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."instagram_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "instagram_accounts_all" ON "public"."instagram_accounts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "instagram_accounts_select" ON "public"."instagram_accounts" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."instagram_post_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "instagram_post_stats_all" ON "public"."instagram_post_stats" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "instagram_post_stats_select" ON "public"."instagram_post_stats" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "journal_attachments_own" ON "public"."journal_attachments" USING ((EXISTS ( SELECT 1
   FROM "public"."journal_entries"
  WHERE (("journal_entries"."id" = "journal_attachments"."journal_entry_id") AND ("journal_entries"."author_id" = "auth"."uid"())))));



CREATE POLICY "journal_attachments_staff_read" ON "public"."journal_attachments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_prompts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "journal_prompts_admin" ON "public"."journal_prompts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "journal_prompts_read" ON "public"."journal_prompts" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_active" = true)));



ALTER TABLE "public"."knowledge_base_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kpi_goals_staff" ON "public"."kpi_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."lesson_action_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."level_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "message_templates_delete_auth" ON "public"."message_templates" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "message_templates_insert_auth" ON "public"."message_templates" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "message_templates_select_all" ON "public"."message_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "message_templates_update_auth" ON "public"."message_templates" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete" ON "public"."messages" FOR DELETE USING ((("sender_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND ((EXISTS ( SELECT 1
   FROM "public"."channel_members"
  WHERE (("channel_members"."channel_id" = "messages"."channel_id") AND ("channel_members"."profile_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "messages"."channel_id") AND ("channels"."type" = 'public'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))))));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING (("public"."is_channel_member"("channel_id") OR (EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "messages"."channel_id") AND ("channels"."type" = 'public'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "messages_update_own" ON "public"."messages" FOR UPDATE USING ((("sender_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."miro_boards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."miro_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."miro_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."miro_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notif_prefs_insert" ON "public"."notification_preferences" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "notif_prefs_select" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_prefs_update" ON "public"."notification_preferences" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offboarding_admin_insert" ON "public"."offboarding_requests" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "offboarding_admin_select" ON "public"."offboarding_requests" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "offboarding_admin_update" ON "public"."offboarding_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."offboarding_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "onboarding_offers_admin_manage" ON "public"."onboarding_offers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "onboarding_offers_read" ON "public"."onboarding_offers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "onboarding_own" ON "public"."onboarding_progress" USING ((("auth"."uid"() = "user_id") OR ("public"."get_my_role"() = 'admin'::"text")));



ALTER TABLE "public"."onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "onboarding_steps_own" ON "public"."onboarding_steps" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "onboarding_steps_staff_read" ON "public"."onboarding_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "own_read" ON "public"."quiz_submissions" FOR SELECT USING (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."payment_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_columns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_call_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prereqs_read" ON "public"."course_prerequisites" FOR SELECT USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "public_read_published" ON "public"."quizzes" FOR SELECT USING (("is_published" = true));



CREATE POLICY "push_subs_own" ON "public"."push_subscriptions" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_attempts_own" ON "public"."quiz_attempts" USING (("student_id" = "auth"."uid"())) WITH CHECK (("student_id" = "auth"."uid"()));



CREATE POLICY "quiz_attempts_staff_read" ON "public"."quiz_attempts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."quiz_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "redemptions_own_insert" ON "public"."reward_redemptions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "redemptions_own_select" ON "public"."reward_redemptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "redemptions_staff_all" ON "public"."reward_redemptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "relance_enroll_manage" ON "public"."relance_enrollments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));
