# Redesign "Premium Warm" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer le look "AI-generated" de l'app Off-Market en appliquant le design "Premium Warm" — hierarchie forte, typographie a caractere, gradients rouges subtils, animations fluides.

**Architecture:** Next.js 16 App Router, 5 roles (admin/coach/sales/client/prospect) avec dossiers dedies dans `src/app/`. UI components dans `src/components/ui/`, dashboard widgets dans `src/components/dashboard/`. Tailwind CSS 4 avec `@theme inline` dans `globals.css`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts, Lucide React, Sonner, next/font/google.

**Spec:** `docs/superpowers/specs/2026-03-19-redesign-premium-warm-design.md`

---

## Task 1: Design Tokens & Typographie

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Ajouter Instrument Serif dans layout.tsx**

Dans `src/app/layout.tsx`, ajouter l'import et la config de la font :

```tsx
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});
```

Ajouter la variable CSS dans le `<body>` className :

```tsx
<body className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}>
```

- [ ] **Step 2: Mettre a jour les tokens CSS dans globals.css**

Dans `src/app/globals.css`, remplacer les tokens de typographie :

```css
--font-sans: var(--font-inter), system-ui, sans-serif;
--font-heading: var(--font-instrument), Georgia, serif;
--font-mono: var(--font-jetbrains), ui-monospace, monospace;
```

Supprimer toutes les references a Satoshi (`"Satoshi"` dans les fallbacks).

- [ ] **Step 3: Mettre a jour la palette dark mode**

Dans le bloc `.dark` de `globals.css`, remplacer/ajouter :

```css
--background: #09090b;
--surface: #0f0f11;
--surface-hover: #141416;
--border: #1a1a1e;
--border-hover: #27272a;
--primary: #af0000;
--primary-hover: #8b0000;
--primary-glow: rgba(175, 0, 0, 0.15);
--primary-glow-subtle: rgba(175, 0, 0, 0.05);
--sidebar-bg: #0a0a0c;
--sidebar-border: #141417;
--success: #22c55e;
--warning: #f59e0b;
--destructive: #ef4444;
```

- [ ] **Step 4: Mettre a jour la palette light mode**

Dans le bloc `:root` de `globals.css` :

```css
--surface: #fafafa;
--surface-hover: #f0f0f2;
--border: #ebebee;
--border-hover: #d4d4d8;
--primary-glow: rgba(175, 0, 0, 0.08);
--primary-glow-subtle: rgba(175, 0, 0, 0.03);
--sidebar-bg: #f5f5f6;
--sidebar-border: #e8e8eb;
```

- [ ] **Step 5: Mettre a jour shadows et radius**

```css
/* Shadows — simplification */
--shadow-none: none;
--shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.15);
--shadow-elevated: 0 8px 30px rgba(0, 0, 0, 0.25);

/* Light mode shadows */
:root {
  --shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-elevated: 0 8px 30px rgba(0, 0, 0, 0.1);
}

/* Radius — plus sharp */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

Supprimer `--radius-2xl`, `--shadow-xs`, `--shadow-card`, `--shadow-card-hover`, `--shadow-glow`.

- [ ] **Step 6: Migrer les anciens tokens**

Faire un search-and-replace dans tous les fichiers :

- `--border-color` → `--border`
- `--primary-light` → `--primary-glow`
- `--primary-soft` → `--primary-glow-subtle`
- `--surface-elevated` → `--surface` (+ shadow-elevated si en elevation)
- `--accent` → `--primary`
- `--accent-foreground` → `--foreground`
- `--radius-2xl` → `--radius-xl`

- [ ] **Step 7: Mettre a jour le bloc @theme inline**

Dans `globals.css`, mettre a jour le bloc `@theme inline` pour refleter les nouveaux tokens Tailwind :

```css
@theme inline {
  --color-primary-glow: var(--primary-glow);
  --color-surface-hover: var(--surface-hover);
  --color-sidebar-bg: var(--sidebar-bg);
  --color-sidebar-border: var(--sidebar-border);
  --color-border-hover: var(--border-hover);
}
```

Supprimer les tokens obsoletes du bloc `@theme`.

- [ ] **Step 8: Verifier le build**

```bash
npm run build
```

Expected: Build reussit sans erreurs TypeScript. Les tokens CSS sont correctement resolus.

- [ ] **Step 9: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: design tokens Premium Warm — typographie, palette, shadows, radius"
```

---

## Task 2: Composants UI de base

**Files:**

- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/page-transition.tsx`
- Create: `src/components/ui/stagger-list.tsx`

- [ ] **Step 1: Creer page-transition.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Creer stagger-list.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Mettre a jour card.tsx**

Aligner les tokens : remplacer les anciens radius, borders, shadows par les nouveaux. Le card doit utiliser `var(--surface)` pour le fond, `var(--border)` pour la bordure, `var(--radius-md)` (8px) pour le radius par defaut. Hover state : `border-color: var(--border-hover)` + `translateY(-1px)` + `transition: all 150ms`.

- [ ] **Step 4: Mettre a jour button.tsx**

Remplacer le radius par `var(--radius-md)` (8px). Verifier que le active state utilise `scale(0.98)`.

- [ ] **Step 5: Mettre a jour badge.tsx**

Radius `var(--radius-sm)` (4px). Verifier les variantes success/warning/destructive avec les nouvelles couleurs.

- [ ] **Step 6: Mettre a jour skeleton.tsx**

Remplacer `animate-pulse` par un shimmer custom si pas deja fait. Cycle 1.5s, gradient gauche→droite.

- [ ] **Step 7: Mettre a jour tabs.tsx**

Active tab : fond `var(--surface)` + bordure `var(--border)`. Radius `var(--radius-md)`.

- [ ] **Step 8: Verifier le build**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/
git commit -m "feat: UI components alignes sur tokens Premium Warm + page-transition + stagger-list"
```

---

## Task 3: Shell — Sidebar

**Files:**

- Modify: `src/components/layout/role-sidebar.tsx`

- [ ] **Step 1: Lire le fichier actuel**

Lire `src/components/layout/role-sidebar.tsx` en entier pour comprendre la structure existante (nav items, roles, sections, collapse logic, etc.).

- [ ] **Step 2: Redesign le fond et la structure**

- Fond : `bg-[var(--sidebar-bg)]` (pas de gradient).
- Bordure droite : `border-r border-[var(--sidebar-border)]`.
- Largeur : 200px expanded, 56px collapsed.
- Padding : `16px 10px`.

- [ ] **Step 3: Ajouter la recherche inline**

Ajouter un champ recherche en haut de la sidebar (apres le logo) :

```tsx
<div className="mx-1 my-2 flex items-center gap-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1.5">
  <Search className="h-3.5 w-3.5 text-[var(--muted)]" />
  <span className="text-[10px] text-[var(--muted)]">Rechercher...</span>
  <kbd className="ml-auto text-[8px] text-[var(--muted)] bg-[var(--border)] px-1 py-0.5 rounded font-mono">
    ⌘K
  </kbd>
</div>
```

Le clic ouvre le CommandPalette existant.

- [ ] **Step 4: Grouper les nav items par sections**

Ajouter des section labels (`Principal`, `Commercial`, `Outils`) et des separateurs gradient entre les groupes. Labels en 9px uppercase, couleur muted, letter-spacing 0.05em.

- [ ] **Step 5: Redesign les nav items**

- Padding : `7px 10px`.
- Icones : 15px, couleur muted au repos.
- Font : 12px, couleur muted-foreground au repos.
- Radius : 8px.
- Active : `bg-gradient-to-br from-[var(--primary-glow)] to-[var(--primary-glow-subtle)]`.
- Hover : `bg-white/[0.04]`.
- Supprimer le `border-left-3px`, le `inset shadow`, et le `rounded-xl` (14px→8px).

- [ ] **Step 6: Badge notification en cercle**

Remplacer le badge pill par un cercle 16px rouge.

- [ ] **Step 7: User footer compact**

Avatar 28px, nom 11px medium, role 9px muted, dot online vert 6px. Bordure top `var(--sidebar-border)`.

- [ ] **Step 8: Verifier visuellement + build**

```bash
npm run build && npm run dev
```

Ouvrir le navigateur et verifier la sidebar sur les 5 roles.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/role-sidebar.tsx
git commit -m "feat: sidebar Premium Warm — compact, sections, recherche inline, gradient active state"
```

---

## Task 4: Shell — Header

**Files:**

- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Lire le fichier actuel**

Lire `src/components/layout/header.tsx` en entier.

- [ ] **Step 2: Simplifier le header**

- Supprimer la barre de recherche (elle est dans la sidebar maintenant).
- Structure : breadcrumb (11px muted) a gauche, icones (theme toggle + notif) a droite.
- Sous le breadcrumb : titre de page en `font-heading` (Instrument Serif), 20px bold.
- Pas de sticky, pas de border-bottom.
- Sur mobile (`< md`), garder le hamburger + ajouter icone loupe pour ouvrir CommandPalette.

- [ ] **Step 3: Appliquer font-heading au GreetingHeader**

Modifier `src/components/dashboard/GreetingHeader.tsx` pour utiliser `font-[var(--font-heading)]` sur le greeting.

- [ ] **Step 4: Verifier visuellement + build**

```bash
npm run build && npm run dev
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/header.tsx src/components/dashboard/GreetingHeader.tsx
git commit -m "feat: header simplifie + font-heading sur greeting"
```

---

## Task 5: Dashboard — Composants partages

**Files:**

- Create: `src/components/dashboard/hero-metric.tsx`
- Create: `src/components/dashboard/metric-card.tsx`
- Modify: `src/components/dashboard/activity-feed.tsx`

- [ ] **Step 1: Creer hero-metric.tsx**

Le composant hero avec gradient rouge pour la metrique principale :

```tsx
interface HeroMetricProps {
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
  sparklineData?: number[];
}
```

- Fond : `linear-gradient(135deg, var(--primary-glow), var(--primary-glow-subtle))`.
- Bordure : `1px solid rgba(175,0,0,0.12)`.
- Radius : 12px.
- Label : 9px uppercase, couleur primary.
- Valeur : 28px bold.
- Change : 10px, couleur success/destructive.
- Sparkline SVG a droite (optionnel).

- [ ] **Step 2: Creer metric-card.tsx**

Card compacte pour les metriques secondaires :

```tsx
interface MetricCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
}
```

- Fond : `var(--surface)`, bordure `var(--border)`, radius 8px, padding 12px.
- Label : 9px muted uppercase. Valeur : 18px bold.
- Hover : border-color hover + translateY(-1px).

- [ ] **Step 3: Redesign activity-feed.tsx**

Moderniser le feed existant avec :

- Timeline dots colores (rouge=action, vert=paiement, bleu=formation).
- Items : avatar 24px + texte 12px + timestamp relatif.
- Fond `var(--surface)`, bordure, radius 12px.

- [ ] **Step 4: Verifier le build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/hero-metric.tsx src/components/dashboard/metric-card.tsx src/components/dashboard/activity-feed.tsx
git commit -m "feat: composants dashboard Premium Warm — hero-metric, metric-card, activity-feed"
```

---

## Task 6: Dashboard — Pages par role

**Files:**

- Modify: `src/app/admin/dashboard/page.tsx`
- Modify: `src/app/coach/dashboard/page.tsx`
- Modify: `src/app/sales/dashboard/page.tsx`
- Modify: `src/app/client/dashboard/page.tsx`
- Modify: `src/app/prospect/dashboard/page.tsx`

- [ ] **Step 1: Lire les 5 dashboards actuels**

Lire chaque fichier pour comprendre les composants utilises et les donnees affichees.

- [ ] **Step 2: Redesign admin dashboard**

Structure : PageTransition wrapper → GreetingHeader (font-heading) → HeroMetric (revenus) → 3 MetricCards (clients, conversion, appels) en StaggerList → Graphique principal (AreaChart revenus) → ActivityFeed.

Supprimer les stat-cards generiques en haut. Remplacer par le hero + metriques secondaires.

- [ ] **Step 3: Redesign coach dashboard**

Hero = "Clients actifs" en HeroMetric. MetricCards = Prochains appels, Completion formations, Messages non lus. Feed = activite clients.

- [ ] **Step 4: Redesign sales dashboard**

Hero = "Pipeline total" en HeroMetric. MetricCards = Appels aujourd'hui, Leads qualifies, Taux closing. Feed = activite pipeline.

- [ ] **Step 5: Redesign client dashboard**

Hero = "Ta progression" avec progress bar gradient. MetricCards = Formation en cours, Prochain check-in, Objectifs. Feed = messages coach + communaute.

- [ ] **Step 6: Aligner prospect dashboard**

Alignement tokens uniquement (pas de restructuration). Appliquer PageTransition + nouveaux tokens de couleur/radius.

- [ ] **Step 7: Verifier visuellement les 5 dashboards**

```bash
npm run dev
```

Se connecter avec chaque role et verifier le rendu.

- [ ] **Step 8: Build check**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/dashboard/ src/app/coach/dashboard/ src/app/sales/dashboard/ src/app/client/dashboard/ src/app/prospect/dashboard/ src/app/_shared-pages/dashboard/
git commit -m "feat: dashboards 5 roles — hero metric, hierarchie forte, stagger animations"
```

---

## Task 7: Pages internes — Clients + Billing

**Files:**

- Modify: `src/app/admin/clients/page.tsx` (ou le composant qu'il importe)
- Modify: `src/app/admin/billing/page.tsx` (ou le composant qu'il importe)

- [ ] **Step 1: Lire les pages actuelles**

Lire les fichiers et identifier les composants importes.

- [ ] **Step 2: Clients — ajouter hero + aligner tokens**

- Ajouter PageTransition wrapper.
- Ajouter hero compteur clients + sparkline.
- Table : header sticky, row hover 100ms, actions contextuelles au hover.
- Filtres inline au-dessus du tableau.
- Aligner tous les tokens (radius, borders, colors).

- [ ] **Step 3: Billing — ajouter hero + onglets**

- Ajouter PageTransition wrapper.
- HeroMetric revenus du mois (reutiliser le composant).
- Onglets inline (Revenus/Couts/Echeanciers) avec le tabs redesigned.
- Aligner tokens.

- [ ] **Step 4: Build check**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/clients/ src/app/admin/billing/
git commit -m "feat: pages Clients + Billing — hero metric, tokens Premium Warm"
```

---

## Task 8: Pages internes — School + Pipeline + Messaging

**Files:**

- Modify: `src/app/_shared-pages/school/page.tsx` (+ composants importes)
- Modify: `src/app/sales/pipeline/page.tsx` (+ composants importes)
- Modify: `src/app/_shared-pages/messaging/page.tsx` (+ composants importes)

- [ ] **Step 1: School — hero progression + cards grid**

- PageTransition wrapper.
- Hero : progression globale avec progress bar gradient rouge.
- Cards modules : fond surface, border, radius 8px, badge "Complete" en success 10%.
- Aligner tokens.

- [ ] **Step 2: Pipeline — hero + kanban tokens**

- PageTransition wrapper.
- Hero : valeur totale pipeline.
- Kanban : cards lead avec fond surface, border, radius 8px.
- Drag indicators : bordure primary au drop.
- Aligner tokens.

- [ ] **Step 3: Messaging — alignement tokens**

- Pas de changement structural.
- Bulles radius 12px, fond messages recus `var(--surface)`, bordure subtile.
- Aligner tokens.

- [ ] **Step 4: Build check**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/_shared-pages/school/ src/app/sales/pipeline/ src/app/_shared-pages/messaging/
git commit -m "feat: pages School + Pipeline + Messaging — tokens Premium Warm"
```

---

## Task 9: Nettoyage + verification finale

**Files:**

- Potentiellement tous les fichiers modifies

- [ ] **Step 1: Supprimer les composants dashboard obsoletes**

Supprimer `stat-card.tsx` et `stats-card.tsx` si plus utilises (remplaces par `hero-metric.tsx` et `metric-card.tsx`). Verifier qu'aucun import ne reference les anciens.

- [ ] **Step 2: Grep pour tokens obsoletes**

```bash
grep -rn "border-color\|primary-light\|primary-soft\|surface-elevated\|accent-foreground\|radius-2xl\|shadow-xs\|shadow-card\|shadow-glow\|Satoshi" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Corriger tout ce qui reste.

- [ ] **Step 3: Build final**

```bash
npm run build
```

Expected: zero erreurs.

- [ ] **Step 4: Test visuel complet**

```bash
npm run dev
```

Verifier :

- [ ] Sidebar : 5 roles, sections, recherche, active state gradient, collapse mobile
- [ ] Header : greeting font-heading, pas de barre de recherche
- [ ] Dashboard admin : hero metric, 3 cards, graphique, feed
- [ ] Dashboard coach : hero clients, metriques
- [ ] Dashboard sales : hero pipeline
- [ ] Dashboard client : hero progression
- [ ] Dashboard prospect : tokens alignes
- [ ] Page Clients : hero + table
- [ ] Page Billing : hero + onglets
- [ ] Page School : hero progression + cards
- [ ] Page Pipeline : hero + kanban
- [ ] Page Messaging : tokens alignes
- [ ] Light mode : tous les tokens resolus
- [ ] Dark mode : tous les tokens resolus
- [ ] Mobile : sidebar collapse, bottom nav, hamburger

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: nettoyage tokens obsoletes + verification finale redesign Premium Warm"
```
