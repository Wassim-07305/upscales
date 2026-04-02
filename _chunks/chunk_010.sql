

ALTER TABLE ONLY "public"."rituals"
    ADD CONSTRAINT "rituals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."roadmap_milestones"
    ADD CONSTRAINT "roadmap_milestones_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."roadmap_milestones"
    ADD CONSTRAINT "roadmap_milestones_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "public"."client_roadmaps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_segments"
    ADD CONSTRAINT "saved_segments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."saved_segments"
    ADD CONSTRAINT "saved_segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."setter_activities"
    ADD CONSTRAINT "setter_activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."setter_activities"
    ADD CONSTRAINT "setter_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."setter_leads"
    ADD CONSTRAINT "setter_leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."setter_leads"
    ADD CONSTRAINT "setter_leads_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "public"."pipeline_columns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."setter_leads"
    ADD CONSTRAINT "setter_leads_setter_id_fkey" FOREIGN KEY ("setter_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."sms_reminders"
    ADD CONSTRAINT "sms_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_content"
    ADD CONSTRAINT "social_content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."streaks"
    ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_activities"
    ADD CONSTRAINT "student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_details"
    ADD CONSTRAINT "student_details_assigned_coach_fkey" FOREIGN KEY ("assigned_coach") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_details"
    ADD CONSTRAINT "student_details_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_flag_history"
    ADD CONSTRAINT "student_flag_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_flag_history"
    ADD CONSTRAINT "student_flag_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tasks"
    ADD CONSTRAINT "student_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."student_tasks"
    ADD CONSTRAINT "student_tasks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."uploads"
    ADD CONSTRAINT "uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."upsell_opportunities"
    ADD CONSTRAINT "upsell_opportunities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upsell_rules"
    ADD CONSTRAINT "upsell_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."upsell_triggers"
    ADD CONSTRAINT "upsell_triggers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upsell_triggers"
    ADD CONSTRAINT "upsell_triggers_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."upsell_rules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_responses"
    ADD CONSTRAINT "video_responses_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_responses"
    ADD CONSTRAINT "video_responses_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_checkins"
    ADD CONSTRAINT "weekly_checkins_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workbook_submissions"
    ADD CONSTRAINT "workbook_submissions_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."call_calendar"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workbook_submissions"
    ADD CONSTRAINT "workbook_submissions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workbook_submissions"
    ADD CONSTRAINT "workbook_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workbook_submissions"
    ADD CONSTRAINT "workbook_submissions_workbook_id_fkey" FOREIGN KEY ("workbook_id") REFERENCES "public"."workbooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workbooks"
    ADD CONSTRAINT "workbooks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workbooks"
    ADD CONSTRAINT "workbooks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."xp_transactions"
    ADD CONSTRAINT "xp_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Active forms visible to targets" ON "public"."forms" FOR SELECT USING ((("status" = 'active'::"text") OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))));



CREATE POLICY "Admin can update any profile" ON "public"."profiles" FOR UPDATE USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin full access documents" ON "public"."coach_ai_documents" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admin manage availability" ON "public"."booking_availability" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin manage bookings" ON "public"."bookings" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin manage exceptions" ON "public"."booking_exceptions" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin manage pages" ON "public"."booking_pages" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin manages all contacts" ON "public"."crm_contacts" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin manages all interactions" ON "public"."contact_interactions" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin sees all memories" ON "public"."client_ai_memory" FOR SELECT USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admin/Coach can delete messages" ON "public"."messages" FOR DELETE USING ((("sender_id" = "auth"."uid"()) OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))));



CREATE POLICY "Admin/Coach can manage channel members" ON "public"."channel_members" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage channels" ON "public"."channels" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage courses" ON "public"."courses" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage fields" ON "public"."form_fields" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage forms" ON "public"."forms" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage insights" ON "public"."ai_insights" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage lessons" ON "public"."lessons" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage modules" ON "public"."modules" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can manage student_details" ON "public"."student_details" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can view all messages" ON "public"."messages" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can view all submissions" ON "public"."form_submissions" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admin/Coach can view insights" ON "public"."ai_insights" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admins and coaches can insert notifications for anyone" ON "public"."notifications" FOR INSERT WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Admins can manage app_settings" ON "public"."app_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage invites" ON "public"."user_invites" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins can view all session notes" ON "public"."call_session_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins manage commissions" ON "public"."commissions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "All authenticated can view active templates" ON "public"."contract_templates" FOR SELECT USING ((("is_active" = true) AND ("auth"."uid"() IS NOT NULL)));



CREATE POLICY "All can read badges" ON "public"."badges" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "All can read challenges" ON "public"."challenges" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "All can read level_config" ON "public"."level_config" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "All can read xp_config" ON "public"."xp_config" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Anyone can read AI config" ON "public"."coach_ai_config" FOR SELECT USING (true);



CREATE POLICY "Anyone can view badges" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Anyone can view lesson actions" ON "public"."lesson_actions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view rewards" ON "public"."rewards" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Auth read bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Auth read views" ON "public"."booking_page_views" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can add comments" ON "public"."lesson_comments" FOR INSERT WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authenticated can insert activities" ON "public"."student_activities" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can read student_details" ON "public"."student_details" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can view all profiles" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated can view comments" ON "public"."lesson_comments" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can create comments" ON "public"."feed_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."feed_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can view all posts" ON "public"."feed_posts" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view comments" ON "public"."feed_comments" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view likes" ON "public"."feed_likes" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Author manages own call notes" ON "public"."call_notes" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can delete own comments" ON "public"."feed_comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can delete own posts" ON "public"."feed_posts" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can manage own journal entries" ON "public"."journal_entries" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can manage their own session notes" ON "public"."call_session_notes" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can update own comments" ON "public"."feed_comments" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can update own posts" ON "public"."feed_posts" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Client sees own memory" ON "public"."client_ai_memory" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can create own checkins" ON "public"."weekly_checkins" FOR INSERT WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can create own daily checkins" ON "public"."daily_checkins" FOR INSERT WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can read KB" ON "public"."knowledge_base_entries" FOR SELECT USING (true);



CREATE POLICY "Clients can update own checkins" ON "public"."weekly_checkins" FOR UPDATE USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can update own contracts for signing" ON "public"."contracts" FOR UPDATE USING ((("client_id" = "auth"."uid"()) AND ("status" = 'sent'::"text"))) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can update own daily checkins" ON "public"."daily_checkins" FOR UPDATE USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can update own goals" ON "public"."coaching_goals" FOR UPDATE USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own checkins" ON "public"."weekly_checkins" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own contracts" ON "public"."contracts" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own daily checkins" ON "public"."daily_checkins" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own goals" ON "public"."coaching_goals" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own invoices" ON "public"."invoices" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own payment schedules" ON "public"."payment_schedules" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Clients can view own sessions" ON "public"."sessions" FOR SELECT USING (("client_id" = "auth"."uid"()));



CREATE POLICY "Closer manages assigned contacts" ON "public"."crm_contacts" USING ((("public"."get_my_role"() = 'closer'::"text") AND ("closer_id" = "auth"."uid"()))) WITH CHECK ((("public"."get_my_role"() = 'closer'::"text") AND ("closer_id" = "auth"."uid"())));



CREATE POLICY "Coach deletes own documents" ON "public"."coach_ai_documents" FOR DELETE USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach inserts own documents" ON "public"."coach_ai_documents" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach manages all contacts" ON "public"."crm_contacts" USING (("public"."get_my_role"() = 'coach'::"text")) WITH CHECK (("public"."get_my_role"() = 'coach'::"text"));



CREATE POLICY "Coach manages all interactions" ON "public"."contact_interactions" USING (("public"."get_my_role"() = 'coach'::"text")) WITH CHECK (("public"."get_my_role"() = 'coach'::"text"));



CREATE POLICY "Coach manages own AI config" ON "public"."coach_ai_config" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach manages own AI documents" ON "public"."coach_ai_documents" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach sees client memories" ON "public"."client_ai_memory" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach sees own chunks" ON "public"."coach_ai_chunks" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach sees own documents" ON "public"."coach_ai_documents" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coach updates own documents" ON "public"."coach_ai_documents" FOR UPDATE USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "Coaches and admins can view pre-call answers" ON "public"."pre_call_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Contractors view own commissions" ON "public"."commissions" FOR SELECT USING (("auth"."uid"() = "contractor_id"));



CREATE POLICY "Fields visible with form" ON "public"."form_fields" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."forms" "f"
  WHERE (("f"."id" = "form_fields"."form_id") AND (("f"."status" = 'active'::"text") OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])))))));



CREATE POLICY "Insert chunks" ON "public"."coach_ai_chunks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Lessons visible with module" ON "public"."lessons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."courses" "c" ON (("c"."id" = "m"."course_id")))
  WHERE (("m"."id" = "lessons"."module_id") AND (("c"."status" = 'published'::"text") OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])))))));



CREATE POLICY "Members can add attachments" ON "public"."message_attachments" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Members can react" ON "public"."message_reactions" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Members can view attachments" ON "public"."message_attachments" FOR SELECT USING ("public"."is_channel_member"(( SELECT "messages"."channel_id"
   FROM "public"."messages"
  WHERE ("messages"."id" = "message_attachments"."message_id"))));



CREATE POLICY "Members can view reactions" ON "public"."message_reactions" FOR SELECT USING ("public"."is_channel_member"(( SELECT "messages"."channel_id"
   FROM "public"."messages"
  WHERE ("messages"."id" = "message_reactions"."message_id"))));



CREATE POLICY "Modules visible with course" ON "public"."modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "modules"."course_id") AND (("c"."status" = 'published'::"text") OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])))))));



CREATE POLICY "Prospects can sign own contracts" ON "public"."contracts" FOR UPDATE USING ((("client_id" = "auth"."uid"()) AND ("public"."get_my_role"() = 'prospect'::"text") AND ("status" = 'sent'::"text"))) WITH CHECK ((("client_id" = "auth"."uid"()) AND ("public"."get_my_role"() = 'prospect'::"text")));



CREATE POLICY "Prospects can view own contracts" ON "public"."contracts" FOR SELECT USING ((("client_id" = "auth"."uid"()) AND ("public"."get_my_role"() = 'prospect'::"text")));



CREATE POLICY "Prospects can view resources" ON "public"."resources" FOR SELECT USING ((("visibility" = 'all'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'prospect'::"public"."user_role"))))));



CREATE POLICY "Public insert bookings" ON "public"."bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert views" ON "public"."booking_page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read active pages" ON "public"."booking_pages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read availability" ON "public"."booking_availability" FOR SELECT USING (true);



CREATE POLICY "Public read exceptions" ON "public"."booking_exceptions" FOR SELECT USING (true);



CREATE POLICY "Published courses visible to all" ON "public"."courses" FOR SELECT USING ((("status" = 'published'::"text") OR ("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))));



CREATE POLICY "Sales can insert commissions" ON "public"."commissions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['setter'::"public"."user_role", 'closer'::"public"."user_role", 'coach'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Sales can view and manage own contacts" ON "public"."crm_contacts" USING ((("public"."get_my_role"() = ANY (ARRAY['setter'::"text", 'closer'::"text"])) AND (("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['setter'::"text", 'closer'::"text"])));



CREATE POLICY "Sales manages own interactions" ON "public"."contact_interactions" USING (("public"."get_my_role"() = ANY (ARRAY['setter'::"text", 'closer'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['setter'::"text", 'closer'::"text"])));



CREATE POLICY "Senders can manage attachments" ON "public"."message_attachments" USING ((EXISTS ( SELECT 1
   FROM "public"."messages"
  WHERE (("messages"."id" = "message_attachments"."message_id") AND ("messages"."sender_id" = "auth"."uid"())))));



CREATE POLICY "Staff can create channels" ON "public"."channels" FOR INSERT WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can delete prerequisites" ON "public"."course_prerequisites" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can insert prerequisites" ON "public"."course_prerequisites" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can manage KB" ON "public"."knowledge_base_entries" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'coach'::"public"."user_role"]))))));



CREATE POLICY "Staff can manage all alerts" ON "public"."coach_alerts" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all call notes" ON "public"."call_notes" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all checkins" ON "public"."weekly_checkins" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all comments" ON "public"."feed_comments" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all contracts" ON "public"."contracts" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all daily checkins" ON "public"."daily_checkins" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all goals" ON "public"."coaching_goals" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all invoices" ON "public"."invoices" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all payment schedules" ON "public"."payment_schedules" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all posts" ON "public"."feed_posts" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));



CREATE POLICY "Staff can manage all sessions" ON "public"."sessions" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'coach'::"text"])));
