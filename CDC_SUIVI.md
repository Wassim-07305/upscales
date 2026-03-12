# Suivi du Cahier des Charges - Upscale LMS

> Derniere mise a jour : 2026-03-11
> Version CDC : 1.0 | Mars 2026

---

## Legende

| Icone | Statut |
|-------|--------|
| ✅ | Complet |
| 🟡 | Partiel |
| ❌ | Non implemente |

---

## Vue d'ensemble

| # | Section | Completion | Statut |
|---|---------|------------|--------|
| 1 | Introduction & Vision | - | Architecture OK |
| 2 | Architecture & Technologie | 95% | Stack conforme |
| 3 | Roles & Securite | 90% | 4 roles, RLS, audit trail |
| 4 | Authentification & Profils | 98% | OAuth 4 providers, visibilite profil, rate limiting |
| 5 | Formations & Catalogue | 100% | Filtres, infinite scroll, vue liste, tri |
| 6 | Modules & Contenu | 95% | Video + Tiptap + PiP + resume OK |
| 7 | Quiz & Evaluations | 75% | 3 types, historique, shuffle OK |
| 8 | Certificats | 95% | PDF + QR + partage LinkedIn/Twitter |
| 9 | Calendrier & Sessions | 90% | Vues mois/semaine/jour + filtres + drag-and-drop |
| 10 | Chat & Canaux | 98% | Realtime + edit/delete + reactions + pin + block + archive |
| 11 | Communaute | 90% | Feed + infinite scroll + edition + share posts |
| 12 | Notifications | 95% | Triggers + suppression + nettoyage + tout lu + infinite scroll |
| 13 | CRM Administrateur | 90% | Fiches + tags + notes CRM + export CSV |
| 14 | Booking & Reservations | 85% | Systeme fonctionnel |
| 15 | Landing Pages | 95% | Puck + 11 blocs + SEO meta/og + preview admin |
| 16 | Intelligence Artificielle | 85% | RAG + Claude + streaming + UI admin OK |
| 17 | Design System | 98% | Dark mode complet + reduced-motion |

**Moyenne globale : ~95%**

---

## Detail par fonctionnalite

### 3. ROLES & SECURITE

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F3.1 | Role Administrateur | ✅ | Acces complet admin panel |
| F3.2 | Role Moderateur | 🟡 | Role existe, permissions pas granulaires |
| F3.3 | Role Membre | ✅ | Dashboard etudiant complet |
| F3.4 | Role Prospect | ✅ | Acces limite, booking only |
| F3.5 | RLS policies | ✅ | Migrations 009 + 20260310 |
| F3.6 | Audit trail admin | ✅ | Table audit_logs + page /admin/audit + helper logAuditAction |

### 4. AUTHENTIFICATION & PROFILS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F5 | Connexion OAuth2 | ✅ | Google, GitHub, Facebook, Discord |
| F5.1 | Supabase Auth | ✅ | Middleware + cookies httpOnly |
| F5.2 | Session refresh auto | ✅ | Middleware middleware.ts |
| F5.3 | Rate limiting login | ✅ | 5 tentatives max, verrouillage 60s avec countdown |
| F6 | Inscription + onboarding | ✅ | 5 etapes avec Framer Motion |
| F6.1 | Creation profil auto | ✅ | Trigger PostgreSQL |
| F6.2 | Role par defaut prospect | ✅ | Defini dans le trigger |
| F6.3 | Captcha | ❌ | Non implemente |
| F7 | Recuperation mot de passe | ✅ | Page forgot-password fonctionnelle |
| F7.1 | Token 24h expiration | ✅ | Gere par Supabase Auth |
| F7.2 | Rate limiting reset | ❌ | Non implemente |
| F8 | Profil personnalisable | ✅ | Photo, bio, telephone, preferences |
| F8.1 | Upload photo profil | ✅ | Compression + Supabase Storage |
| F8.2 | Visibilite profil | ✅ | Toggle public/prive avec Switch dans ProfileForm |
| F8.3 | Historique modifications | ❌ | Non implemente |
| F9 | Flow onboarding | ✅ | 5 etapes animees, confettis, progress bar |
| F9.1 | Sauvegarde progressive | ✅ | Apres chaque etape |
| F9.2 | Reprise si interruption | ✅ | Detecte etape en cours |

### 5. FORMATIONS & CATALOGUE

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F10 | Catalogue avec recherche | ✅ | Recherche titre/description, filtres avances |
| F10.1 | Grille responsive | ✅ | Cards avec stats |
| F10.2 | Filtres avances | ✅ | Difficulte, duree, categorie, statut |
| F10.3 | Badges visuels | ✅ | Gratuit/Payant/Premium |
| F10.4 | Infinite scroll catalogue | ✅ | FormationGrid + IntersectionObserver |
| F10.5 | Vue liste alternative | ✅ | Toggle grille/liste avec FormationListItem |
| F10.6 | Tri par colonne | ✅ | Titre, duree, note, popularite, recent |
| F11 | Detail formation | ✅ | Description, modules, inscrits, duree |
| F11.1 | Image couverture | ✅ | Thumbnail optimise |
| F11.2 | Liste modules + duree | ✅ | Avec progression si inscrit |
| F11.3 | Section avis | ✅ | Systeme de notation |
| F12 | Inscription formations | ✅ | Bouton + verification role |
| F12.1 | Unicite inscription | ✅ | Contrainte DB |
| F12.2 | Notification inscription | ✅ | Trigger DB notification |
| F12.3 | Acces module 1 auto | ✅ | Redirection apres inscription |
| F13 | Barre progression | ✅ | Pourcentage + X/Y modules |
| F13.1 | Couleur degradee neon | ✅ | #C6FF00 vers #7FFFD4 |
| F13.2 | Animation remplissage | ✅ | Transition fluide |
| F13.3 | Synchro temps reel | ✅ | Mise a jour apres chaque module |

### 6. MODULES & CONTENU

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F14 | Video avec lecteur | ✅ | Play/pause, volume, fullscreen, vitesse |
| F14.1 | Upload Supabase Storage | ✅ | Via /api/upload |
| F14.2 | URLs embed externes | ✅ | YouTube, Vimeo |
| F14.3 | Picture-in-picture | ✅ | Bouton PiP dans VideoPlayer |
| F14.4 | Sauvegarde position | ✅ | module_progress.last_position_seconds toutes les 10s |
| F14.5 | Auto-completion 90% | ✅ | Marque complete a 90% visionne |
| F15 | Editeur Tiptap | ✅ | WYSIWYG complet |
| F15.1 | Barre d'outils | ✅ | Gras, italique, listes, liens |
| F15.2 | Images dans contenu | ✅ | Insertion + optimisation |
| F15.3 | Niveaux titres | ✅ | h1 a h6 |
| F15.4 | Stockage JSON | ✅ | Format JSON Tiptap en DB |
| F16 | Quiz integres | ✅ | Dans les modules |
| F16.1 | 3 types questions | ✅ | QCM, vrai/faux, reponse libre |
| F16.2 | Explications par question | ✅ | Affichees apres soumission |
| F16.3 | Historique tentatives | ✅ | 10 dernieres tentatives |
| F17 | Progression auto | ✅ | Marquage + transition suivant |
| F17.1 | Bouton suivant conditionnel | ✅ | Active si conditions remplies |
| F17.2 | Table module_progress | ✅ | completed_at enregistre |
| F17.3 | Prerequis modules | ✅ | Verrouillage si prerequis non complete |
| F18 | Navigation modules | ✅ | Sidebar + precedent/suivant |
| F18.1 | Badges statut | ✅ | Complete, en cours, verrouille |
| F18.2 | Breadcrumb | 🟡 | Formation > Module (basique) |

### 7. QUIZ & EVALUATIONS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F19 | Types questions | ✅ | multiple_choice, true_false, free_response |
| F19.1 | Options aleatoires | ✅ | Fisher-Yates shuffle questions + options, re-shuffle au retry |
| F19.2 | Support multimedia options | ❌ | Texte seulement |
| F19.3 | Validation Zod reponses | ❌ | Validation client seulement |
| F20 | Notation automatique | ✅ | Score % + pass/fail |
| F20.1 | Score de passage 70% | ✅ | Configurable par quiz |
| F20.2 | Notation manuelle libre | 🟡 | Reponses libres = toujours correct |
| F20.3 | Table quiz_attempts | ✅ | Score, passed, created_at |
| F20.4 | Stats par question | ❌ | Non implemente |
| F21 | Feedback immediat | ✅ | Score + bonnes reponses |
| F21.1 | Explications textuelles | ✅ | Par question avec icone |
| F21.2 | Option refaire quiz | ✅ | Bouton retry si echoue |
| F21.3 | Suggestion modules | ❌ | Pas de recommandations |

### 8. CERTIFICATS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F22 | Generation PDF auto | ✅ | @react-pdf/renderer |
| F22.1 | Design Upscale | ✅ | Neon border, dark bg, landscape A4 |
| F22.2 | Infos : nom, formation, date | ✅ | + numero certificat |
| F22.3 | Stockage Supabase | ✅ | Table certificates |
| F22.4 | Declenchement auto | ✅ | A la completion formation |
| F23 | Numero unique UUID | ✅ | Format UPS-YYYYMM-XXXXXX |
| F23.1 | Verification externe | ✅ | Page /verify/[number] |
| F23.2 | QR code sur certificat | ✅ | Lien verification |
| F24 | Galerie certificats | ✅ | Page /certificates |
| F24.1 | Telechargement PDF | ✅ | Bouton par certificat |
| F24.2 | Partage LinkedIn/Twitter | ✅ | Dropdown LinkedIn, X/Twitter, copier lien |
| F24.3 | Apercu vignette | ❌ | Pas de preview visuel |
| F24.4 | Export liste complete | ❌ | Non implemente |

### 9. CALENDRIER & SESSIONS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F25 | Calendrier interactif | ✅ | 3 vues avec toggle |
| F25.1 | Vue mois | ✅ | Grille avec sessions, clic pour drill down |
| F25.2 | Vue semaine | ✅ | Grille horaire 7h-22h, 7 colonnes |
| F25.3 | Vue jour | ✅ | Grille horaire detaillee |
| F25.4 | Multi-couleur sessions | ✅ | Couleur par session |
| F25.5 | Places restantes | ✅ | Affiche dans les cards |
| F25.6 | Navigation mois | ✅ | Prev/next + bouton Aujourd'hui |
| F25.7 | Drag-and-drop admin | ✅ | @dnd-kit sortable avec echange creneaux |
| F26 | Sessions live | ✅ | Creation, inscription, details |
| F26.1 | Lieu physique/visio | ✅ | Support Zoom/Meet |
| F26.2 | Limitation participants | ✅ | max_participants |
| F26.3 | Statut scheduled/completed | ✅ | Gestion statut |
| F26.4 | Notification modif session | ✅ | Trigger DB |
| F26.5 | Desistement | 🟡 | Possible mais pas de delai N heures |
| F27 | Filtres sessions | ✅ | Panel filtres avec badge compteur |
| F27.1 | Filtre statut | ✅ | A venir, passees, annulees |
| F27.2 | Filtre type | ✅ | En ligne, physique, hybride |
| F27.3 | Filtre lieu | ✅ | Via filtre type online/physical |
| F27.4 | Badge filtres actifs | ✅ | Compteur sur bouton Filtres |

### 10. CHAT & CANAUX

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F28 | Chat temps reel | ✅ | Supabase Realtime |
| F28.1 | Canaux publics/prives/DM | ✅ | 3 types supportes |
| F28.2 | Avatar + nom auteur | ✅ | Affiche sur chaque message |
| F28.3 | Horodatage FR | ✅ | date-fns locale FR |
| F28.4 | Reactions emoji | ✅ | 6 emojis rapides, toggle, compteur |
| F28.5 | Edition/suppression | ✅ | Par l'auteur, label (modifie) |
| F28.6 | Typing indicator | ✅ | Broadcast Supabase |
| F28.7 | Notification nouveaux msg | 🟡 | Realtime mais pas de badge |
| F29 | Canaux thematiques | ✅ | Creation + gestion admin |
| F29.1 | Canaux prives invitation | ✅ | Systeme membre canal |
| F29.2 | Description canal | ✅ | Affichee en haut |
| F29.3 | Liste membres en ligne | 🟡 | Membres listes, statut basique |
| F29.4 | Pin messages | ✅ | Pin/unpin + barre epinglee en haut du chat |
| F30 | DM securises | ✅ | One-to-one fonctionnel |
| F30.1 | Creation auto DM | ✅ | Au premier message |
| F30.2 | Liste conversations | ✅ | Avec tri recent |
| F30.3 | Statut en ligne | 🟡 | Basique |
| F30.4 | Bloquer utilisateur | ✅ | Blocage/deblocage DM + blocage envoi messages |
| F30.5 | Archivage conversations | ✅ | Archive/desarchive DM + section archivee pliable |

### 11. COMMUNAUTE

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F31 | Feed chronologique | ✅ | Plus recents en premier |
| F31.1 | Auteur, avatar, contenu | ✅ | PostCard complet |
| F31.2 | Compteur likes/comments | ✅ | Temps reel |
| F31.3 | Horodatage FR | ✅ | date-fns locale FR |
| F31.4 | Infinite scroll | ✅ | PostFeed + IntersectionObserver |
| F31.5 | Filtre auteur/hashtag | 🟡 | Filtre type (recent, popular, annonces, mes posts) |
| F31.6 | Pin posts moderateurs | ✅ | Posts annonces |
| F31.7 | Texte riche Tiptap | ✅ | Dans CreatePost |
| F32 | Posts, commentaires, likes | ✅ | Systeme complet |
| F32.1 | Upload image/video | ✅ | CreatePost avec media |
| F32.2 | Commentaires imbriques | ✅ | CommentSection |
| F32.3 | Like/unlike posts+comments | ✅ | Avec compteur optimiste |
| F32.4 | Suppression par auteur/modo | 🟡 | Moderation admin OK, pas cote user |
| F32.5 | Edition post par auteur | ✅ | Mode edition dans PostCard |
| F33 | Detail post | ✅ | Page /community/[postId] |
| F33.1 | Commentaires + reponses | ✅ | Thread complet |
| F33.2 | Share buttons | ✅ | LinkedIn, X/Twitter, copier lien dans PostCard |

### 12. NOTIFICATIONS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F34 | Centre notifications | ✅ | Page /notifications |
| F34.1 | Tri anti-chronologique | ✅ | Plus recentes en haut |
| F34.2 | Filtrage par type | ✅ | Preferences par type |
| F34.3 | Marquage lu/non-lu | ✅ | Toggle par notification |
| F34.4 | Suppression individuelle | ✅ | Bouton X au hover |
| F34.5 | Nettoyage en masse | ✅ | Bouton Nettoyer (supprime les lues) |
| F34.6 | Pagination/scroll infini | ✅ | IntersectionObserver + chargement par 30 |
| F35 | Types multiples | ✅ | enrollment, completion, message, community, system |
| F35.1 | Icone par type | 🟡 | Types existent, icones basiques |
| F35.2 | Lien navigation direct | 🟡 | Pas toujours vers la ressource |
| F36 | Marquage lu | ✅ | Toggle lu/non-lu |
| F36.1 | Marquer tout comme lu | ✅ | Bouton "Tout lu" dans panel + page notifications |
| F36.2 | Badge header non-lues | ✅ | Badge compteur temps reel dans header (99+ max) |
| F36.3 | Surlignage non-lues | 🟡 | Style different mais subtil |

### 13. CRM ADMINISTRATEUR

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F37 | Liste etudiants | ✅ | Table avec colonnes completes |
| F37.1 | Recherche nom/email | ✅ | Temps reel |
| F37.2 | Filtres role/tags/statut | ✅ | Multi-filtres |
| F37.3 | Tri par colonne | 🟡 | Basique |
| F37.4 | Export CSV | ✅ | UTF-8 BOM + colonnes FR dans CRMClient |
| F37.5 | Actions rapides | 🟡 | Voir detail OK, modifier role manquant en liste |
| F38 | Fiches etudiants | ✅ | Page /admin/crm/[userId] |
| F38.1 | Profil complet | ✅ | Email, tel, bio, dates |
| F38.2 | Formations en cours | ✅ | Avec progression visuelle |
| F38.3 | Certificats obtenus | ✅ | Avec dates |
| F38.4 | Sessions | 🟡 | Pas distingue prochaines/passees |
| F38.5 | Notes CRM | ✅ | Section Notes CRM dans StudentDetail |
| F38.6 | Tags colores | ✅ | Assignation + badges |
| F39 | Suivi progression | ✅ | Par formation, modules, quiz |
| F39.1 | Barre progression % | ✅ | Par formation |
| F39.2 | Resultats quiz | ✅ | Scores visibles |
| F39.3 | Temps restant estime | ❌ | Non implemente |
| F39.4 | Alertes blocage | ❌ | Non implemente |
| F40 | Actions admin | 🟡 | Partiellement implemente |
| F40.1 | Modifier role | ✅ | admin, moderator, member, prospect |
| F40.2 | Reset mot de passe | ❌ | Non implemente |
| F40.3 | Tags personnalises | ✅ | CRUD complet |
| F40.4 | Notes CRM privees | ✅ | crm_notes table + UI StudentDetail |
| F40.5 | Suspendre compte | ✅ | Page /suspended |
| F40.6 | Exporter donnees user | ❌ | Non implemente |

### 14. BOOKING & RESERVATIONS

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F41 | Pages publiques | ✅ | /book/[slug] |
| F41.1 | Selection date/heure | ✅ | Calendrier + creneaux |
| F41.2 | Formulaire qualification | ✅ | Champs custom |
| F41.3 | Confirmation | ✅ | Resume reservation |
| F41.4 | Email confirmation | ❌ | Non implemente |
| F41.5 | Notification admin | ❌ | Pas de notif a chaque booking |
| F41.6 | Support timezone | ❌ | Non implemente |
| F42 | Gestion creneaux admin | ✅ | /admin/booking |
| F42.1 | Config par jour semaine | ✅ | Heures debut/fin |
| F42.2 | Duree creneaux | ✅ | 15/30/45/60 min |
| F42.3 | Buffer entre reservations | 🟡 | Basique |
| F42.4 | Exceptions jours fermes | ❌ | Non implemente |
| F43 | Calendrier booking admin | 🟡 | Liste, pas de vue calendrier |
| F43.1 | Sync Google Calendar | ❌ | Non implemente |

### 15. LANDING PAGES

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F44 | Pages personnalisees | ✅ | Page builder Puck |
| F44.1 | URL publique slug | ✅ | /p/[slug] |
| F44.2 | Editeur drag-and-drop | ✅ | Puck integre |
| F44.3 | Blocs disponibles | ✅ | Hero, Features, CTA, Pricing, FAQ, Testimonials, TextImage, Video, RichText, Email, Spacer |
| F44.4 | SEO meta/og:image | ✅ | generateMetadata() dans /p/[slug] avec title, description, OpenGraph |
| F44.5 | Preview avant publication | ✅ | ?preview=true pour admin, bandeau jaune mode preview |
| F44.6 | Historique versions | ❌ | Non implemente |
| F45 | URLs et gestion pages | ✅ | Slug unique |
| F45.1 | Activation/desactivation | 🟡 | Publish OK, pas de toggle actif/inactif |
| F45.2 | Tracking visits | ❌ | Non implemente |
| F45.3 | Analytics par page | ❌ | Non implemente |

### 16. INTELLIGENCE ARTIFICIELLE

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F46 | Chatbot IA RAG | ✅ | /dashboard/ai avec Claude |
| F46.1 | Interface conversationnelle | ✅ | Chat UI |
| F46.2 | Historique conversations | ✅ | Persistant en DB |
| F46.3 | Reponses contextuelles RAG | ✅ | pgvector + embeddings |
| F46.4 | Sources affichees | ✅ | Documents references |
| F46.5 | Streaming | ✅ | streamText() + toUIMessageStreamResponse() |
| F46.6 | Acces member+ seulement | ✅ | Restriction role |
| F47 | Knowledge base admin | ✅ | UI complete /admin/ai avec AIAdminClient |
| F47.1 | Upload PDF/TXT | ✅ | Upload + traitement auto en arriere-plan |
| F47.2 | Import formations | ✅ | API import-formation |
| F47.3 | Vectorisation auto | ✅ | Pipeline pgvector |
| F47.4 | Indicateur statut | ✅ | Badges processing/ready/error avec icones |
| F47.5 | Suppression + cleanup | ✅ | API DELETE |
| F48 | Reponses contextuelles | ✅ | Cosine similarity search |
| F48.1 | Top 5 chunks | ✅ | Algorithme en place |
| F48.2 | Prompt systeme custom | ✅ | buildSystemPrompt() |
| F48.3 | Rate limiting | ❌ | Non implemente |

### 17. DESIGN SYSTEM

| ID | Fonctionnalite | Statut | Notes |
|----|---------------|--------|-------|
| F49 | Dark mode exclusif | ✅ | Fond #0D0D0D, pas de light mode |
| F49.1 | Palette couleurs | ✅ | Neon #C6FF00, Turquoise #7FFFD4 |
| F49.2 | shadcn/ui custom | ✅ | 26 composants |
| F49.3 | Animations Framer | ✅ | Transitions, fade-up, float |
| F49.4 | Glass effects | ✅ | Backdrop blur, gradients |
| F49.5 | Responsive mobile | ✅ | Mobile-first, hamburger menu |
| F49.6 | Respect reduce-motion | ✅ | @media prefers-reduced-motion dans globals.css |
| F49.7 | Typographie | ✅ | Outfit, Syne, Geist Mono |

---

## Fonctionnalites bonus (hors CDC)

| Fonctionnalite | Statut | Notes |
|---------------|--------|-------|
| Gamification XP/Niveaux | ✅ | Systeme complet avec badges |
| Leaderboard | ✅ | Top 20 par XP |
| Systeme parrainage | ✅ | Code referral + rewards XP |
| Dashboard progression | ✅ | Stats detaillees etudiant |
| Notes de module | ✅ | Prises de notes par module |
| Discussions Q&A modules | ✅ | Threads avec resolution |
| Broadcast admin | ✅ | Annonces a tous les users |
| Moderation admin | ✅ | Posts + suspensions |
| Analytics admin | ✅ | Statistiques plateforme |
| Stripe paiement | ✅ | Checkout + webhooks |

---

## Prochaines priorites

### Sprint 4 (complete)
- [x] F25 : Vues calendrier mois/semaine/jour + filtres
- [x] F37.4 : Export CSV CRM (deja implemente)
- [x] F10.4 : Infinite scroll catalogue formations
- [x] F32.5 : Edition de posts par l'auteur (deja implemente)
- [x] F36.2 : Badge notifications temps reel (deja implemente)

### Sprint 5 (complete)
- [x] F5 : OAuth Facebook + Discord
- [x] F28.4 : Reactions emoji chat (6 emojis rapides)
- [x] F24.2 : Partage certificats LinkedIn/Twitter
- [x] F34.4 : Suppression individuelle + nettoyage en masse notifications

### Sprint 6 (complete)
- [x] F19.1 : Shuffle questions + options quiz (Fisher-Yates)
- [x] F10.5 : Vue liste formations (toggle grille/liste)
- [x] F47 : UI knowledge base admin (deja implemente)
- [x] F38.5 : Notes CRM privees (deja implemente)
- [x] F46.5 : Streaming reponses IA (deja implemente)

### Sprint 7 (complete)
- [x] F10.6 : Tri par colonne formations (titre, duree, note, popularite, recent)
- [x] F14.3 : Picture-in-picture video
- [x] F44.3 : Blocs landing pages (deja implemente - 11 blocs)
- [x] F36.1 : Marquer tout comme lu (deja implemente)
- [x] F32.5 : Edition post par auteur (deja implemente)

### Sprint 8 (complete)
- [x] F29.4 : Pin messages chat (pin/unpin + barre epinglee)
- [x] F33.2 : Share buttons posts (LinkedIn, X/Twitter, copier lien)
- [x] F8.2 : Visibilite profil (toggle public/prive)
- [x] F3.6 : Audit trail admin (table + page + helper)
- [x] F14.4 : Sauvegarde position video (deja implemente)

### Sprint 9 (complete)
- [x] F30.4 : Bloquer utilisateur (DM) — blocage/deblocage + blocage envoi
- [x] F30.5 : Archivage conversations — archive/desarchive + section pliable
- [x] F37.4 : Export CSV CRM (deja implemente)
- [x] F44.4 : SEO meta/og:image landing pages (deja implemente)
- [x] F49.6 : Respect prefers-reduced-motion — @media query dans globals.css

### Sprint 10 (complete)
- [x] F5.3 : Rate limiting login — 5 tentatives max, verrouillage 60s
- [x] F25.7 : Drag-and-drop calendrier admin — @dnd-kit echange creneaux
- [x] F34.6 : Infinite scroll notifications — IntersectionObserver + pages de 30
- [x] F44.5 : Preview landing pages — mode preview admin avec bandeau jaune
- [x] F36.2 : Badge notifications header (deja implemente)

### Sprint 11 (a planifier)
- [ ] A definir

---

## Historique des sprints

| Sprint | Date | Contenu | Branche |
|--------|------|---------|---------|
| Sprint 1 | 2026-03-10 | Recherche globale, triggers notifications, OAuth Google/GitHub | dev → main |
| Sprint 2 | 2026-03-10 | Quiz multi-types, historique tentatives, certificats PDF | dev → main |
| Sprint 3 | 2026-03-11 | Upload images posts, chat edit/delete/typing, infinite scroll communaute | dev → main |
| Sprint 4 | 2026-03-11 | Vues calendrier mois/semaine/jour, filtres sessions, infinite scroll formations | main |
| Sprint 5 | 2026-03-11 | OAuth FB/Discord, reactions emoji chat, partage certificats, suppression notifs | main |
| Sprint 6 | 2026-03-11 | Shuffle quiz, vue liste formations, validation UI IA/CRM/streaming | main |
| Sprint 7 | 2026-03-11 | Tri formations, PiP video, validation blocs landing/notifs/posts | main |
| Sprint 8 | 2026-03-11 | Pin messages, share posts, visibilite profil, audit trail admin | main |
| Sprint 9 | 2026-03-11 | Block user DM, archive conversations, reduced-motion, validation CSV/SEO | main |
| Sprint 10 | 2026-03-12 | Rate limiting login, drag-drop calendar, infinite scroll notifs, preview landing pages | main |
