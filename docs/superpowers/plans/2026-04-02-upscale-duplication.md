# Duplication UPSCALE → Upscale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le projet Upscale par une copie d'UPSCALE avec le branding Upscale (couleurs neon/turquoise, fonts Syne/Outfit, nom "UPSCALE", landing page Puck).

**Architecture:** Sauvegarde branding Upscale → copie code UPSCALE → migration DB → rebranding (CSS, fonts, noms, logos, landing page). UPSCALE est READ-ONLY.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Supabase, Puck CMS (landing pages Upscale)

---

### Task 1: Sauvegarder le branding Upscale

**Files:**

- Source (read-only): `/Users/wassim/Projets/upscale/app/globals.css`, `app/layout.tsx`, `public/`, `lib/puck/`, `app/p/`
- Create: `/Users/wassim/Projets/upscale/_branding/` (dossier de sauvegarde)

- [ ] **Step 1: Creer le dossier \_branding et copier les fichiers essentiels**

```bash
cd /Users/wassim/Projets/upscale
mkdir -p _branding/public _branding/puck _branding/landing

# CSS complet (contient toutes les variables de couleur)
cp app/globals.css _branding/globals.css

# Layout (contient fonts + metadata)
cp app/layout.tsx _branding/layout.tsx

# Manifest PWA
cp public/manifest.json _branding/manifest.json

# Logos et icons
cp -r public/icons _branding/public/icons
cp public/Logo.webp _branding/public/Logo.webp
cp public/favicon-16x16.png _branding/public/favicon-16x16.png
cp public/favicon-32x32.png _branding/public/favicon-32x32.png
cp public/apple-touch-icon.png _branding/public/apple-touch-icon.png
cp public/icon-192x192.png _branding/public/icon-192x192.png 2>/dev/null
cp public/icon-512x512.png _branding/public/icon-512x512.png 2>/dev/null
cp app/favicon.ico _branding/public/favicon.ico
cp app/apple-icon.png _branding/public/apple-icon.png
cp app/icon.png _branding/public/icon.png

# Systeme Puck (landing page builder)
cp -r lib/puck _branding/puck/

# Landing pages
cp -r app/p _branding/landing/
```

- [ ] **Step 2: Verifier que tout est copie**

```bash
find /Users/wassim/Projets/upscale/_branding -type f | wc -l
ls -la /Users/wassim/Projets/upscale/_branding/
ls -la /Users/wassim/Projets/upscale/_branding/public/
ls -la /Users/wassim/Projets/upscale/_branding/puck/
```

Expected: Au moins 30+ fichiers (CSS, layout, manifest, 20+ icons, 18+ blocs Puck, landing pages)

---

### Task 2: Sauvegarder .env.local et vider Upscale

**Files:**

- Backup: `/Users/wassim/Projets/upscale/.env.local`
- Delete: tout sauf `.git/`, `.env.local`, `_branding/`

- [ ] **Step 1: Copier .env.local dans \_branding pour securite**

```bash
cp /Users/wassim/Projets/upscale/.env.local /Users/wassim/Projets/upscale/_branding/.env.local.backup
```

- [ ] **Step 2: Supprimer tout le contenu sauf .git, .env.local, \_branding**

```bash
cd /Users/wassim/Projets/upscale
# Lister ce qu'on va supprimer
ls -A | grep -v -E '^\.git$|^\.env\.local$|^_branding$'

# Supprimer tout sauf les 3 elements proteges
find . -maxdepth 1 -not -name '.' -not -name '.git' -not -name '.env.local' -not -name '_branding' -exec rm -rf {} +
```

- [ ] **Step 3: Verifier que seuls .git, .env.local et \_branding restent**

```bash
ls -la /Users/wassim/Projets/upscale/
```

Expected: `.git/`, `.env.local`, `_branding/` uniquement

---

### Task 3: Copier le code UPSCALE vers Upscale

**Files:**

- Source (READ-ONLY): `/Users/wassim/Projets/UPSCALE/`
- Destination: `/Users/wassim/Projets/upscale/`

- [ ] **Step 1: Copier tous les fichiers UPSCALE sauf exclusions**

```bash
cd /Users/wassim/Projets/UPSCALE
rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.env.example' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.turbo' \
  --exclude='.vercel' \
  . /Users/wassim/Projets/upscale/
```

- [ ] **Step 2: Verifier la copie**

```bash
# Comparer le nombre de fichiers src/ (hors node_modules/.next)
find /Users/wassim/Projets/UPSCALE/src -type f | wc -l
find /Users/wassim/Projets/upscale/src -type f | wc -l

# Verifier que .env.local est toujours celui d'Upscale
grep "SUPABASE_URL" /Users/wassim/Projets/upscale/.env.local | head -1
# Doit contenir wcdtfkcbqsxdzjjrtwdj (Upscale), PAS srhpdgqqiuzdrlqaitdk (UPSCALE)
```

- [ ] **Step 3: Installer les dependances**

```bash
cd /Users/wassim/Projets/upscale
npm install
```

---

### Task 4: Migration DB — Reset schema Upscale

**Files:**

- Source migrations (read-only): `/Users/wassim/Projets/upscale/supabase/migrations/` (copiees d'UPSCALE)
- Target DB: Supabase Upscale `wcdtfkcbqsxdzjjrtwdj`

- [ ] **Step 1: Verifier l'acces a la DB Upscale**

```bash
cd /Users/wassim/Projets/upscale
source .env.local
echo $DATABASE_URL | grep -o "@[^/]*" | head -1
# Doit montrer le host Upscale, PAS UPSCALE
```

- [ ] **Step 2: Drop toutes les tables existantes du schema public**

```bash
cd /Users/wassim/Projets/upscale
source .env.local
/opt/homebrew/Cellar/postgresql@18/18.3/bin/psql "$DATABASE_URL" -c "
DO \$\$ DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
    -- Drop all functions
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as args FROM pg_proc WHERE pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
END \$\$;
"
```

- [ ] **Step 3: Appliquer toutes les migrations UPSCALE**

```bash
cd /Users/wassim/Projets/upscale
source .env.local

# Appliquer chaque migration dans l'ordre
for f in supabase/migrations/*.sql; do
    echo "Applying: $f"
    /opt/homebrew/Cellar/postgresql@18/18.3/bin/psql "$DATABASE_URL" -f "$f" 2>&1 | tail -1
done
```

- [ ] **Step 4: Verifier le schema**

```bash
cd /Users/wassim/Projets/upscale
source .env.local
/opt/homebrew/Cellar/postgresql@18/18.3/bin/psql "$DATABASE_URL" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
```

Expected: Nombre de tables similaire a UPSCALE (~190)

- [ ] **Step 5: Commit la copie du code (avant rebranding)**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "chore: replace codebase with UPSCALE fork

Base code copied from UPSCALE. DB schema migrated.
Branding and customization will follow in next commits."
```

---

### Task 5: Rebranding — CSS & Couleurs

**Files:**

- Modify: `/Users/wassim/Projets/upscale/src/app/globals.css`

- [ ] **Step 1: Remplacer le globals.css par celui d'Upscale**

Le fichier `_branding/globals.css` contient le CSS complet d'Upscale avec les bonnes variables. Cependant, le globals.css d'UPSCALE a potentiellement des composants CSS supplementaires (tiptap, animations, etc.) que le branding Upscale a aussi. La strategie est :

1. Copier le globals.css d'Upscale comme base
2. Ajouter les composants CSS specifiques a UPSCALE qui manquent (si necessaire)

```bash
cd /Users/wassim/Projets/upscale
# Sauvegarder le globals.css UPSCALE pour reference
cp src/app/globals.css src/app/globals.css.upscale

# Copier le globals.css Upscale
cp _branding/globals.css src/app/globals.css
```

Puis comparer les deux fichiers et ajouter les styles UPSCALE manquants dans le globals.css Upscale (ex: composants specifiques a UPSCALE comme les styles de `coach-students-list`, `stat-card`, etc.). Cela sera fait manuellement en lisant les deux fichiers et mergant les classes CSS specifiques qui manquent.

- [ ] **Step 2: Verifier que les imports Tailwind sont compatibles**

UPSCALE utilise `@import "tailwindcss"` et Upscale aussi. Verifier que le format est identique. Si UPSCALE utilise des plugins ou directives supplementaires dans globals.css, les ajouter.

```bash
head -10 /Users/wassim/Projets/upscale/src/app/globals.css
head -10 /Users/wassim/Projets/upscale/src/app/globals.css.upscale
```

- [ ] **Step 3: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add src/app/globals.css
git commit -m "style: apply Upscale branding colors (neon/turquoise theme)"
```

---

### Task 6: Rebranding — Fonts

**Files:**

- Modify: `/Users/wassim/Projets/upscale/src/app/layout.tsx`

- [ ] **Step 1: Remplacer les imports de fonts**

Dans `src/app/layout.tsx`, remplacer :

```typescript
// UPSCALE (a remplacer)
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});
```

Par :

```typescript
// UPSCALE
import { Outfit, Syne, Geist_Mono } from "next/font/google";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

- [ ] **Step 2: Remplacer les classes CSS sur le body**

Dans le meme fichier, chercher la balise `<body>` ou `<html>` et remplacer les variables de fonts :

```typescript
// UPSCALE
className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ...`}

// UPSCALE
className={`${outfit.variable} ${syne.variable} ${geistMono.variable} dark ...`}
```

Note : Upscale force le mode sombre avec `dark` dans la classe.

- [ ] **Step 3: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add src/app/layout.tsx
git commit -m "style: replace fonts (Inter→Outfit, Instrument→Syne, JetBrains→GeistMono)"
```

---

### Task 7: Rebranding — Nom de l'app (search & replace)

**Files:**

- Modify: ~20 fichiers dans `/Users/wassim/Projets/upscale/src/`

- [ ] **Step 1: Search & replace global — "UPSCALE" → "UPSCALE"**

```bash
cd /Users/wassim/Projets/upscale

# Trouver tous les fichiers avec "Off.Market" ou "off.market" (hors node_modules, .next, .git)
grep -r --include="*.tsx" --include="*.ts" --include="*.json" --include="*.md" -l "Off.Market\|off.market\|UPSCALE\|upscale" src/ public/ --exclude-dir=node_modules --exclude-dir=.next | sort

# Remplacer dans tous les fichiers source
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/UPSCALE/UPSCALE/g' \
  -e 's/UPSCALE/UPSCALE/g' \
  -e 's/upscale/upscale/g' \
  -e 's/upscale/upscale/g' \
  {} +
```

- [ ] **Step 2: Mettre a jour package.json**

```bash
cd /Users/wassim/Projets/upscale
# Remplacer le nom dans package.json
sed -i '' 's/"name": "upscale"/"name": "upscale"/' package.json
```

- [ ] **Step 3: Mettre a jour les metadata dans layout.tsx**

Dans `src/app/layout.tsx`, remplacer la metadata :

```typescript
export const metadata: Metadata = {
  title: "UPSCALE — Plateforme de Formation",
  description:
    "Plateforme de formation en ligne pour developper vos competences en vente, closing et business. Cours, coaching, communaute et outils.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UPSCALE",
  },
  // ... reste des metadata avec "UPSCALE" partout
};
```

- [ ] **Step 4: Mettre a jour le manifest.json**

```bash
cd /Users/wassim/Projets/upscale
cp _branding/manifest.json public/manifest.json
```

- [ ] **Step 5: Mettre a jour la description/tagline**

Chercher et remplacer la tagline UPSCALE :

- "Deviens le choix evident" → "Plateforme de Formation"
- "coaching business pour freelances" → "formation en vente, closing et business"
- "10K EUR/mois" → garder tel quel (meme cible)

- [ ] **Step 6: Mettre a jour les system prompts IA**

Dans chaque fichier API AI, remplacer "UPSCALE" par "UPSCALE" :

- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/insights/route.ts`
- `src/app/api/ai/call-summary/route.ts`
- `src/app/api/ai/matia/chat/route.ts`

Verifier avec :

```bash
grep -r "Off.Market\|off.market" src/app/api/ai/ --include="*.ts"
```

Expected: Aucun resultat

- [ ] **Step 7: Mettre a jour les emails**

Dans `src/lib/email.ts` :

```typescript
// "UPSCALE <noreply@upscale.fr>" → adapter selon le domaine Upscale
DEFAULT_FROM = "UPSCALE <noreply@upscale-app.fr>";
```

Dans `src/lib/pdf.ts` :

```typescript
BUSINESS = {
  name: "UPSCALE",
  company: "UPSCALE — Formation & Coaching",
  // ...
};
```

- [ ] **Step 8: Verification finale — plus aucune mention UPSCALE**

```bash
cd /Users/wassim/Projets/upscale
grep -r --include="*.tsx" --include="*.ts" --include="*.json" "Off.Market\|off.market\|UPSCALE\|upscale" src/ public/ | grep -v node_modules | grep -v ".next"
```

Expected: Aucun resultat (0 mentions)

- [ ] **Step 9: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "chore: rebrand UPSCALE → UPSCALE (names, metadata, AI prompts, emails)"
```

---

### Task 8: Rebranding — Config infra

**Files:**

- Modify: `next.config.ts`, `src/app/robots.ts`

- [ ] **Step 1: Mettre a jour next.config.ts — hostname Supabase**

Dans `/Users/wassim/Projets/upscale/next.config.ts`, remplacer le hostname Supabase des images :

```typescript
// UPSCALE
hostname: "srhpdgqqiuzdrlqaitdk.supabase.co";

// UPSCALE
hostname: "wcdtfkcbqsxdzjjrtwdj.supabase.co";
```

```bash
cd /Users/wassim/Projets/upscale
sed -i '' 's/srhpdgqqiuzdrlqaitdk/wcdtfkcbqsxdzjjrtwdj/g' next.config.ts
```

- [ ] **Step 2: Mettre a jour robots.ts si present**

```bash
cd /Users/wassim/Projets/upscale
grep -r "upscale" src/app/robots.ts 2>/dev/null && \
  sed -i '' 's/upscale/upscale/g' src/app/robots.ts
```

- [ ] **Step 3: Supprimer le dossier .vercel si copie**

```bash
rm -rf /Users/wassim/Projets/upscale/.vercel
```

- [ ] **Step 4: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "chore: update infra config (Supabase hostname, robots, vercel)"
```

---

### Task 9: Rebranding — Assets (logos, favicons, icons)

**Files:**

- Source: `/Users/wassim/Projets/upscale/_branding/public/`
- Destination: `/Users/wassim/Projets/upscale/public/`

- [ ] **Step 1: Copier les logos Upscale**

```bash
cd /Users/wassim/Projets/upscale

# Logo principal
cp _branding/public/Logo.webp public/logo.png 2>/dev/null || true
cp _branding/public/Logo.webp public/Logo.webp 2>/dev/null || true

# Favicons
cp _branding/public/favicon.ico src/app/favicon.ico 2>/dev/null || true
cp _branding/public/favicon-16x16.png public/favicon-16x16.png 2>/dev/null || true
cp _branding/public/favicon-32x32.png public/favicon-32x32.png 2>/dev/null || true
cp _branding/public/favicon.ico public/favicon.png 2>/dev/null || true

# Apple touch
cp _branding/public/apple-touch-icon.png public/apple-touch-icon.png 2>/dev/null || true
cp _branding/public/apple-icon.png src/app/apple-icon.png 2>/dev/null || true
cp _branding/public/icon.png src/app/icon.png 2>/dev/null || true

# PWA icons
cp -r _branding/public/icons/* public/icons/ 2>/dev/null || true
```

- [ ] **Step 2: Verifier les logos**

```bash
ls -la /Users/wassim/Projets/upscale/public/Logo.webp
ls -la /Users/wassim/Projets/upscale/public/icons/ | head -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "chore: replace logos, favicons and PWA icons with Upscale assets"
```

---

### Task 10: Landing page — Integrer le systeme Puck

**Files:**

- Source: `/Users/wassim/Projets/upscale/_branding/puck/`, `_branding/landing/`
- Create/Modify: `src/lib/puck/`, `src/app/p/`

- [ ] **Step 1: Installer la dependance Puck**

```bash
cd /Users/wassim/Projets/upscale
npm install @measured/puck
```

- [ ] **Step 2: Copier les blocs Puck et la config**

```bash
cd /Users/wassim/Projets/upscale

# Creer le dossier si inexistant
mkdir -p src/lib/puck/blocks

# Copier la config et les blocs
cp _branding/puck/config.ts src/lib/puck/config.ts
cp _branding/puck/blocks/* src/lib/puck/blocks/
```

- [ ] **Step 3: Copier les landing pages**

```bash
cd /Users/wassim/Projets/upscale
mkdir -p src/app/p

# Copier les pages (adapter le path app/ → src/app/)
cp -r _branding/landing/* src/app/p/
```

- [ ] **Step 4: Verifier les imports dans les blocs Puck**

Les blocs Puck d'Upscale utilisaient des imports sans `src/` prefix (ex: `@/lib/...`). Comme UPSCALE utilise `@/` = `src/`, les imports devraient fonctionner. Verifier :

```bash
cd /Users/wassim/Projets/upscale
grep -r "from ['\"]@/" src/lib/puck/ | head -10
# Tous les imports doivent utiliser @/ qui pointe vers src/
```

- [ ] **Step 5: Commit**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "feat: add Puck landing page builder with Upscale blocks"
```

---

### Task 11: Verification finale

- [ ] **Step 1: Build**

```bash
cd /Users/wassim/Projets/upscale
npm run build 2>&1 | tail -20
```

Si erreurs de build : les corriger (probablement des imports manquants pour Puck ou des references a des composants UPSCALE dans les blocs landing).

- [ ] **Step 2: Verification manuelle des mentions UPSCALE**

```bash
cd /Users/wassim/Projets/upscale
# Recherche large
grep -ri "off.market\|off market" src/ public/ --include="*.ts" --include="*.tsx" --include="*.json" --include="*.css" | grep -v node_modules | grep -v ".next"
```

Expected: 0 resultats

- [ ] **Step 3: Nettoyage**

```bash
cd /Users/wassim/Projets/upscale
# Supprimer les fichiers temporaires
rm -f src/app/globals.css.upscale
# Garder _branding/ pour reference (ne pas supprimer)
```

- [ ] **Step 4: Commit final + push**

```bash
cd /Users/wassim/Projets/upscale
git add -A
git commit -m "chore: final cleanup after UPSCALE → UPSCALE migration"
git push --force origin main
```

Note: `--force` car on a completement remplace l'historique du code. A confirmer avec Wass avant le push.

---

## Recap des commits

1. `chore: replace codebase with UPSCALE fork` (Task 5)
2. `style: apply Upscale branding colors` (Task 5)
3. `style: replace fonts` (Task 6)
4. `chore: rebrand UPSCALE → UPSCALE` (Task 7)
5. `chore: update infra config` (Task 8)
6. `chore: replace logos and icons` (Task 9)
7. `feat: add Puck landing page builder` (Task 10)
8. `chore: final cleanup` (Task 11)
