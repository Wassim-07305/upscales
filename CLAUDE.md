# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Upscale is a Learning Management System (LMS) platform (French-language UI). Built with Next.js App Router and Supabase, it features a dual-portal interface: student dashboard (course catalog, module content, certificates, community, calendar, chat) and admin panel (CRM, course editor, channel management, session scheduling). Server Components handle data fetching with streaming loading states throughout.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint across the project

## Architecture

### Tech Stack
React 19 + TypeScript 5 + Next.js 16 (App Router) + Tailwind CSS 4 + Supabase (PostgreSQL + Auth + RLS + Storage). State: Zustand. Forms: React Hook Form + Zod. Rich text: Tiptap. PDF: @react-pdf/renderer. Charts: Recharts. Dark mode: next-themes. Deployed on Vercel.

### Directory Layout
```
app/
  layout.tsx               # Root layout (fonts, ThemeProvider, metadata)
  page.tsx                 # Home/redirect
  (auth)/                  # Public auth routes
    login/, register/, forgot-password/
  (dashboard)/             # Protected routes (requires auth)
    layout.tsx             # Server component: fetches user + profile, redirects if unauthenticated
    DashboardShell.tsx     # Client component: sidebar + mobile nav wrapper
    page.tsx               # Dashboard redirect
    dashboard/             # Main student dashboard
    formations/            # Course catalog
      [formationId]/       # Course detail + EnrollButton
        [moduleId]/        # Module content (ModuleContent.tsx)
    calendar/              # Sessions/events (CalendarClient.tsx)
    chat/                  # Messaging (ChatLayout.tsx)
    community/             # Social feed + [postId] detail
    notifications/         # Notification center
    certificates/          # Earned certificates
    profile/               # User profile (ProfileForm.tsx)
    admin/                 # Admin-only routes
      page.tsx             # Admin overview + AdminCharts
      formations/          # Course management + [formationId]/edit/FormationEditor
      crm/                 # Student CRM + [userId]/StudentDetail
      calendar/            # Session management
      channels/            # Channel management
      settings/            # Admin settings
  api/
    auth/callback/route.ts    # OAuth code exchange
    certificates/[id]/route.ts  # PDF certificate generation (HTML response)
    upload/route.ts           # File upload to Supabase Storage
components/
  ui/                      # 26 shadcn/ui components (button, card, dialog, tabs, command, etc.)
lib/
  supabase/
    client.ts              # Browser Supabase client
    server.ts              # Server Supabase client (cookies-based)
    middleware.ts           # Session refresh middleware
  utils/
    dates.ts               # formatDate(), formatRelative(), formatTime() with French locale
middleware.ts              # Next.js middleware entry
```

### Key Patterns

**Server Components**: All page components are async Server Components that fetch data directly via Supabase server client. Pattern: `const supabase = await createClient()` → parallel queries via `Promise.all()` → pass data as props to client components.

**Streaming UI**: 15 `loading.tsx` files provide per-route loading skeletons. Each route streams independently for fast perceived performance.

**API routes**: 3 routes handle server-only operations:
- `api/auth/callback` — OAuth code exchange
- `api/certificates/[id]` — Generates HTML certificate (title, student name, date, certificate number)
- `api/upload` — File upload to Supabase Storage bucket

**Dashboard layout**: Server-rendered layout fetches profile → redirects to `/login` if unauthenticated. Wraps content in `DashboardShell` (client component with sidebar + responsive nav).

**Rich text**: Tiptap editor integration for course content and community posts.

### Path Alias
`@/*` maps to root directory (configured in `tsconfig.json`). Always use `@/` imports.

### Environment Variables
Defined in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

### Supabase
- Browser client in `lib/supabase/client.ts`, server client in `lib/supabase/server.ts`
- Session management via middleware
- Tables: profiles, formations, modules, formation_enrollments, module_progress, sessions, certificates, notifications, community_posts
- Migrations in `supabase/migrations/`
- Storage for file uploads
- Roles: admin, student

## Conventions

- All UI text is in French
- Dates formatted with `date-fns` using `fr` locale via `lib/utils/dates.ts`
- TypeScript strict mode
- Toast notifications via Sonner
- Icons from `lucide-react`
- Fonts: Outfit (sans), Syne (display), Geist Mono (mono)
- Theme: dark mode forced — neon primary (#C6FF00), turquoise secondary (#7FFFD4), dark background (#0D0D0D)
- Glass card effects, mesh gradients, glow animations
- `cn()` helper for conditional Tailwind classes
- shadcn/ui for all UI primitives (26 components)
- next-themes for dark mode management
