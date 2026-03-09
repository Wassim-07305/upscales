# Upscale LMS

Plateforme de formation en ligne (Learning Management System) complète avec portail apprenant et panneau d'administration.

## Stack technique

- **Frontend** : Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling** : Tailwind CSS 4 + shadcn/ui
- **Backend** : Supabase (PostgreSQL, Auth, RLS, Storage, Realtime)
- **State** : Zustand
- **Formulaires** : React Hook Form + Zod
- **Editeur rich text** : Tiptap
- **PDF** : @react-pdf/renderer
- **Charts** : Recharts
- **Page builder** : Puck
- **IA** : OpenAI embeddings + pgvector + Claude Haiku (RAG)

## Fonctionnalites

### Portail Apprenant
- Catalogue de formations (video, texte, quiz)
- Lecteur video avec sauvegarde de progression
- Quiz avec score et retry
- Sidebar de navigation des modules avec barre de progression
- Certificats PDF generes automatiquement
- Confetti de celebration a la fin d'une formation
- Communaute (posts, likes, commentaires, reponses)
- Chat en temps reel (channels publics, prives, DM)
- Calendrier de sessions avec inscription
- Notifications en temps reel
- Assistant IA (RAG sur le contenu des formations)
- Profil utilisateur avec onboarding

### Panneau Admin
- Dashboard avec KPIs et graphiques
- Editeur de formations (modules, quiz, drag & drop)
- CRM etudiants (fiches, tags, notes)
- Gestion des channels de discussion
- Gestion des sessions/evenements
- Systeme de booking (pages de reservation, creneaux, qualifications)
- Page builder (landing pages avec Puck)
- Gestion de la base de connaissances IA
- Parametres de la plateforme

## Installation

### Pre-requis
- Node.js 18+
- Un projet Supabase

### Configuration

1. Cloner le repo :
```bash
git clone https://github.com/Wassim-07305/upscales.git
cd upscales
git checkout dev
```

2. Installer les dependances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env.local
```

Remplir `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

4. Appliquer les migrations Supabase (dans le SQL Editor du dashboard) :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_booking_system.sql`
   - `supabase/migrations/003_fix_booking_day_of_week.sql`
   - `supabase/migrations/004_landing_pages.sql`
   - `supabase/migrations/005_ai_knowledge_base.sql`
   - `supabase/migrations/006_fix_comment_likes_trigger.sql`

5. Creer un bucket `media` dans Supabase Storage (public).

### Lancement

```bash
NODE_OPTIONS='--max-http-header-size=32768' npm run dev -- -p 3005
```

L'option `--max-http-header-size` est necessaire pour les JWT Supabase ES256.

Ouvrir [http://localhost:3005](http://localhost:3005).

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Linting ESLint |

## Structure du projet

```
app/
  (auth)/              # Routes publiques (login, register, forgot-password)
  (dashboard)/         # Routes protegees (dashboard, formations, chat, etc.)
    admin/             # Routes admin (CRM, formations editor, settings)
  (onboarding)/        # Onboarding nouvel utilisateur
  api/                 # API routes (upload, certificates, auth, booking, AI)
  book/[slug]/         # Pages de reservation publiques
  p/[slug]/            # Landing pages publiques
components/
  ui/                  # 26 composants shadcn/ui
  formations/          # VideoPlayer, QuizComponent, ModuleList
  community/           # PostCard, CommentSection, CreatePost
  booking/             # Composants admin et public du booking
  layout/              # Sidebar, Header, GlobalSearch, Notifications
  notifications/       # NotificationBell, NotificationItem
lib/
  supabase/            # Clients Supabase (browser, server, admin, middleware)
  stores/              # Zustand stores (chat, notifications, UI)
  hooks/               # Custom hooks (useChat, useNotifications, useCRM, etc.)
  puck/                # Blocs Puck pour le page builder
  ai/                  # RAG pipeline (embeddings, chunker, system prompt)
  types/               # TypeScript interfaces
  utils/               # Helpers (dates, formatters, roles)
supabase/
  migrations/          # 6 fichiers de migration SQL
```

## Deploiement

Deployer sur [Vercel](https://vercel.com) avec les variables d'environnement configurees.
