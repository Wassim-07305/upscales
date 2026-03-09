# Design : Onboarding Upscale

## Vue d'ensemble

Flow d'onboarding en 5 etapes, plein ecran, anime avec Framer Motion.
Se declenche apres chaque login si `onboarding_completed === false`.
Concerne tous les roles (admin, moderator, member, prospect).

## Etapes

| # | Ecran | Type | Donnees collectees |
|---|-------|------|--------------------|
| 0 | Bienvenue | Welcome | Aucune |
| 1 | Photo de profil | Avatar upload | avatar_url |
| 2 | Telephone | Text input | phone |
| 3 | Bio | Textarea | bio |
| 4 | Resume | Summary | Aucune (review + completion) |

## UI / Visuel

- Fond : #0D0D0D avec 3 blobs gradient animes (#C6FF00 + #7FFFD4, pulsing, blur)
- Progress bar : Gradient #C6FF00 → #7FFFD4 animee
- Top bar : Bouton retour + logo Upscale + compteur "2/5"
- Transitions : Slide vertical direction-aware (Framer Motion), 300ms easeOut
- Bouton OK : Fond #C6FF00, texte noir, hover scale-105 + glow
- Hint clavier : "Appuie sur Entree" sous le bouton
- Confettis : Couleurs ["#C6FF00", "#7FFFD4", "#ffffff", "#a3e635"]

## Architecture technique

### Fichiers a creer

- `app/(onboarding)/layout.tsx` — Layout minimal (pas de sidebar)
- `app/(onboarding)/onboarding/page.tsx` — Page principale du flow

### Fichiers a modifier

- `app/(dashboard)/layout.tsx` — Ajouter redirect vers /onboarding si onboarding_completed === false

### Route group

`(onboarding)` est un route group separe de `(dashboard)` — pas de sidebar, pas de header.

### Sauvegarde

- Progressive : chaque etape met a jour `profiles` via Supabase
- Avatar : upload vers Supabase Storage bucket `avatars/{userId}/avatar_{timestamp}.ext`
- Completion : `onboarding_completed = true` dans profiles

### Reprise

Si l'utilisateur quitte et revient :
- Charger le profil existant
- Reprendre a l'etape appropriee (si avatar_url existe → skip etape 1, etc.)

### Navigation

- Bouton "OK" ou touche Entree pour avancer
- Bouton retour pour reculer (desactive sur etape 0)
- Auto-focus sur les inputs apres 350ms

### Apres completion

- Confettis
- Redirect vers /dashboard apres 1.5s
