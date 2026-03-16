import { z } from "zod";

// ============================================
// AUTH
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
});

// ============================================
// UPLOAD
// ============================================

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
] as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_FILE_SIZE, "Le fichier ne doit pas dépasser 50 Mo")
    .refine(
      (f) => (ALLOWED_MIME_TYPES as readonly string[]).includes(f.type),
      "Type de fichier non autorisé"
    ),
  bucket: z.string().min(1).max(50).default("media"),
});

// ============================================
// BOOKING
// ============================================

export const createBookingSchema = z.object({
  slug: z.string().min(1, "Le slug est requis"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format d'heure invalide (HH:MM)"),
  prospect_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(200),
  prospect_email: z.string().email("Adresse email invalide"),
  prospect_phone: z.string().max(20).optional().nullable(),
  qualification_answers: z.record(z.string(), z.unknown()).optional().nullable(),
});

// ============================================
// FORMATIONS
// ============================================

export const formationSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().max(5000).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_free: z.boolean().default(false),
  price: z.number().min(0).max(99999).optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const moduleSchema = z.object({
  formation_id: z.string().uuid("ID de formation invalide"),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["video_upload", "video_embed", "text", "quiz"]).default("video_upload"),
  video_url: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).default(0),
  order: z.number().int().min(0).default(0),
  is_preview: z.boolean().default(false),
});

// ============================================
// COMMUNITY
// ============================================

export const postSchema = z.object({
  type: z.enum(["text", "image", "video", "announcement"]).default("text"),
  title: z.string().max(300).optional().nullable(),
  content: z.string().min(1, "Le contenu est requis").max(10000),
  media_url: z.string().url().optional().nullable(),
});

export const commentSchema = z.object({
  post_id: z.string().uuid("ID de post invalide"),
  content: z.string().min(1, "Le commentaire est requis").max(5000),
  parent_id: z.string().uuid().optional().nullable(),
});

// ============================================
// PROFILE
// ============================================

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

// ============================================
// SESSIONS / CALENDAR
// ============================================

export const sessionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().max(5000).optional().nullable(),
  start_time: z.string().datetime("Date/heure de début invalide"),
  end_time: z.string().datetime("Date/heure de fin invalide"),
  location: z.string().max(500).optional().nullable(),
  max_participants: z.number().int().min(1).optional().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#C6FF00"),
});

// ============================================
// CHAT
// ============================================

export const messageSchema = z.object({
  channel_id: z.string().uuid("ID de canal invalide"),
  content: z.string().min(1, "Le message est requis").max(5000),
  media_url: z.string().url().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
});

export const channelSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["public", "private", "dm"]).default("public"),
  icon: z.string().max(10).optional().nullable(),
});

// ============================================
// STRIPE / CHECKOUT
// ============================================

export const checkoutSchema = z.object({
  formation_id: z.string().uuid("ID de formation invalide"),
});

// ============================================
// AI CHAT
// ============================================

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      parts: z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
      })).optional(),
      content: z.string().optional(),
    })
  ).min(1, "Au moins un message est requis"),
  conversationId: z.string().uuid().optional().nullable(),
});

// ============================================
// CRM
// ============================================

export const crmNoteSchema = z.object({
  student_id: z.string().uuid("ID étudiant invalide"),
  content: z.string().min(1, "La note est requise").max(5000),
});

// ============================================
// QUIZ
// ============================================

export const quizAttemptSchema = z.object({
  quiz_id: z.string().uuid("ID de quiz invalide"),
  answers: z.record(z.string(), z.unknown()),
});

// ============================================
// LANDING PAGES
// ============================================

export const landingPageSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional().nullable(),
  og_image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(false),
  puck_data: z.record(z.string(), z.unknown()),
});

// ============================================
// BOOKING PAGES (admin)
// ============================================

export const bookingPageSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug invalide"),
  title: z.string().min(3).max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#C6FF00"),
  logo_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  slot_duration: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
  buffer_minutes: z.number().int().min(0).max(60).default(0),
  min_notice_hours: z.number().int().min(1).max(168).default(24),
  max_days_ahead: z.number().int().min(1).max(90).default(14),
  timezone: z.string().default("Europe/Paris"),
  qualification_fields: z.array(z.record(z.string(), z.unknown())).default([]),
});

// ============================================
// TYPES EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type FormationInput = z.infer<typeof formationSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CrmNoteInput = z.infer<typeof crmNoteSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
export type LandingPageInput = z.infer<typeof landingPageSchema>;
export type BookingPageInput = z.infer<typeof bookingPageSchema>;
