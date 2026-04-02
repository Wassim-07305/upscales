# Progression Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplifier la section Progression client de 11 pages a 3 pages (Ma Progression, Journal & Suivi, Classement).

**Architecture:** Reutiliser les composants existants (XpBadges, GoalsContent, CheckinContent, JournalContent, Challenges, leaderboard). Recrire les 3 pages hub. Mettre a jour la navigation sidebar.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, hooks existants.

---

### Task 1: Mettre a jour la navigation client

**Files:**

- Modify: `src/lib/navigation.ts`

- [ ] **Step 1: Remplacer la section Progression dans clientNavigation**

Remplacer les items actuels de la section "Progression" par :

```typescript
// ── Progression ──
{
  name: "Ma Progression",
  href: "/client/progression",
  icon: Trophy,
  section: "Progression",
},
{ name: "Journal & Suivi", href: "/client/journal", icon: PenLine },
{ name: "Classement", href: "/client/leaderboard", icon: Crown },
```

Ajouter `PenLine` et `Crown` dans les imports lucide-react si pas deja presents.

Retirer `Communaute` de la section Progression (la deplacer dans Business ou la supprimer).

- [ ] **Step 2: Meme chose pour prospectNavigation**

Appliquer les memes changements a `prospectNavigation`.

- [ ] **Step 3: Ajouter les routes dans PROSPECT_ALLOWED_ROUTES**

Dans `src/app/client/layout.tsx`, ajouter `/client/leaderboard` dans `PROSPECT_ALLOWED_ROUTES` si pas deja present.

- [ ] **Step 4: Verifier le build**

Run: `npx tsc --noEmit 2>&1 | grep navigation`
Expected: aucune erreur dans navigation.ts

---

### Task 2: Recrire la page "Ma Progression" (`/client/progression`)

**Files:**

- Rewrite: `src/app/client/progression/page.tsx`

- [ ] **Step 1: Ecrire la nouvelle page**

La page est scrollable, sans onglets. 3 sections :

```tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useXp } from "@/hooks/use-xp";
import { useBadges } from "@/hooks/use-badges";
import { useCertificates } from "@/hooks/use-certificates";
import { useCoachingGoals } from "@/hooks/use-coaching-goals";
import { cn } from "@/lib/utils";
import { Star, Award, Lock, Target, CheckCircle, Trophy } from "lucide-react";
import type { Badge } from "@/types/gamification";
import { CATEGORY_CONFIG } from "@/types/gamification";

export default function ProgressionPage() {
  const { summary } = useXp();
  const { badges, earnedBadgeIds } = useBadges();
  const { data: certificates } = useCertificates();
  const { goals } = useCoachingGoals();

  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Ma Progression
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Niveau, badges et objectifs
        </p>
      </motion.div>

      {/* Section 1: Niveau & XP */}
      <motion.div variants={staggerItem}>
        <LevelCard summary={summary} />
      </motion.div>

      {/* Section 2: Badges & Certificats */}
      <motion.div variants={staggerItem}>
        <BadgesSection
          badges={badges ?? []}
          earnedIds={earnedBadgeIds}
          certificateCount={certificates?.length ?? 0}
        />
      </motion.div>

      {/* Section 3: Objectifs */}
      {activeGoals.length > 0 && (
        <motion.div variants={staggerItem}>
          <GoalsSection goals={activeGoals} />
        </motion.div>
      )}
    </motion.div>
  );
}
```

Puis implementer les 3 sous-composants dans le meme fichier :

**LevelCard** : Card blanche style admin avec niveau, barre XP, total XP, % vers prochain niveau.

**BadgesSection** : Titre "Badges & Certificats", grille 4-6 colonnes de badges (gagnes en couleur, verrouilles en gris). Les certificats apparaissent en premier comme badges speciaux avec icone Award.

**GoalsSection** : Titre "Objectifs actifs", liste des objectifs avec barre de progression et milestones cochables. Reutiliser la logique de `goals/page.tsx` (GoalCard simplifie).

- [ ] **Step 2: Verifier le rendu**

Run: `npm run build 2>&1 | tail -5`
Expected: build reussi, `/client/progression` dans la liste

---

### Task 3: Recrire la page "Journal & Suivi" (`/client/journal`)

**Files:**

- Rewrite: `src/app/client/journal/page.tsx`

- [ ] **Step 1: Ecrire la nouvelle page avec 2 onglets**

```tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

const JournalContent = dynamic(
  () => import("@/app/client/journal/journal-content"),
  { ssr: false },
);
const CheckinContent = dynamic(() => import("@/app/client/checkin/page"), {
  ssr: false,
});

type Tab = "journal" | "checkin";

const TABS: { key: Tab; label: string }[] = [
  { key: "journal", label: "Journal" },
  { key: "checkin", label: "Check-in hebdo" },
];

export default function JournalSuiviPage() {
  const [tab, setTab] = useState<Tab>("journal");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Journal & Suivi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reflexions quotidiennes et bilan hebdomadaire
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-0 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-10 px-4 text-sm font-medium transition-all relative",
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        {tab === "journal" && <JournalContent />}
        {tab === "checkin" && <CheckinContent />}
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Renommer le contenu journal existant**

Le fichier `journal/page.tsx` actuel (12K lignes) contient le composant journal. Il faut le renommer/extraire pour que la nouvelle page puisse l'importer sans conflit circular.

Creer `src/app/client/journal/journal-content.tsx` qui exporte le composant journal existant (copier/deplacer l'export default de l'ancien `page.tsx`).

Alternative plus simple : puisque l'ancien page.tsx exporte un composant default, on peut l'importer directement si on change l'import path. Verifier si le dynamic import fonctionne.

- [ ] **Step 3: Verifier le build**

Run: `npm run build 2>&1 | grep journal`
Expected: `/client/journal` dans la liste, pas d'erreur

---

### Task 4: Recrire la page "Classement" (`/client/leaderboard`)

**Files:**

- Rewrite: `src/app/client/leaderboard/page.tsx`

- [ ] **Step 1: Ecrire la nouvelle page avec Hall of Fame encart + 2 onglets**

Structure :

1. Header "Classement"
2. Encart Hall of Fame compact (top 3-5 performers)
3. Onglets "Classement" | "Defis"

```tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useHallOfFame } from "@/hooks/use-hall-of-fame";
import { formatCurrency } from "@/lib/utils";
import { Crown, Star } from "lucide-react";
import Image from "next/image";

const LeaderboardContent = dynamic(
  () => import("@/app/client/leaderboard/leaderboard-content"),
  { ssr: false },
);
const ChallengesContent = dynamic(
  () => import("@/app/client/challenges/page"),
  { ssr: false },
);

type Tab = "classement" | "defis";

const TABS: { key: Tab; label: string }[] = [
  { key: "classement", label: "Classement" },
  { key: "defis", label: "Defis" },
];

export default function ClassementPage() {
  const [tab, setTab] = useState<Tab>("classement");
  const { data: hallOfFame } = useHallOfFame();

  const topPerformers = (hallOfFame ?? []).slice(0, 5);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Classement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rankings, defis et hall of fame
        </p>
      </motion.div>

      {/* Hall of Fame encart */}
      {topPerformers.length > 0 && (
        <motion.div variants={staggerItem}>
          <HallOfFameBanner performers={topPerformers} />
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-0 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-10 px-4 text-sm font-medium transition-all relative",
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={staggerItem}>
        {tab === "classement" && <LeaderboardContent />}
        {tab === "defis" && <ChallengesContent />}
      </motion.div>
    </motion.div>
  );
}
```

Implementer `HallOfFameBanner` dans le meme fichier : bandeau horizontal avec les avatars + noms + CA des top performers, style compact.

- [ ] **Step 2: Extraire le contenu leaderboard existant**

Le fichier `leaderboard/page.tsx` actuel (750 lignes) doit etre renomme/extrait en `leaderboard-content.tsx` pour eviter le conflit avec la nouvelle page.

Creer `src/app/client/leaderboard/leaderboard-content.tsx` avec le contenu existant du leaderboard (individual rankings, competitions, teams).

- [ ] **Step 3: Verifier le build**

Run: `npm run build 2>&1 | grep leaderboard`
Expected: `/client/leaderboard` dans la liste, pas d'erreur

---

### Task 5: Nettoyage final

**Files:**

- Modify: `src/lib/navigation.ts` (deja fait en Task 1)
- Modify: `src/app/client/layout.tsx` (ajouter routes prospect)

- [ ] **Step 1: Verifier que les anciennes routes ne 404 pas**

Les pages `/client/gamification`, `/client/progress`, `/client/goals`, `/client/certificates`, `/client/hall-of-fame`, `/client/rewards`, `/client/challenges`, `/client/checkin` restent accessibles (fichiers non supprimes) mais ne sont plus dans la sidebar.

- [ ] **Step 2: Build complet**

Run: `npm run build 2>&1 | tail -10`
Expected: build reussi

- [ ] **Step 3: Verifier la navigation en dev**

Run: `npm run dev`
Verifier dans le navigateur :

- Sidebar client montre 3 items dans Progression
- `/client/progression` affiche niveau + badges + objectifs
- `/client/journal` affiche 2 onglets (Journal, Check-in)
- `/client/leaderboard` affiche Hall of Fame encart + 2 onglets (Classement, Defis)
