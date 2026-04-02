# UPSCALE — Redesign "Premium Warm"

Full redesign de l'interface interne pour supprimer le look "AI-generated" et amener le niveau de polish de l'onboarding a l'interieur de l'app.

**Direction** : Premium Warm (style B) — hierarchie forte, gradients rouges subtils, typographie a caractere, animations fluides.

**Scope** : Shell (sidebar + header) + Dashboard (5 roles) + 5 pages (Clients, Messagerie, School, Pipeline, Billing) + tokens globaux + animations.

**Contrainte** : `#AF0000` reste la couleur primary. Ne rien casser fonctionnellement.

**Architecture** : Next.js 16 App Router. 5 roles avec dossiers dedies dans `src/app/` : `admin`, `coach`, `sales`, `client`, `prospect`. Pages partagees dans `src/app/_shared-pages/`.

---

## 1. Design Tokens

### Typographie

- **Body** : Inter (deja en place via `next/font/google` dans `src/app/layout.tsx`, variable `--font-inter`). Supprimer Satoshi des fallbacks CSS.
- **Display/Headings** : Instrument Serif (Google Fonts, gratuite). Ajouter dans `src/app/layout.tsx` via `Instrument_Serif` de `next/font/google`, variable `--font-display`. Pour les titres de page, greetings, headings h1/h2.
- **Mono** : JetBrains Mono (inchange, deja via `next/font/google`, variable `--font-jetbrains`).
- **Fallback chain** : `var(--font-display), Georgia, serif` pour display. `var(--font-inter), system-ui, sans-serif` pour body.
- **CSS** : Dans `src/app/globals.css`, ajouter `--font-sans: var(--font-inter), system-ui, sans-serif;` et `--font-heading: var(--font-instrument), Georgia, serif;`. Supprimer les references a Satoshi.
- **Note** : La variable `next/font` pour Instrument Serif doit s'appeler `--font-instrument` (pas `--font-display` pour eviter une reference circulaire). La variable CSS utilitaire `--font-heading` pointe vers `var(--font-instrument)`.

### Palette dark mode

```css
--background: #09090b; /* inchange */
--surface: #0f0f11; /* cards, panels — plus sombre que l'actuel #111113 */
--surface-hover: #141416; /* hover state des cards */
--border: #1a1a1e; /* plus subtil que #27272A */
--border-hover: #27272a; /* bordure au hover */
--muted: #3f3f46; /* labels, placeholders */
--muted-foreground: #71717a; /* inchange */
--foreground: #fafafa; /* inchange */

--primary: #af0000; /* inchange */
--primary-hover: #8b0000; /* inchange */
--primary-glow: rgba(175, 0, 0, 0.15); /* NOUVEAU — fonds hero */
--primary-glow-subtle: rgba(175, 0, 0, 0.05); /* NOUVEAU — fin du gradient */

--sidebar-bg: #0a0a0c; /* NOUVEAU — plus sombre que le contenu */
--sidebar-border: #141417; /* NOUVEAU */

--success: #22c55e;
--warning: #f59e0b;
--destructive: #ef4444;
```

### Shadows

Simplification radicale :

```css
--shadow-none: none; /* defaut pour tout */
--shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.15); /* cards au hover uniquement */
--shadow-elevated: 0 8px 30px rgba(0, 0, 0, 0.25); /* modals, dropdowns, popovers */
```

Tout le reste utilise des bordures 1px `var(--border)`.

### Border-radius

```css
--radius-sm: 4px; /* badges, small pills */
--radius-md: 8px; /* inputs, buttons, nav items, cards */
--radius-lg: 12px; /* modals, large cards */
--radius-xl: 16px; /* page-level containers */
--radius-full: 9999px; /* avatars, cercles */
```

Reduction globale : tout est plus sharp. `rounded-md` (8px) devient le defaut au lieu de `rounded-lg`.

### Spacing

Grille 4px/8px stricte : `4, 8, 12, 16, 24, 32, 48, 64`.

### Migration tokens existants

Le `globals.css` actuel utilise des tokens qui doivent etre remappes. Table de correspondance :

| Ancien token               | Nouveau token           | Action                                                                                    |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `--border-color`           | `--border`              | Renommer partout. Mettre a jour le bloc `@theme inline` : `--color-border: var(--border)` |
| `--primary-light`          | `--primary-glow`        | Renommer                                                                                  |
| `--primary-soft`           | `--primary-glow-subtle` | Renommer                                                                                  |
| `--surface-elevated`       | Supprime                | Utiliser `var(--surface)` + `var(--shadow-elevated)`                                      |
| `--accent`                 | Supprime                | Utiliser `var(--primary)` directement                                                     |
| `--accent-foreground`      | Supprime                | Utiliser `var(--foreground)`                                                              |
| `--color-success: #16a34a` | `--success: #22C55E`    | Changement intentionnel (green-500 plus lisible en dark)                                  |
| `--radius-2xl: 22px`       | Supprime                | Remplacer par `--radius-xl` (16px) dans les composants qui l'utilisent                    |

Le bloc `@theme inline` dans `globals.css` (Tailwind 4) doit etre mis a jour pour refleter tous les nouveaux tokens : `--color-primary-glow`, `--color-surface-hover`, `--color-sidebar-bg`, `--color-sidebar-border`, `--color-border-hover`. Supprimer les anciens tokens du bloc `@theme`.

---

## 2. Shell — Sidebar

### Layout

- Largeur : 200px (expanded), 56px (collapsed sur mobile/tablette).
- Fond : `var(--sidebar-bg)` (#0A0A0C) — plus sombre que le contenu.
- Bordure droite : 1px `var(--sidebar-border)`.
- Pas de gradient de fond (l'actuel `from-[#0C0E10] to-[#1A1D24]` est supprime).

### Structure

```
[Logo 26px + "UPSCALE" 12px semibold]
[Recherche ⌘K — champ inline, fond #111113, border #1A1A1E]
[Section "Principal"]
  Dashboard | Clients | Messagerie | Formations
[Separateur gradient horizontal]
[Section "Commercial"]
  Pipeline | Finances | Closer Calls
[Separateur gradient horizontal]
[Section "Outils"]
  Formulaires | Contrats | Analytics | IA
[Flex spacer]
[User: avatar 28px + nom + role + dot online]
```

### Nav items

- Padding : `7px 10px` (compact).
- Icones : 15px (Lucide, couleur `var(--muted)` au repos, `var(--foreground)` au hover).
- Font : 12px Inter, couleur `var(--muted-foreground)` au repos.
- Border-radius : 8px.
- Gap icone-label : 8px.
- **Active state** : `background: linear-gradient(135deg, var(--primary-glow), var(--primary-glow-subtle))`. Texte `var(--foreground)`. Icone `var(--primary)` a 80% opacity. Pas de border-left. Pas de inset shadow.
- **Hover state** : `background: rgba(255,255,255,0.04)`. Texte `var(--foreground)`.
- Transition : `background 150ms, color 150ms`.

### Section labels

- Font : 9px uppercase, letter-spacing 0.05em, couleur `var(--muted)`.
- Padding left : 8px.
- Margin bottom : 6px.

### Separateurs

```css
height: 1px;
background: linear-gradient(90deg, transparent, var(--border), transparent);
margin: 12px 8px;
```

### Badge notification

Cercle 16px, fond `var(--primary)`, texte blanc 9px bold, `border-radius: 50%`. Pas de pill.

### User footer

Bordure top 1px `var(--sidebar-border)`. Avatar 28px avec gradient `from-primary to-primary-hover`. Nom 11px medium. Role 9px muted. Dot online vert 6px a droite.

---

## 3. Shell — Header

### Layout

Plus de barre de recherche (elle est dans la sidebar).

```
[Breadcrumb: "Dashboard" en 11px muted]        [Theme toggle] [Notif bell]
[Titre: "Bonjour Admin" en display font 20px]
```

- Pas de sticky (le contenu scrolle naturellement).
- Pas de border-bottom (espace ouvert).
- Padding : `20px 24px` en haut de la zone contenu.
- Titre en `font-heading` (Instrument Serif), 20px, weight 700, letter-spacing -0.02em. Reutiliser/remplacer le composant existant `src/components/dashboard/GreetingHeader.tsx`.
- Icones header : 32px, fond `var(--surface)`, border `var(--border)`, radius 8px.

---

## 4. Dashboard

### Admin dashboard

```
[Header: breadcrumb + "Bonjour Admin" + actions]

[Hero Metric — Revenus du mois]
  Background: linear-gradient(135deg, var(--primary-glow), var(--primary-glow-subtle))
  Border: 1px solid rgba(175,0,0,0.12)
  Border-radius: 12px
  Contenu: Label "REVENUS DU MOIS" 9px uppercase primary | Montant 28px bold | "+12% vs mois dernier" 10px success | Sparkline area chart a droite (100px, stroke primary, fill gradient)

[3 Metriques secondaires — row flex gap-8px]
  Card: fond var(--surface), border var(--border), radius 8px, padding 12px
  Contenu: Label 9px muted uppercase | Valeur 18px bold
  Items: "Clients actifs: 47" | "Taux conversion: 34%" | "Appels prevus: 8"
  Hover: border-color var(--border-hover), translateY(-1px)

[Graphique principal — Revenus evolution]
  Recharts AreaChart, stroke var(--primary), fill gradient primary 30%→0%
  Fond: var(--surface), border var(--border), radius 12px
  Tooltip custom: fond var(--surface), border var(--border)

[Activite recente — feed timeline]
  Liste compacte avec dots colores (rouge = action, vert = paiement, bleu = formation)
  Items: avatar 24px + texte 12px + timestamp relatif
  Fond: var(--surface), border var(--border), radius 12px
```

### Coach dashboard (`src/app/coach/dashboard/page.tsx`)

Meme structure mais :

- Hero = "Clients actifs" au lieu de revenus.
- Metriques = Prochains appels, Taux completion formations, Messages non lus.
- Feed = activite de ses clients.

### Sales dashboard (`src/app/sales/dashboard/page.tsx`)

- Hero = "Pipeline total" avec montant + sparkline.
- Metriques = Appels aujourd'hui, Leads qualifies, Taux de closing.
- Feed = activite pipeline (nouveaux leads, appels completes, deals closes).

### Client dashboard (`src/app/client/dashboard/page.tsx`)

- Hero = "Ta progression" avec progress bar gradient rouge + pourcentage.
- Cards = Formation en cours, Prochain check-in, Objectifs actifs.
- Feed = messages du coach + activite communaute.

### Prospect dashboard (`src/app/prospect/dashboard/page.tsx`)

- Hero = "Decouvre UPSCALE" — diagnostic simplifie + CTA vers l'onboarding/quiz.
- Cards = Features verrouillees avec apercu (inchange structurellement, alignement tokens uniquement).
- Feed = activite communaute.

---

## 5. Pages internes

### Pattern commun

Chaque page suit :

```
[Header: breadcrumb + titre display font + sous-titre muted + actions]
[Hero element specifique a la page]
[Contenu principal (table, grid, ou feed)]
```

### Clients

- Hero : compteur clients actifs + sparkline evolution.
- Table principale : colonnes (Nom, Status badge, Revenu, Derniere activite).
- Table header sticky, rows avec hover background transition 100ms.
- Actions row : icones qui apparaissent au hover (edit, message, voir profil).
- Filtres inline au-dessus du tableau (input + select, pas de modal).

### Messagerie

- Pas de changement structural (pattern chat classique).
- Aligner les tokens : bulles radius 12px, fond messages recus `var(--surface)`, bordure subtile.
- Sidebar channels a gauche avec les memes section labels que la nav principale.

### School (formations) — `src/app/_shared-pages/school/page.tsx` + variantes par role

- Hero : progression globale (progress bar gradient rouge).
- Grid de modules : cards avec thumbnail, titre, nb lecons, barre de progression.
- Badge "Complete" en `var(--success)` a 10% opacity + texte success.

### Pipeline — `src/app/sales/pipeline/page.tsx`

- Hero : valeur totale pipeline en haut.
- Kanban board : colonnes par status (Premier contact → Qualifie → Appel → Close).
- Cards lead compactes : nom + montant + date. Fond `var(--surface)`.
- Drag indicators : bordure primary au survol de la zone de drop.
- Compteur par colonne dans le header.

### Billing (finances) — `src/app/admin/billing/page.tsx`

- Hero : composant revenus du mois (reutilise du dashboard).
- Onglets inline : Revenus / Couts / Echeanciers (composant Tabs, active = fond surface + border).
- Tableau principal pour chaque onglet.
- Graphique evolution revenus (meme composant que dashboard).

---

## 6. Animations & Micro-interactions

### Transitions de page

```tsx
// Au mount de chaque page
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
>
```

### Stagger listes

```tsx
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};
```

### Hover states

| Element       | Effet                           | Duration |
| ------------- | ------------------------------- | -------- |
| Card          | border-color + translateY(-1px) | 150ms    |
| Button active | scale(0.98)                     | instant  |
| Table row     | background-color                | 100ms    |
| Sidebar item  | background-color + color        | 150ms    |
| Link          | color                           | 100ms    |

### Skeleton loaders

- Shimmer cycle 1.5s, gradient anime gauche→droite.
- Reproduisent exactement le layout final (memes dimensions).
- Pas de `animate-pulse` (trop agressif).

### Feedback mutations

- Toast Sonner (inchange).
- Bouton submit : checkmark anime 1.5s apres succes.
- Compteurs KPI : subtle scale pulse quand la valeur change.

### Ce qu'on ne fait pas

- Pas de parallax ni scroll animations.
- Pas d'AnimatePresence entre routes (perf avec Next.js App Router).
- Pas de hover scale sur cards (fait template).
- Confetti reserve a l'onboarding uniquement.

---

## 7. Fichiers a modifier

### Tokens & fondations

- `src/app/layout.tsx` — Ajouter `Instrument_Serif` via `next/font/google`, exposer `--font-display`.
- `src/app/globals.css` — Nouvelles variables CSS (palette, shadows, radius, font-sans, font-display). Supprimer Satoshi. Definir tokens light mode correspondants.
- `src/lib/utils.ts` — Eventuels ajouts de helpers.

### Shell

- `src/components/layout/role-sidebar.tsx` — Redesign complet sidebar.
- `src/components/layout/header.tsx` — Simplification header.

### Dashboards (5 roles)

- `src/app/admin/dashboard/page.tsx` — Hero revenus + metriques equipe.
- `src/app/coach/dashboard/page.tsx` — Hero clients actifs + activite.
- `src/app/sales/dashboard/page.tsx` — Hero pipeline + appels.
- `src/app/client/dashboard/page.tsx` — Hero progression + prochaines etapes.
- `src/app/prospect/dashboard/page.tsx` — Alignement tokens uniquement (structure existante conservee).
- `src/app/_shared-pages/dashboard/page.tsx` — Aligner si utilise comme fallback.
- Nouveaux/remplaces dans `src/components/dashboard/` : `hero-metric.tsx` (remplace `stat-card.tsx` et `StatsCard.tsx`), `activity-feed.tsx` (remplace l'existant du meme nom), `metric-card.tsx` (remplace `mini-kpi.tsx` si existant). Les anciens composants (`stat-card.tsx`, `StatsCard.tsx`, etc.) sont supprimes apres migration. Le `GreetingHeader.tsx` existant est modifie pour utiliser `font-heading`.

### Pages internes

- `src/app/admin/clients/page.tsx` — Table redesign + hero.
- `src/app/_shared-pages/messaging/page.tsx` + variantes par role — Alignement tokens.
- `src/app/_shared-pages/school/page.tsx` + variantes par role — Hero progression + cards grid.
- `src/app/sales/pipeline/page.tsx` — Hero + kanban tokens.
- `src/app/admin/billing/page.tsx` — Hero + onglets inline.

### Composants UI

- `src/components/ui/card.tsx` — Nouveaux tokens.
- `src/components/ui/button.tsx` — Radius ajuste.
- `src/components/ui/badge.tsx` — Nouvelles variantes.
- `src/components/ui/skeleton.tsx` — Shimmer ameliore.
- `src/components/ui/tabs.tsx` — Style inline compact.

### Animations (nouveaux composants)

- `src/components/ui/page-transition.tsx` — Wrapper Framer Motion fadeIn + translateY.
- `src/components/ui/stagger-list.tsx` — Container + item variants pour listes animees.

---

## 8. Light mode

Les tokens dark mode definis en section 1 doivent avoir des equivalents light mode dans `:root`. Principes :

- `--background` : `#FDFCFB` (inchange)
- `--surface` : `#FFFFFF` → `#FAFAFA` (leger ajustement)
- `--border` : `#E4E4E7` → `#EBEBEE` (un poil plus subtil)
- `--primary` : `#AF0000` (identique light et dark)
- `--primary-glow` : `rgba(175, 0, 0, 0.08)` (plus subtil en light)
- `--sidebar-bg` : `#F5F5F6` (gris tres clair, plus sombre que le contenu blanc)

Tokens light manquants a definir aussi :

- `--surface-hover` : `#F0F0F2`
- `--border-hover` : `#D4D4D8`
- `--sidebar-border` : `#E8E8EB`
- `--muted` : `#A1A1AA`
- `--shadow-hover` : `0 2px 8px rgba(0,0,0,0.06)` (plus leger qu'en dark)
- `--shadow-elevated` : `0 8px 30px rgba(0,0,0,0.1)`

Le theme toggle existant continue de fonctionner via la classe `.dark`.

### Responsive sidebar

- `>= 1024px (lg)` : sidebar expanded 200px.
- `768px - 1023px (md)` : sidebar collapsed 56px (icones only, tooltips au hover).
- `< 768px (sm)` : sidebar masquee, hamburger dans le header, bottom nav pour navigation principale.
- **Recherche sur mobile** : le ⌘K est accessible via l'icone loupe dans le header mobile (ouvre le CommandPalette existant).

---

## 9. Ce qui ne change PAS

- Logique metier, hooks, mutations, queries — zero changement.
- Routing (Next.js App Router) — inchange.
- Permissions (RoleGuard, permissions.ts) — inchange.
- Supabase (RLS, subscriptions) — inchange.
- Onboarding — inchange (c'est deja bien).
- PWA config — inchange.
- Mobile bottom nav — alignement tokens uniquement.
