# Progression Client — Redesign en 3 pages

## Contexte

La section Progression du client a 11 pages et 7 onglets. Trop complexe, trop de vide, certaines pages sont des doublons. On simplifie en 3 pages claires.

## Architecture cible

### Page 1 : Ma Progression (`/client/progression`)

Page scrollable sans onglets. Sections empilees :

1. **Niveau & XP** — StatCard style admin : niveau actuel, barre XP, total XP, % vers prochain niveau
2. **Badges & Certificats** — Grille unifiee. Les certificats de formations terminees sont des badges speciaux (icone diplome). Badges gagnes en couleur, verrouilles en gris.
3. **Objectifs coaching** — Liste des objectifs actifs avec barre de progression + milestones cochables. Reprise du composant GoalCard existant.

Sources de donnees :

- `useXp()` — niveau, XP, progression
- `useBadges()` — badges gagnes/verrouilles
- `useCertificates()` — certificats formations
- `useCoachingGoals()` — objectifs + milestones

### Page 2 : Journal & Suivi (`/client/journal`)

2 onglets :

1. **Journal** — Entrees quotidiennes, prompts, pieces jointes, rituels. Composant `JournalContent` existant.
2. **Check-in hebdo** — Bilan hebdomadaire (CA, prospection, wins/blockers, mood). Composant `CheckinContent` existant.

Sources de donnees :

- `useJournal()` — entrees journal
- `useCheckins()` — check-ins hebdo

### Page 3 : Classement (`/client/leaderboard`)

1. **Encart Hall of Fame** — Bandeau en haut avec les 3-5 top performers (10K+/mois). Compact : avatar + nom + CA.
2. **2 onglets** :
   - Classement — Leaderboard XP par periode (semaine/mois/all-time) + position perso
   - Defis — Defis actifs, rejoindre, soumettre

Sources de donnees :

- `useHallOfFame()` — top performers
- `useLeaderboard(period)` — classement XP
- `useChallenges()` — defis

## Navigation sidebar

```
Section "Progression" :
  Ma Progression  → /client/progression  (Trophy)
  Journal & Suivi → /client/journal      (PenLine)
  Classement      → /client/leaderboard  (Crown)
```

## Pages supprimees de la nav

- `/client/gamification` — doublon de /progression
- `/client/certificates` — fusionne dans Progression (badges)
- `/client/hall-of-fame` — integre dans Classement (encart)
- `/client/rewards` — supprime (peu utilise)
- `/client/progress` — fusionne dans Progression
- `/client/goals` — fusionne dans Progression
- `/client/challenges` — fusionne dans Classement
- `/client/checkin` — fusionne dans Journal & Suivi

Note : les routes restent accessibles (pas de suppression de fichiers pour eviter les 404), mais retirees de la sidebar.

## Style

- Full-width (pas de marges vides laterales)
- Cards style admin : fond blanc, border subtile, icone en haut a droite
- Composant StatCard reutilise
- Responsive mobile-first
- UI en francais

## Composants reutilises

| Composant existant                     | Nouvelle page                       |
| -------------------------------------- | ----------------------------------- |
| XpBadges (progress/page.tsx)           | Ma Progression                      |
| GoalCard, GoalSection (goals/page.tsx) | Ma Progression                      |
| CertificateCard                        | Ma Progression (dans grille badges) |
| JournalContent (journal/page.tsx)      | Journal & Suivi                     |
| CheckinContent (checkin/page.tsx)      | Journal & Suivi                     |
| HallOfFameWall                         | Classement (encart)                 |
| Leaderboard (leaderboard/page.tsx)     | Classement                          |
| Challenges (challenges/page.tsx)       | Classement                          |
