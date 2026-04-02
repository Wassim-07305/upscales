
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_user_password"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_user_password"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_user_password"("password" "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_question_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_question_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_question_log" TO "service_role";



GRANT ALL ON TABLE "public"."ai_reports" TO "anon";
GRANT ALL ON TABLE "public"."ai_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_reports" TO "service_role";



GRANT ALL ON TABLE "public"."announcement_dismissals" TO "anon";
GRANT ALL ON TABLE "public"."announcement_dismissals" TO "authenticated";
GRANT ALL ON TABLE "public"."announcement_dismissals" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."availability_overrides" TO "anon";
GRANT ALL ON TABLE "public"."availability_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."availability_slots" TO "anon";
GRANT ALL ON TABLE "public"."availability_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_slots" TO "service_role";



GRANT ALL ON TABLE "public"."avatars" TO "anon";
GRANT ALL ON TABLE "public"."avatars" TO "authenticated";
GRANT ALL ON TABLE "public"."avatars" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."booking_availability" TO "anon";
GRANT ALL ON TABLE "public"."booking_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_availability" TO "service_role";



GRANT ALL ON TABLE "public"."booking_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."booking_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."booking_page_views" TO "anon";
GRANT ALL ON TABLE "public"."booking_page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_page_views" TO "service_role";



GRANT ALL ON TABLE "public"."booking_pages" TO "anon";
GRANT ALL ON TABLE "public"."booking_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_pages" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."branding" TO "anon";
GRANT ALL ON TABLE "public"."branding" TO "authenticated";
GRANT ALL ON TABLE "public"."branding" TO "service_role";



GRANT ALL ON TABLE "public"."branding_pages" TO "anon";
GRANT ALL ON TABLE "public"."branding_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."branding_pages" TO "service_role";



GRANT ALL ON TABLE "public"."branding_settings" TO "anon";
GRANT ALL ON TABLE "public"."branding_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."branding_settings" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."call_calendar" TO "anon";
GRANT ALL ON TABLE "public"."call_calendar" TO "authenticated";
GRANT ALL ON TABLE "public"."call_calendar" TO "service_role";



GRANT ALL ON TABLE "public"."call_documents" TO "anon";
GRANT ALL ON TABLE "public"."call_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."call_documents" TO "service_role";



GRANT ALL ON TABLE "public"."call_note_templates" TO "anon";
GRANT ALL ON TABLE "public"."call_note_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."call_note_templates" TO "service_role";



GRANT ALL ON TABLE "public"."call_notes" TO "anon";
GRANT ALL ON TABLE "public"."call_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."call_notes" TO "service_role";



GRANT ALL ON TABLE "public"."call_recordings" TO "anon";
GRANT ALL ON TABLE "public"."call_recordings" TO "authenticated";
GRANT ALL ON TABLE "public"."call_recordings" TO "service_role";



GRANT ALL ON TABLE "public"."call_session_notes" TO "anon";
GRANT ALL ON TABLE "public"."call_session_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."call_session_notes" TO "service_role";



GRANT ALL ON TABLE "public"."call_summaries" TO "anon";
GRANT ALL ON TABLE "public"."call_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."call_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."call_transcripts" TO "anon";
GRANT ALL ON TABLE "public"."call_transcripts" TO "authenticated";
GRANT ALL ON TABLE "public"."call_transcripts" TO "service_role";



GRANT ALL ON TABLE "public"."certificate_entries" TO "anon";
GRANT ALL ON TABLE "public"."certificate_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."certificate_entries" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_entries" TO "anon";
GRANT ALL ON TABLE "public"."challenge_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_entries" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_participants" TO "anon";
GRANT ALL ON TABLE "public"."challenge_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_participants" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."channel_members" TO "anon";
GRANT ALL ON TABLE "public"."channel_members" TO "authenticated";
GRANT ALL ON TABLE "public"."channel_members" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."client_ai_memory" TO "anon";
GRANT ALL ON TABLE "public"."client_ai_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."client_ai_memory" TO "service_role";



GRANT ALL ON TABLE "public"."client_assignments" TO "anon";
GRANT ALL ON TABLE "public"."client_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."client_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."client_flag_history" TO "anon";
GRANT ALL ON TABLE "public"."client_flag_history" TO "authenticated";
GRANT ALL ON TABLE "public"."client_flag_history" TO "service_role";



GRANT ALL ON TABLE "public"."client_flags" TO "anon";
GRANT ALL ON TABLE "public"."client_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."client_flags" TO "service_role";



GRANT ALL ON TABLE "public"."client_roadmaps" TO "anon";
GRANT ALL ON TABLE "public"."client_roadmaps" TO "authenticated";
GRANT ALL ON TABLE "public"."client_roadmaps" TO "service_role";



GRANT ALL ON TABLE "public"."crm_contacts" TO "anon";
GRANT ALL ON TABLE "public"."crm_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."closer_calls" TO "anon";
GRANT ALL ON TABLE "public"."closer_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."closer_calls" TO "service_role";



GRANT ALL ON TABLE "public"."coach_ai_chunks" TO "anon";
GRANT ALL ON TABLE "public"."coach_ai_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_ai_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."coach_ai_config" TO "anon";
GRANT ALL ON TABLE "public"."coach_ai_config" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_ai_config" TO "service_role";



GRANT ALL ON TABLE "public"."coach_ai_documents" TO "anon";
GRANT ALL ON TABLE "public"."coach_ai_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_ai_documents" TO "service_role";



GRANT ALL ON TABLE "public"."coach_alerts" TO "anon";
GRANT ALL ON TABLE "public"."coach_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."coach_assignments" TO "anon";
GRANT ALL ON TABLE "public"."coach_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."student_details" TO "anon";
GRANT ALL ON TABLE "public"."student_details" TO "authenticated";
GRANT ALL ON TABLE "public"."student_details" TO "service_role";



GRANT ALL ON TABLE "public"."coach_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."coach_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."coaching_goals" TO "anon";
GRANT ALL ON TABLE "public"."coaching_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."coaching_goals" TO "service_role";



GRANT ALL ON TABLE "public"."coaching_milestones" TO "anon";
GRANT ALL ON TABLE "public"."coaching_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."coaching_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."coaching_sessions" TO "anon";
GRANT ALL ON TABLE "public"."coaching_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."coaching_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."commission_rules" TO "anon";
GRANT ALL ON TABLE "public"."commission_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_rules" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."competition_participants" TO "anon";
GRANT ALL ON TABLE "public"."competition_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."competition_participants" TO "service_role";



GRANT ALL ON TABLE "public"."competitions" TO "anon";
GRANT ALL ON TABLE "public"."competitions" TO "authenticated";
GRANT ALL ON TABLE "public"."competitions" TO "service_role";



GRANT ALL ON TABLE "public"."contact_interactions" TO "anon";
GRANT ALL ON TABLE "public"."contact_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."contract_renewal_logs" TO "anon";
GRANT ALL ON TABLE "public"."contract_renewal_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_renewal_logs" TO "service_role";



GRANT ALL ON TABLE "public"."contract_templates" TO "anon";
GRANT ALL ON TABLE "public"."contract_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_templates" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."course_prerequisites" TO "anon";
GRANT ALL ON TABLE "public"."course_prerequisites" TO "authenticated";
GRANT ALL ON TABLE "public"."course_prerequisites" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."currency_rates" TO "anon";
GRANT ALL ON TABLE "public"."currency_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."currency_rates" TO "service_role";



GRANT ALL ON TABLE "public"."custom_roles" TO "anon";
GRANT ALL ON TABLE "public"."custom_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_roles" TO "service_role";



GRANT ALL ON TABLE "public"."daily_activity" TO "anon";
GRANT ALL ON TABLE "public"."daily_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_activity" TO "service_role";



GRANT ALL ON TABLE "public"."daily_checkins" TO "anon";
GRANT ALL ON TABLE "public"."daily_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_checkins" TO "anon";
GRANT ALL ON TABLE "public"."weekly_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_kpis" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_kpis" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_kpis" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_layouts" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_stats" TO "anon";
GRANT ALL ON TABLE "public"."engagement_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_stats" TO "service_role";



GRANT ALL ON TABLE "public"."enrichment_results" TO "anon";
GRANT ALL ON TABLE "public"."enrichment_results" TO "authenticated";
GRANT ALL ON TABLE "public"."enrichment_results" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_submissions" TO "anon";
GRANT ALL ON TABLE "public"."exercise_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."faq_entries" TO "anon";
GRANT ALL ON TABLE "public"."faq_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."faq_entries" TO "service_role";



GRANT ALL ON TABLE "public"."faq_question_logs" TO "anon";
GRANT ALL ON TABLE "public"."faq_question_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."faq_question_logs" TO "service_role";



GRANT ALL ON TABLE "public"."feed_comments" TO "anon";
GRANT ALL ON TABLE "public"."feed_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_comments" TO "service_role";



GRANT ALL ON TABLE "public"."feed_likes" TO "anon";
GRANT ALL ON TABLE "public"."feed_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_likes" TO "service_role";



GRANT ALL ON TABLE "public"."feed_posts" TO "anon";
GRANT ALL ON TABLE "public"."feed_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_posts" TO "service_role";



GRANT ALL ON TABLE "public"."feed_reports" TO "anon";
GRANT ALL ON TABLE "public"."feed_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_reports" TO "service_role";



GRANT ALL ON TABLE "public"."financial_entries" TO "anon";
GRANT ALL ON TABLE "public"."financial_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_entries" TO "service_role";



GRANT ALL ON TABLE "public"."flag_history" TO "anon";
GRANT ALL ON TABLE "public"."flag_history" TO "authenticated";
GRANT ALL ON TABLE "public"."flag_history" TO "service_role";



GRANT ALL ON TABLE "public"."form_fields" TO "anon";
GRANT ALL ON TABLE "public"."form_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."form_fields" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."formation_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."formation_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."formation_modules" TO "anon";
GRANT ALL ON TABLE "public"."formation_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_modules" TO "service_role";



GRANT ALL ON TABLE "public"."formations" TO "anon";
GRANT ALL ON TABLE "public"."formations" TO "authenticated";
GRANT ALL ON TABLE "public"."formations" TO "service_role";



GRANT ALL ON TABLE "public"."forms" TO "anon";
GRANT ALL ON TABLE "public"."forms" TO "authenticated";
GRANT ALL ON TABLE "public"."forms" TO "service_role";



GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "anon";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."hall_of_fame" TO "anon";
GRANT ALL ON TABLE "public"."hall_of_fame" TO "authenticated";
GRANT ALL ON TABLE "public"."hall_of_fame" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."xp_transactions" TO "anon";
GRANT ALL ON TABLE "public"."xp_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."xp_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."hall_of_fame_enriched" TO "anon";
GRANT ALL ON TABLE "public"."hall_of_fame_enriched" TO "authenticated";
GRANT ALL ON TABLE "public"."hall_of_fame_enriched" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_accounts" TO "anon";
GRANT ALL ON TABLE "public"."instagram_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_post_stats" TO "anon";
GRANT ALL ON TABLE "public"."instagram_post_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_post_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."item_completions" TO "anon";
GRANT ALL ON TABLE "public"."item_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."item_completions" TO "service_role";



GRANT ALL ON TABLE "public"."journal_attachments" TO "anon";
GRANT ALL ON TABLE "public"."journal_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."journal_prompts" TO "anon";
GRANT ALL ON TABLE "public"."journal_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_base_entries" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_base_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_base_entries" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_goals" TO "anon";
GRANT ALL ON TABLE "public"."kpi_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_goals" TO "service_role";
