# Refonte CRM Admin — Design Spec

**Date:** 2026-03-30
**Statut:** Approuvé

## Contexte

Le CRM admin actuel (`/admin/crm`) a 4 modes (Suivi Coaches, Pipeline Setter, Pipeline Closer, Timeline) qui ne correspondent pas au standard CRM type Rivia (Pipeline/Liste/Bilan). L'objectif est de réaligner l'expérience admin sur ce standard.

## Design

### Page `/admin/crm` — CRM Principal

3 onglets :

- **Pipeline** — `<SetterPipelineKanban />` (kanban drag-and-drop)
- **Liste** — `<SetterPipelineList />` (table triable/filtrable)
- **Bilan** — `<SetterBilan />` (KPIs + formulaire activité + historique)

Header : titre "CRM", bouton "Colonnes" (config pipeline), bouton "+ Nouveau prospect".

Réutilise les mêmes composants que `_shared-pages/crm/page.tsx`.

### Page `/admin/crm/autre` — Fonctionnalités déplacées

3 onglets :

- **Suivi Coaches** — `CoachMonitoringPanel` (extrait de l'ancienne page)
- **Pipeline Closer** — `CloserPipelineView` (import dynamique)
- **Timeline** — `PipelineTimeline`

### Sidebar admin

```
CRM          → /admin/crm
  Autre      → /admin/crm/autre
```

"Autre" = sous-item indenté sous CRM.

### Page `/admin/crm/[id]` — Fiche contact

Inchangée.

## Fichiers impactés

1. `src/app/admin/crm/page.tsx` — réécriture complète
2. `src/app/admin/crm/autre/page.tsx` — nouvelle page
3. `src/lib/navigation.ts` — ajout sous-item "Autre"
4. `src/components/crm/coach-monitoring-panel.tsx` — extraction du composant inline

## Hors scope

- Pas de modification des composants Pipeline/Liste/Bilan existants
- Pas de modification de la fiche contact `/admin/crm/[id]`
- Pas de modification du CRM côté sales/coach
