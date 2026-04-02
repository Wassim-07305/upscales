# Duplication UPSCALE → Upscale — Design Spec

## Goal

Remplacer le code et le schema DB d'Upscale par une copie d'UPSCALE, puis appliquer le branding Upscale (couleurs, fonts, logos, nom, landing page) pour obtenir une plateforme identique a UPSCALE mais avec l'identite visuelle Upscale.

## Constraints

- **UPSCALE est READ-ONLY** — aucune modification de fichier ni de DB
- **Upscale garde sa propre DB Supabase** (`wcdtfkcbqsxdzjjrtwdj`)
- **Upscale garde son `.git/`** (remote `Wassim-07305/upscales`)
- **Upscale garde son `.env.local`** (credentials Supabase, API keys)
- Pas de donnees a preserver dans Upscale (DB vide)

## Phase 1 — Sauvegarde branding Upscale

Extraire dans `/Users/wassim/Projets/upscale/_branding/` :

### Couleurs (fichier `colors.css`)

- Mode clair : `--primary: #4d7a00`, `--brand: #3d6b00`, `--accent: #f0ffb3`
- Mode sombre : `--primary: #c6ff00` (neon), `--secondary: #7fffd4` (turquoise), `--background: #0d0d0d`
- Custom : `--color-neon: #c6ff00`, `--color-turquoise: #7fffd4`, surfaces `#141414/#1c1c1c/#222222`
- Charts : 5 couleurs light + dark
- Effets : glow-neon, mesh-gradient, dot-grid, scrollbar

### Fonts

- Titres : Syne (400-800)
- Body : Outfit
- Mono : Geist Mono

### Logos

Copier depuis `public/` : `Logo.webp`, tous les `icons/icon-*.png`, favicons, apple-touch-icon

### Landing page

Copier :

- `app/p/` (systeme Puck CMS — pages dynamiques)
- `app/p/scaling/` (landing specifique)
- `lib/puck/` (config + 18 blocs)

### Metadata

- Nom : "UPSCALE"
- Tagline : "Plateforme de Formation"
- Description : "Plateforme de formation en ligne pour developper vos competences en vente, closing et business."
- Theme color : `#0D0D0D`
- PWA : `manifest.json` complet

## Phase 2 — Duplication code UPSCALE → Upscale

### Etapes

1. Sauvegarder `.env.local` et `.git/` d'Upscale dans un dossier temporaire
2. Supprimer tout le contenu d'Upscale sauf `.git/` et `.env.local`
3. Copier tout UPSCALE vers Upscale (sauf `.git/`, `.env.local`, `.env.example`, `node_modules/`, `.next/`, `_branding/`)
4. Restaurer `.env.local` d'Upscale
5. `npm install` dans Upscale

## Phase 3 — Migration DB

1. Connecter a la DB Upscale via `DATABASE_URL` depuis `.env.local`
2. Drop toutes les tables schema public + extensions si necessaire
3. Appliquer les 140+ migrations d'UPSCALE sequentiellement via `supabase db push` ou psql
4. Verifier le schema (count tables)

## Phase 4 — Rebranding

### 4.1 CSS & Couleurs

**Fichier : `src/app/globals.css`**

- Remplacer toutes les variables CSS UPSCALE par celles d'Upscale
- Ajouter les variables custom (neon, turquoise, surface)
- Ajouter effets (glow-neon, mesh-gradient, dot-grid)

### 4.2 Fonts

**Fichier : `src/app/layout.tsx`**

- Inter → Outfit
- Instrument Serif → Syne
- JetBrains Mono → Geist Mono

**Fichier : `src/app/globals.css`**

- `--font-sans` → Outfit
- `--font-heading` → Syne
- `--font-mono` → Geist Mono

### 4.3 Nom app (search & replace)

Remplacer dans ~20 fichiers :

- "UPSCALE" → "UPSCALE"
- "UPSCALE" → "UPSCALE"
- "upscale" → "upscale"
- "upscale" → "upscale"

Fichiers concernes :

- `src/app/layout.tsx` (metadata)
- `src/app/(marketing)/layout.tsx`
- `src/app/opengraph-image.tsx`
- `src/hooks/usePageTitle.ts`
- `src/lib/email.ts`
- `src/lib/pdf.ts`
- `src/lib/form-templates.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/insights/route.ts`
- `src/app/api/ai/call-summary/route.ts`
- `src/app/api/ai/alexia/chat/route.ts`
- `src/app/(public)/cgv/page.tsx`
- `src/app/(public)/confidentialite/page.tsx`
- `src/app/(public)/mentions-legales/page.tsx`
- `src/components/onboarding/welcome-step.tsx`
- `package.json`

### 4.4 Config infra

- `next.config.ts` : hostname Supabase `srhpdgqqiuzdrlqaitdk` → `wcdtfkcbqsxdzjjrtwdj`
- `public/manifest.json` : name, theme_color, background_color
- `src/app/robots.ts` : base URL

### 4.5 Assets

- Copier logos Upscale depuis `_branding/` vers `public/`
- Favicons, apple-touch-icon, icons PWA

### 4.6 Landing page

- Copier le systeme Puck (landing page builder) depuis `_branding/` :
  - `lib/puck/` → `src/lib/puck/`
  - `app/p/` → `src/app/p/`
- Adapter les imports si necessaire (UPSCALE utilise `src/app/` prefix, Upscale utilisait `app/` directement)

## Phase 5 — Verification

1. `npm run build` doit passer
2. `npm run dev` doit demarrer
3. Verifier visuellement : couleurs neon/turquoise, nom UPSCALE, fonts Syne/Outfit
4. Commit + push sur le remote Upscale

## Risques

- **Differences de structure** : UPSCALE utilise `src/app/` (App Router avec src/), Upscale utilisait `app/` sans src/. La copie doit respecter la structure UPSCALE (`src/`).
- **Puck CMS** : le systeme de landing pages d'Upscale utilise Puck (drag-and-drop) qui n'existe pas dans UPSCALE. Il faudra installer la dependance `@measured/puck` dans le nouveau Upscale.
- **Env vars** : certaines env vars d'UPSCALE peuvent manquer dans Upscale (OPENROUTER, RESEND, STRIPE, etc.). Le build peut echouer sur des features qui dependent de ces cles.
