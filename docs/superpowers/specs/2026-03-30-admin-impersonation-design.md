# Spec : Impersonation Admin

## Objectif

Permettre a l'admin de voir l'application exactement comme un autre utilisateur (sidebar, pages, donnees reelles) en selectionnant un role puis une personne depuis le header.

## UI

### Header (centre, visible uniquement pour admin)

```
[Admin] [Portail]   [Role ▾] [Personne ▾]   [Rechercher...]
```

- **Bouton Admin** : actif par defaut, clic = retour admin + redirect `/admin/dashboard`
- **Bouton Portail** : clic = active le mode portail, affiche les 2 selects a droite
- **Select Role** : options = client, prospect, setter, closer, coach
- **Select Personne** : filtre par role choisi, affiche nom + avatar

Les selects sont visibles uniquement quand "Portail" est actif.

## State (Zustand - ui-store.ts)

Nouveaux champs dans `useUIStore` :

```typescript
impersonatedProfile: Profile | null
impersonatedRole: AppRole | null  // role selectionne dans le filtre
setImpersonation: (profile: Profile) => void
clearImpersonation: () => void
setImpersonatedRole: (role: AppRole | null) => void
```

Persiste `impersonatedProfile` dans localStorage (survive aux refresh).

## Hook useAuth() — modification

Quand `impersonatedProfile` est non-null :

- `profile` retourne `impersonatedProfile`
- `user.id` retourne `impersonatedProfile.id`
- les booleans de role (`isAdmin`, `isClient`, etc.) refletent le role impersone
- expose `realUser` et `realProfile` (la vraie session admin)
- expose `isImpersonating: boolean`

Quand impersonation inactive : comportement normal.

## Impact automatique (zero changement dans ces fichiers)

- **Sidebar** : driven par `profile.role` → navigation change
- **Hooks de donnees** : fetchent par `user.id` → donnees de la personne
- **Permissions** : `canAccess(role, module)` → permissions du role impersone
- **Pages** : affichent les donnees de la personne

## Composants a creer

1. `src/components/layout/view-mode-switcher.tsx` — boutons Admin/Portail
2. `src/components/layout/role-select.tsx` — select du role
3. `src/components/layout/person-select.tsx` — select de la personne (avec recherche)

## Composants a modifier

1. `src/components/layout/header.tsx` — integrer ViewModeSwitcher au centre
2. `src/stores/ui-store.ts` — ajouter state impersonation
3. `src/hooks/use-auth.tsx` — override quand impersonation active

## Securite

- Impersonation purement client-side (pas de changement de session Supabase)
- L'admin garde sa session reelle → les mutations Supabase passent avec ses droits admin
- Les donnees fetchees sont celles accessibles via RLS avec le vrai token admin
- Aucun endpoint API modifie

## Edge cases

- Refresh page : impersonation persiste via localStorage
- Sign out : clear impersonation + sign out normal
- Changement de role dans le select : reset la personne selectionnee
- Personne supprimee/desactivee : clear impersonation si profil introuvable
