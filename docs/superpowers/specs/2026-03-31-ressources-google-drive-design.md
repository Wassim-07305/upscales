# Ressources Google Drive — Design Spec

**Date:** 2026-03-31
**Statut:** Approuvé

## Contexte

La page Ressources actuelle est une liste plate de fichiers avec des catégories (contrats, marketing, guides, templates, général, formation). L'objectif est de la transformer en un système type Google Drive avec des dossiers et des permissions par utilisateur.

## Design

### DB : table `resource_folders`

| Colonne     | Type                                 | Notes                     |
| ----------- | ------------------------------------ | ------------------------- |
| id          | uuid PK                              | gen_random_uuid()         |
| name        | text NOT NULL                        | Nom du dossier            |
| description | text                                 | Optionnel                 |
| icon        | text                                 | Emoji ou nom lucide-react |
| color       | text                                 | Couleur accent            |
| visibility  | text CHECK ('all','staff','clients') | Défaut 'all'              |
| created_by  | uuid FK → profiles                   |                           |
| created_at  | timestamptz                          |                           |
| updated_at  | timestamptz                          |                           |

### DB : table `resource_folder_access`

| Colonne    | Type                                         | Notes             |
| ---------- | -------------------------------------------- | ----------------- |
| id         | uuid PK                                      | gen_random_uuid() |
| folder_id  | uuid FK → resource_folders ON DELETE CASCADE |                   |
| user_id    | uuid FK → profiles ON DELETE CASCADE         |                   |
| created_at | timestamptz                                  |                   |

UNIQUE(folder_id, user_id)

### Logique d'accès

- `visibility = 'all'` → tout le monde
- `visibility = 'staff'` → admin + coach
- `visibility = 'clients'` → clients
- Users dans `resource_folder_access` → accès garanti quel que soit le rôle
- Admins voient toujours tous les dossiers

### DB : modification `resources`

- Ajouter `folder_id uuid FK → resource_folders ON DELETE SET NULL` (nullable)
- Les fichiers existants restent sans dossier (affichés à la racine)
- Supprimer les catégories contracts, marketing, guides, templates, general du code

### UI

**Vue racine** : grille de dossiers + section fichiers sans dossier
**Vue dossier** : breadcrumb + liste fichiers + upload + retour
**Staff** : créer/modifier/supprimer dossiers, gérer permissions (rôle + utilisateurs individuels)
**Clients** : accès lecture aux dossiers autorisés

### Fichiers impactés

1. `supabase/migrations/XXX_resource_folders.sql`
2. `src/types/database.ts` — interfaces
3. `src/hooks/use-resources.ts` — hooks dossiers
4. `src/app/_shared-pages/resources/page.tsx` — refonte UI
5. `src/components/resources/folder-card.tsx`
6. `src/components/resources/folder-form-modal.tsx`
7. `src/components/resources/folder-permissions-modal.tsx`
