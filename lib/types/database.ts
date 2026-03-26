export type UserRole = "admin" | "moderator" | "member" | "prospect";
export type FormationStatus = "draft" | "published" | "archived";
export type ModuleType = "video_upload" | "video_embed" | "text" | "quiz" | "exercise";
export type ChannelType = "public" | "private" | "dm";
export type NotificationType = "message" | "post" | "formation" | "session" | "certificate" | "system";
export type SessionStatus = "scheduled" | "completed" | "cancelled";
export type PostType = "text" | "image" | "video" | "announcement";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type NotificationPreferences = Record<NotificationType, boolean>;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  is_online: boolean;
  onboarding_completed: boolean;
  notification_preferences: NotificationPreferences;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  created_at: string;
}

export interface Formation {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: FormationStatus;
  is_free: boolean;
  price: number | null;
  order: number;
  difficulty: DifficultyLevel;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  formation_id: string;
  title: string;
  description: string | null;
  type: ModuleType;
  video_url: string | null;
  content: string | null;
  duration_minutes: number;
  order: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  passing_score: number;
  time_limit_minutes?: number | null;
  created_at: string;
}

export type QuestionType = "multiple_choice" | "true_false" | "free_response";

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: QuestionType;
  explanation: string | null;
  order: number;
  created_at: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
  image_url?: string | null;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string> | null;
  completed_at: string;
}

export interface FormationEnrollment {
  id: string;
  user_id: string;
  formation_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  formation_id: string;
  completed: boolean;
  completed_at: string | null;
  last_position_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  formation_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  type: PostType;
  title: string | null;
  content: string;
  media_url: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  icon: string | null;
  created_by: string | null;
  is_archived: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
}

// ─── CRM Types ──────────────────────────────────────────

export type ClientStatus = "actif" | "inactif" | "archivé" | "en_attente";
export type ClientScopeStatus = "contacté" | "qualifié" | "proposé" | "closé" | "perdu";
export type LeadStatus = "à_relancer" | "booké" | "no_show" | "pas_intéressé" | "en_cours" | "données_saisies";
export type AssignmentRole = "coach" | "setter" | "closer" | "monteur" | "cm" | "manager";
export type CallType = "manuel" | "iclosed" | "calendly" | "booking" | "autre";
export type CallStatus = "planifié" | "réalisé" | "annulé" | "no_show" | "reporté";
export type CloserCallStatus = "closé" | "non_closé" | "non_categorise" | "perdu" | "annule" | "no_show" | "paiement_echoue" | "paiement_reussi" | "follow_up" | "r2";
export type FinancialEntryType = "ca" | "récurrent" | "charge" | "prestataire";
export type FinancialSubType = "new_cash" | "mensualite" | "contracte" | "collecte";
export type FinancialRecurrence = "mensuel" | "trimestriel" | "annuel";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  niche: string | null;
  notes: string | null;
  business_manager: string | null;
  status: ClientStatus;
  is_internal: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientAssignment {
  id: string;
  client_id: string;
  user_id: string;
  role: AssignmentRole;
  coach_fee: number | null;
  assigned_at: string;
  profile?: Profile;
}

export interface Lead {
  id: string;
  client_id: string | null;
  assigned_to: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  instagram_url: string | null;
  source: string | null;
  status: LeadStatus;
  client_status: ClientScopeStatus;
  ca_contracte: number;
  ca_collecte: number;
  duree_collecte: number | null;
  commission_setter: number;
  commission_closer: number;
  nombre_paiements: number;
  call_time: string | null;
  estimated_value: number;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  date_relance: string | null;
  column_id: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string } | null;
  assigned_profile?: Profile | null;
}

export interface CallCalendarEntry {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  date: string;
  time: string | null;
  type: CallType;
  status: CallStatus;
  link: string | null;
  notes: string | null;
  created_at: string;
  client?: { id: string; name: string } | null;
  lead?: { full_name: string } | null;
  assignee?: Profile | null;
}

export interface CloserCall {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  closer_id: string | null;
  date: string;
  status: CloserCallStatus;
  revenue: number;
  nombre_paiements: number;
  link: string | null;
  debrief: string | null;
  notes: string | null;
  objection: string | null;
  follow_up_date: string | null;
  prospect_name: string | null;
  created_at: string;
  client?: { id: string; name: string } | null;
  lead?: { full_name: string } | null;
  closer?: Profile | null;
}

export interface FinancialEntry {
  id: string;
  client_id: string | null;
  type: FinancialEntryType;
  sub_type: FinancialSubType | null;
  label: string | null;
  amount: number;
  prestataire: string | null;
  is_paid: boolean;
  date: string;
  recurrence: FinancialRecurrence | null;
  created_at: string;
  client?: { id: string; name: string } | null;
}

export interface PaymentSchedule {
  id: string;
  financial_entry_id: string | null;
  lead_id: string | null;
  client_id: string | null;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  client?: { id: string; name: string } | null;
}

export interface PipelineColumn {
  id: string;
  client_id: string;
  name: string;
  color: string;
  position: number;
  is_terminal: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  is_edited: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  max_participants: number | null;
  status: SessionStatus;
  color: string;
  created_at: string;
  updated_at: string;
  host?: Profile;
  participants_count?: number;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
}

export interface CrmNote {
  id: string;
  student_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface UserTag {
  id: string;
  user_id: string;
  tag_id: string;
  assigned_at: string;
  tag?: Tag;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

// ============================================
// Booking System
// ============================================
export type BookingStatus = "confirme" | "annule" | "realise" | "no_show";

export interface QualificationField {
  id: string;
  type: "text" | "textarea" | "select" | "email" | "phone";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface BookingPage {
  id: string;
  slug: string;
  is_active: boolean;
  title: string | null;
  description: string | null;
  brand_color: string;
  logo_url: string | null;
  slot_duration: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  qualification_fields: QualificationField[];
  timezone: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingAvailability {
  id: string;
  booking_page_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface BookingException {
  id: string;
  booking_page_id: string;
  exception_date: string;
  type: "blocked" | "override";
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_page_id: string;
  prospect_name: string;
  prospect_email: string;
  prospect_phone: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  qualification_answers: Record<string, string | string[]>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  booking_page?: BookingPage;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
}

export interface PublicBookingPageData {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  brand_color: string;
  logo_url: string | null;
  slot_duration: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_days_ahead: number;
  qualification_fields: QualificationField[];
  timezone: string;
}

// ============================================
// Landing Pages (Puck Builder)
// ============================================
export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  og_image_url: string | null;
  is_active: boolean;
  puck_data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PublicLandingPageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  og_image_url: string | null;
  puck_data: Record<string, unknown>;
}

// ============================================
// AI / RAG (MateuzsIA)
// ============================================
export type AIDocumentSourceType = "pdf" | "txt" | "formation";
export type AIDocumentStatus = "processing" | "ready" | "error";
export type AIMessageRole = "user" | "assistant";

export interface AIDocument {
  id: string;
  title: string;
  source_type: AIDocumentSourceType;
  formation_id: string | null;
  module_id: string | null;
  file_url: string | null;
  file_name: string | null;
  chunk_count: number;
  status: AIDocumentStatus;
  error_message: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: AIMessageRole;
  content: string;
  sources: AIMessageSource[] | null;
  created_at: string;
}

export interface AIMessageSource {
  document_id: string;
  title: string;
  chunk_preview: string;
}

// ============================================
// Formation Favorites
// ============================================
export interface FormationFavorite {
  id: string;
  user_id: string;
  formation_id: string;
  created_at: string;
}

// ============================================
// Module Prerequisites
// ============================================
export interface ModulePrerequisite {
  id: string;
  module_id: string;
  prerequisite_module_id: string;
  created_at: string;
}

// ============================================
// OKRs (Objectives & Key Results)
// ============================================
export type OKRPeriodType = "annual" | "quarterly" | "monthly";

export interface OKRPeriod {
  id: string;
  title: string;
  type: OKRPeriodType;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  objectives?: OKRObjective[];
}

export interface OKRObjective {
  id: string;
  period_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  key_results?: OKRKeyResult[];
}

// ============================================
// Tasks (personal to-do)
// ============================================
export type TaskStatus = "todo" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  is_top_priority: boolean;
  completed_at: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// SOPs (Standard Operating Procedures)
// ============================================
export type SOPDepartment = "ceo" | "sales" | "delivery" | "publicite" | "contenu" | "equipe" | "tresorerie" | "operations";

export interface SOPExternalLink {
  label: string;
  url: string;
}

export interface SOP {
  id: string;
  title: string;
  content: string | null;
  department: SOPDepartment;
  target_roles: string[];
  external_links: SOPExternalLink[];
  order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OKRKeyResult {
  id: string;
  objective_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Playbooks (Role-based Operating Systems)
// ============================================
export type PlaybookRole = "setter" | "closer" | "coach" | "assistante" | "all";
export type PlaybookPageType = "content" | "checklist" | "script" | "kpi" | "links";

export interface Playbook {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  target_role: PlaybookRole;
  icon: string;
  is_published: boolean;
  order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookSection {
  id: string;
  playbook_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybookPage {
  id: string;
  section_id: string;
  title: string;
  content: string | null;
  page_type: PlaybookPageType;
  external_links: SOPExternalLink[];
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaybookWithSections extends Playbook {
  sections: (PlaybookSection & { pages: PlaybookPage[] })[];
}

// ============================================
// Coach Clients (CRM Coach avancé)
// ============================================
export type CoachPhase = "onboarding" | "lancement" | "optimisation" | "scaling" | "autonomie" | "offboarding";
export type HealthStatus = "en_forme" | "attention" | "critique" | "a_risque";

export interface CoachClient {
  id: string;
  client_id: string;
  coach_id: string | null;
  phase: CoachPhase;
  health_status: HealthStatus;
  start_date: string;
  end_date: string | null;
  monthly_revenue: number;
  nps_score: number | null;
  last_contact_at: string;
  instagram_url: string | null;
  ads_url: string | null;
  product: string | null;
  notes: string | null;
  plan_content: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Client Reports (Rapports hebdo/mensuels + NPS)
// ============================================
export type ReportType = "weekly" | "monthly";

export interface ReportMetrics {
  leads?: number;
  appels_bookes?: number;
  show_up_pct?: number;
  closes?: number;
  depense_pub?: number;
  cpa?: number;
  ca_mensuel?: number;
}

export interface ClientReport {
  id: string;
  client_id: string;
  author_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  nps_score: number | null;
  metrics: ReportMetrics;
  diagnostic: string | null;
  actions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string };
}

// ============================================
// Video Content (Production vidéo)
// ============================================
export type VideoPlatform = "instagram" | "youtube" | "tiktok" | "other";
export type VideoStatus = "idee" | "script_pret" | "tournage_pret" | "publie";

export interface VideoContent {
  id: string;
  title: string;
  platform: VideoPlatform;
  status: VideoStatus;
  publish_date: string | null;
  script_notes: string | null;
  description: string | null;
  external_url: string | null;
  created_by: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Time Entries (Suivi heures)
// ============================================
export interface TimeEntry {
  id: string;
  member_id: string;
  title: string;
  entry_date: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

// ============================================
// Meeting Notes (Notes de réunion)
// ============================================
export type MeetingType = "hebdo" | "mensuel" | "trimestriel" | "autre";

export interface MeetingNote {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: MeetingType;
  content: string | null;
  participants: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Tool Links (Hub liens/outils)
// ============================================
export type ToolCategory = "vente" | "ads" | "delivery" | "operations" | "contenu" | "finance" | "autre";

export interface ToolLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: ToolCategory;
  order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
