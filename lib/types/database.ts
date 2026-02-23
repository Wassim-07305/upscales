export type UserRole = "admin" | "moderator" | "member" | "prospect";
export type FormationStatus = "draft" | "published" | "archived";
export type ModuleType = "video_upload" | "video_embed" | "text" | "quiz";
export type ChannelType = "public" | "private" | "dm";
export type NotificationType = "message" | "post" | "formation" | "session" | "certificate" | "system";
export type SessionStatus = "scheduled" | "completed" | "cancelled";
export type PostType = "text" | "image" | "video" | "announcement";

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
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order: number;
  created_at: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
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
