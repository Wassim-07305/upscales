# Workbooks — Design Spec

## Contexte

UPSCALE utilise des workbooks hébergés sur Lovable et Tally pour accompagner les formations. L'objectif est d'intégrer les workbooks directement dans la plateforme, en réutilisant le système de formulaires existant.

## Approche

Un workbook est un formulaire enrichi avec `type: 'workbook'`. On réutilise le builder, le store, les hooks, les tables et le rendu existants. On ajoute 3 nouveaux types de champs et un rendu public alternatif.

## Modèle de données

### Table `forms` — nouvelle colonne

- `type` TEXT NOT NULL DEFAULT `'form'` — valeurs : `'form'` | `'workbook'`

### Table `form_fields` — 3 nouveaux `field_type`

**`step`** — séparateur d'étape numéroté (numéro auto-calculé dans le rendu selon l'ordre des steps)

- `label` = titre de l'étape (ex: "Identifier une frustration majeure")
- `description` = sous-titre (ex: "La base de ton marché UPSCALE")
- `options` JSONB = `{ content: "texte explicatif long en markdown" }`
- Non remplissable — structure pure

**`callout`** — bloc encadré lecture seule

- `label` = titre du callout (ex: "Pourquoi c'est essentiel ?")
- `description` = contenu texte
- `options` JSONB = `{ variant: "warning" | "info" | "tip" }`
  - `warning` = bordure rouge, fond rouge pâle
  - `info` = bordure bleue, fond bleu pâle
  - `tip` = bordure grise, fond gris pâle
- Non remplissable — contenu statique

**`checklist`** — mini-checklist de validation

- `label` = titre (ex: "Mini-checklist de validation")
- `options` = array `[{ label: "J'ai identifié une frustration claire", value: "item_1" }, ...]`
- Remplissable — la réponse dans `form_submissions.answers` = array des values cochées

Pas de nouvelle table. Les soumissions restent dans `form_submissions` avec le format `answers` JSONB existant.

## Builder (côté admin)

### Template Gallery

- Deux onglets en haut : **Formulaires** | **Workbooks**
- L'onglet Workbooks montre les templates workbook + bouton "Créer de zéro"
- Créer un workbook → formulaire créé avec `type: 'workbook'`

### Form Builder

- Quand `type === 'workbook'`, la sidebar affiche une catégorie supplémentaire **"Structure Workbook"** avec : Etape, Callout, Checklist
- Les champs classiques (short_text, long_text, rating, etc.) restent disponibles pour les questions
- Editeur pour `step` : champs titre, sous-titre, textarea contenu explicatif
- Editeur pour `callout` : champs titre, contenu, select variante (Alerte / Info / Conseil)
- Editeur pour `checklist` : champs titre + liste d'items éditable (ajouter/supprimer)
- Preview mode affiche le rendu workbook scrollable au lieu du rendu formulaire progressif

### Store (`form-builder-store.ts`)

- Ajout `type: 'form' | 'workbook'` au state
- `loadForm()` charge le type depuis la DB

### Hooks

Pas de changement — `createForm`, `updateForm`, `saveFields` fonctionnent déjà avec n'importe quel field_type.

## Rendu public (`/f/[formId]`)

Le composant détecte `form.type` :

- `'form'` → rendu actuel inchangé (1 question/écran, transitions animées)
- `'workbook'` → rendu workbook scrollable décrit ci-dessous

### Structure de la page workbook

**1. Couverture** (haut de page)

- Badge statique "Workbook Premium"
- Titre du workbook (gros, bold, style UPSCALE rouge)
- Description du workbook
- Fond blanc, centré, aéré

**2. Section infos perso**

- Les champs avant le premier `step` sont groupés dans un bloc card arrondie "Tes informations"
- Rendu classique des champs (inputs, selects, etc.)

**3. Etapes**

- Chaque `step` crée une section card avec :
  - Numéro circulaire rouge (1, 2, 3...) auto-calculé
  - Titre + sous-titre
  - Contenu explicatif (paragraphes)
- Les champs entre deux `step` sont rendus dans cette étape :
  - `short_text` / `long_text` → accordéons dépliables (icône + label, zone de saisie au clic)
  - `callout` → bloc encadré avec bordure gauche colorée
  - `checklist` → bloc fond jaune/beige avec checkboxes
  - Autres champs (rating, select, etc.) → rendu standard

**4. Section finale**

- Dernier `checklist` sans `step` parent → affiché comme "Tableau final" de validation
- Bouton "Envoyer le workbook" (rouge UPSCALE, pleine largeur)

**Responsive** : max-width 720px centré, adapté mobile.

**Pas de sauvegarde intermédiaire** — soumission unique à la fin.

## Liste des formulaires (admin)

- Badge "Formulaire" ou "Workbook" sur chaque card pour différencier visuellement
- Tab ou filtre pour montrer uniquement les workbooks
- Le reste est identique (stats, actions)

## Affichage des soumissions (admin)

- Pour un workbook, les réponses sont groupées visuellement par étape (en utilisant les champs `step` comme séparateurs)
- Les `checklist` affichent les items cochés/non cochés
- Les `callout` et `step` (contenu statique) ne sont pas affichés dans les réponses
- Analytics et export fonctionnent comme les formulaires classiques

## Templates pré-construits

3 templates workbook dans `form-templates.ts` basés sur les workbooks Lovable existants :

1. **Workbook Marché** — 5 étapes (frustration, segment, mécanisme, catégorie, éducation) avec checklist par étape + tableau final
2. **Workbook Offre** — étapes de construction d'offre (mécanisme, issue rêvée, mapping, bonus, pricing)
3. **Workbook Communication** — étapes de communication d'offre

Le contenu exact des questions sera extrait des workbooks Lovable existants.

## Hors scope (V1)

- Pas de badges configurables sur la couverture
- Pas de boutons CTA dans les étapes
- Pas de sauvegarde brouillon (soumission unique)
- Pas de retour/modification après soumission
- Pas d'export Markdown/PDF du workbook rempli

## Fichiers impactés

### Migration SQL

- `supabase/migrations/XXXX_add_workbook_type.sql` — ALTER TABLE forms ADD COLUMN type, ajout des nouveaux field_types dans les contraintes si applicable

### Modifications

- `src/stores/form-builder-store.ts` — ajout `type` au state
- `src/app/_shared-pages/forms/builder/page.tsx` — catégorie "Structure Workbook" + éditeurs step/callout/checklist + preview workbook
- `src/app/f/[formId]/page.tsx` — détection type + rendu workbook scrollable
- `src/components/forms/template-gallery.tsx` — onglets Formulaires/Workbooks
- `src/lib/form-templates.ts` — ajout des 3 templates workbook
- `src/lib/constants.ts` — ajout step/callout/checklist dans FORM_FIELD_TYPES
- `src/app/_shared-pages/forms/page.tsx` — badge type + filtre workbook
- `src/app/_shared-pages/forms/[formId]/page.tsx` — affichage soumissions groupé par étape

### Nouveaux fichiers

- `src/components/forms/workbook-renderer.tsx` — composant de rendu workbook public (couverture + étapes + champs)
- `src/components/forms/workbook-field-editors.tsx` — éditeurs pour step/callout/checklist dans le builder
- `src/components/forms/workbook-submission-view.tsx` — affichage soumission groupé par étape
