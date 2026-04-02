

CREATE POLICY "Staff can manage badges" ON "public"."badges" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage challenges" ON "public"."challenges" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage contract templates" ON "public"."contract_templates" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage flag history" ON "public"."student_flag_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can manage lesson actions" ON "public"."lesson_actions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can manage level_config" ON "public"."level_config" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage notes" ON "public"."student_notes" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text"])));



CREATE POLICY "Staff can manage participants" ON "public"."challenge_participants" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage payment reminders" ON "public"."payment_reminders" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage tasks" ON "public"."student_tasks" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text"])));



CREATE POLICY "Staff can manage upsells" ON "public"."upsell_opportunities" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can manage xp_config" ON "public"."xp_config" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can view all activities" ON "public"."student_activities" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text"])));



CREATE POLICY "Staff can view all call notes" ON "public"."call_notes" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can view all client_details" ON "public"."student_details" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text"])));



CREATE POLICY "Staff can view all participants" ON "public"."challenge_participants" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can view all progress" ON "public"."lesson_progress" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text", 'setter'::"text", 'closer'::"text"])));



CREATE POLICY "Staff can view all questions" ON "public"."ai_question_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can view all user_badges" ON "public"."user_badges" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can view all xp" ON "public"."xp_transactions" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can view non-private journal entries" ON "public"."journal_entries" FOR SELECT USING ((("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])) AND ("is_private" = false)));



CREATE POLICY "Staff view all activity" ON "public"."daily_activity" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff view all rituals" ON "public"."rituals" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff view all streaks" ON "public"."streaks" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Students can manage own progress" ON "public"."lesson_progress" USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Students can submit forms" ON "public"."form_submissions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Students can update own tasks" ON "public"."student_tasks" FOR UPDATE USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Students can view own activities" ON "public"."student_activities" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Students can view own details" ON "public"."student_details" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Students can view own submissions" ON "public"."form_submissions" FOR SELECT USING (("respondent_id" = "auth"."uid"()));



CREATE POLICY "Students can view own tasks" ON "public"."student_tasks" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "System can insert user_badges" ON "public"."user_badges" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert xp" ON "public"."xp_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage activity" ON "public"."daily_activity" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage streaks" ON "public"."streaks" USING (true) WITH CHECK (true);



CREATE POLICY "Users can add messages to own conversations" ON "public"."ai_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations"
  WHERE (("ai_conversations"."id" = "ai_messages"."conversation_id") AND ("ai_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own segments" ON "public"."saved_segments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own comments" ON "public"."lesson_comments" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own segments" ON "public"."saved_segments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert self notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can join challenges" ON "public"."challenge_participants" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can join public channels" ON "public"."channel_members" FOR INSERT WITH CHECK ((("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "channel_members"."channel_id") AND ("channels"."type" = 'public'::"text"))))));



CREATE POLICY "Users can like posts" ON "public"."feed_likes" FOR INSERT WITH CHECK ((("auth"."uid"() = "profile_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "Users can manage own conversations" ON "public"."ai_conversations" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own questions" ON "public"."ai_question_log" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own pre-call answers" ON "public"."pre_call_answers" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove own reactions" ON "public"."message_reactions" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can unlike posts" ON "public"."feed_likes" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update own messages" ON "public"."messages" FOR UPDATE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."challenge_participants" FOR UPDATE USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update own segments" ON "public"."saved_segments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view messages in own conversations" ON "public"."ai_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations"
  WHERE (("ai_conversations"."id" = "ai_messages"."conversation_id") AND ("ai_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own and shared segments" ON "public"."saved_segments" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_shared" = true)));



CREATE POLICY "Users can view own badges" ON "public"."user_badges" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can view own participation" ON "public"."challenge_participants" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own tickets" ON "public"."support_tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own xp" ON "public"."xp_transactions" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users manage own action completions" ON "public"."lesson_action_completions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own bookmarks" ON "public"."message_bookmarks" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own reactions" ON "public"."message_reactions" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users manage own rituals" ON "public"."rituals" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users view own activity" ON "public"."daily_activity" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users view own badges" ON "public"."user_badges" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users view own streak" ON "public"."streaks" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "admin_all" ON "public"."commission_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_all" ON "public"."miro_boards" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."miro_cards" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."miro_connections" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."miro_sections" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."pipeline_columns" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."quizzes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_all" ON "public"."setter_activities" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all" ON "public"."setter_leads" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all_calls" ON "public"."call_calendar" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all_transcripts" ON "public"."call_transcripts" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_call_summaries_all" ON "public"."call_summaries" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_delete_error_logs" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_full_access_coach_assignments" ON "public"."coach_assignments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_full_access_folders" ON "public"."resource_folders" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_manage_folder_access" ON "public"."resource_folder_access" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_read" ON "public"."quiz_submissions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_read_error_logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admin_update_error_logs" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_question_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_reports_own" ON "public"."ai_reports" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."announcement_dismissals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements_admin_manage" ON "public"."announcements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "announcements_select" ON "public"."announcements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "anon_insert_error_logs" ON "public"."error_logs" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anyone_insert" ON "public"."quiz_submissions" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_keys_admin_all" ON "public"."api_keys" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "api_keys_owner_select" ON "public"."api_keys" FOR SELECT USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_admin_read" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "audit_logs_insert_auth" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_error_logs" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "avail_overrides_manage" ON "public"."availability_overrides" USING ((("coach_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "avail_overrides_select" ON "public"."availability_overrides" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "avail_slots_manage" ON "public"."availability_slots" USING ((("coach_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "avail_slots_select" ON "public"."availability_slots" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."availability_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."availability_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."avatars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "badges_admin" ON "public"."badges" USING (("public"."get_my_role"() = 'admin'::"text"));



ALTER TABLE "public"."booking_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_exceptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branding_pages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "branding_pages_admin" ON "public"."branding_pages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "branding_pages_select" ON "public"."branding_pages" FOR SELECT USING ((("is_published" = true) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "branding_select_all" ON "public"."branding_settings" FOR SELECT USING (true);



ALTER TABLE "public"."branding_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "branding_update_admin" ON "public"."branding_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calendar_events_delete" ON "public"."calendar_events" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "calendar_events_insert" ON "public"."calendar_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "calendar_events_select" ON "public"."calendar_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "calendar_events_update" ON "public"."calendar_events" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



ALTER TABLE "public"."call_calendar" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_documents_all" ON "public"."call_documents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "call_documents_select" ON "public"."call_documents" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."call_note_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_note_templates_all" ON "public"."call_note_templates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "call_note_templates_select" ON "public"."call_note_templates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."call_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_recordings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_recordings_all" ON "public"."call_recordings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "call_recordings_select" ON "public"."call_recordings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."call_session_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_transcripts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cert_entries_insert" ON "public"."certificate_entries" FOR INSERT WITH CHECK ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "cert_entries_select" ON "public"."certificate_entries" FOR SELECT USING ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."certificate_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "certificates_all" ON "public"."certificates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "certificates_insert" ON "public"."certificates" FOR INSERT WITH CHECK ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "certificates_select" ON "public"."certificates" FOR SELECT USING ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."challenge_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "challenge_entries_all" ON "public"."challenge_entries" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "challenge_entries_select" ON "public"."challenge_entries" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."challenge_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channel_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "channel_members_delete" ON "public"."channel_members" FOR DELETE USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "channel_members"."channel_id") AND ("channels"."created_by" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "channel_members_insert" ON "public"."channel_members" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "channel_members"."channel_id") AND ("channels"."created_by" = "auth"."uid"())))) OR (("profile_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."channels"
  WHERE (("channels"."id" = "channel_members"."channel_id") AND ("channels"."type" = 'public'::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "channel_members_select" ON "public"."channel_members" FOR SELECT USING (("public"."is_channel_member"("channel_id") OR ("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "channel_members_update" ON "public"."channel_members" FOR UPDATE USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "channels_delete" ON "public"."channels" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "channels_insert" ON "public"."channels" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "channels_select" ON "public"."channels" FOR SELECT USING ((("type" = 'public'::"text") OR "public"."is_channel_member"("id") OR ("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



CREATE POLICY "channels_update" ON "public"."channels" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"])))))));



ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checkins_own" ON "public"."checkins" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "checkins_staff" ON "public"."checkins" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "checklist_items_own" ON "public"."onboarding_checklist_items" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "checklist_items_staff_read" ON "public"."onboarding_checklist_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



ALTER TABLE "public"."client_ai_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_assignments_all" ON "public"."client_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "client_assignments_select" ON "public"."client_assignments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "client_can_book_calls" ON "public"."call_calendar" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'client'::"text") AND ("client_id" = "auth"."uid"()) AND ("call_type" = 'booking'::"text")));



ALTER TABLE "public"."client_flag_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_flag_history_all" ON "public"."client_flag_history" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "client_flag_history_select" ON "public"."client_flag_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."client_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_flags_read" ON "public"."client_flags" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "client_milestones_read" ON "public"."roadmap_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."client_roadmaps"
  WHERE (("client_roadmaps"."id" = "roadmap_milestones"."roadmap_id") AND ("client_roadmaps"."client_id" = "auth"."uid"())))));



CREATE POLICY "client_own_activities" ON "public"."setter_activities" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));


