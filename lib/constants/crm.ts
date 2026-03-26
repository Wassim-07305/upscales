// ─── Client Statuses ────────────────────────────────────

export const CLIENT_STATUSES = ["actif", "inactif", "archivé", "en_attente"] as const;
export type ClientStatusType = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  actif: "Actif",
  inactif: "Inactif",
  archivé: "Archivé",
  en_attente: "En attente",
};

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  actif: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactif: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  archivé: "bg-red-500/20 text-red-400 border-red-500/30",
  en_attente: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

// ─── Lead Statuses ──────────────────────────────────────

export const LEAD_STATUSES = ["à_relancer", "booké", "no_show", "pas_intéressé", "en_cours", "données_saisies"] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  "à_relancer": "À relancer",
  "booké": "Booké",
  no_show: "No show",
  "pas_intéressé": "Pas intéressé",
  en_cours: "En cours",
  "données_saisies": "Données saisies",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  "à_relancer": "bg-amber-500/20 text-amber-400",
  "booké": "bg-blue-500/20 text-blue-400",
  no_show: "bg-red-500/20 text-red-400",
  "pas_intéressé": "bg-zinc-500/20 text-zinc-400",
  en_cours: "bg-emerald-500/20 text-emerald-400",
  "données_saisies": "bg-orange-500/20 text-orange-400",
};

// ─── Client Scope Statuses (Pipeline) ───────────────────

export const CLIENT_SCOPE_STATUSES = ["contacté", "qualifié", "proposé", "closé", "perdu"] as const;
export type ClientScopeStatusType = (typeof CLIENT_SCOPE_STATUSES)[number];

export const CLIENT_SCOPE_STATUS_LABELS: Record<string, string> = {
  "contacté": "Contacté",
  "qualifié": "Qualifié",
  "proposé": "Proposé",
  "closé": "Closé",
  perdu: "Perdu",
};

export const CLIENT_SCOPE_STATUS_COLORS: Record<string, string> = {
  "contacté": "border-t-slate-400",
  "qualifié": "border-t-blue-400",
  "proposé": "border-t-amber-400",
  "closé": "border-t-emerald-400",
  perdu: "border-t-red-400",
};

// ─── Lead Sources ───────────────────────────────────────

export const LEAD_SOURCES = [
  "instagram", "linkedin", "tiktok", "referral", "ads", "youtube", "bio_instagram", "booking", "autre",
] as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  referral: "Referral",
  ads: "Ads",
  youtube: "YouTube",
  bio_instagram: "Bio Instagram",
  booking: "Booking",
  autre: "Autre",
};

export const LEAD_SOURCE_COLORS: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  linkedin: "bg-blue-500/20 text-blue-400",
  tiktok: "bg-zinc-500/20 text-zinc-400",
  referral: "bg-emerald-500/20 text-emerald-400",
  ads: "bg-amber-500/20 text-amber-400",
  youtube: "bg-red-500/20 text-red-400",
  bio_instagram: "bg-purple-500/20 text-purple-400",
  booking: "bg-indigo-500/20 text-indigo-400",
  autre: "bg-zinc-500/20 text-zinc-400",
};

// ─── Call Types ─────────────────────────────────────────

export const CALL_TYPES = ["manuel", "iclosed", "calendly", "booking", "autre"] as const;
export const CALL_TYPE_LABELS: Record<string, string> = {
  manuel: "Manuel",
  iclosed: "iClosed",
  calendly: "Calendly",
  booking: "Booking",
  autre: "Autre",
};

export const CALL_STATUSES = ["planifié", "réalisé", "no_show", "annulé", "reporté"] as const;
export const CALL_STATUS_LABELS: Record<string, string> = {
  "planifié": "Planifié",
  "réalisé": "Réalisé",
  "annulé": "Annulé",
  no_show: "No-show",
  "reporté": "Reporté",
};

export const CALL_STATUS_COLORS: Record<string, string> = {
  "planifié": "bg-blue-500/20 text-blue-400",
  "réalisé": "bg-emerald-500/20 text-emerald-400",
  no_show: "bg-red-500/20 text-red-400",
  "annulé": "bg-zinc-500/20 text-zinc-400",
  "reporté": "bg-orange-500/20 text-orange-400",
};

// ─── Closer Call Statuses ───────────────────────────────

export const CLOSER_CALL_STATUSES = [
  "closé", "non_closé", "non_categorise", "perdu", "annule", "no_show",
  "paiement_echoue", "paiement_reussi", "follow_up", "r2",
] as const;

export const CLOSER_CALL_STATUS_LABELS: Record<string, string> = {
  "closé": "Closé",
  "non_closé": "Non closé",
  non_categorise: "Non catégorisé",
  perdu: "Perdu",
  annule: "Annulé",
  no_show: "No-show",
  paiement_echoue: "Paiement échoué",
  paiement_reussi: "Paiement réussi",
  follow_up: "Follow-up",
  r2: "R2",
};

export const CLOSER_CALL_STATUS_COLORS: Record<string, string> = {
  "closé": "bg-emerald-500/20 text-emerald-400",
  "non_closé": "bg-zinc-500/20 text-zinc-400",
  non_categorise: "bg-slate-500/20 text-slate-400",
  perdu: "bg-red-500/20 text-red-400",
  annule: "bg-orange-500/20 text-orange-400",
  no_show: "bg-amber-500/20 text-amber-400",
  paiement_echoue: "bg-rose-500/20 text-rose-400",
  paiement_reussi: "bg-[#C6FF00]/20 text-[#C6FF00]",
  follow_up: "bg-purple-500/20 text-purple-400",
  r2: "bg-amber-500/20 text-amber-400",
};

// ─── Finance Types ──────────────────────────────────────

export const FINANCIAL_TYPES = ["ca", "récurrent", "charge", "prestataire"] as const;
export const FINANCIAL_TYPE_LABELS: Record<string, string> = {
  ca: "CA",
  "récurrent": "Récurrent",
  charge: "Charge",
  prestataire: "Prestataire",
};

export const FINANCIAL_TYPE_COLORS: Record<string, string> = {
  ca: "bg-emerald-500/20 text-emerald-400",
  "récurrent": "bg-blue-500/20 text-blue-400",
  charge: "bg-red-500/20 text-red-400",
  prestataire: "bg-orange-500/20 text-orange-400",
};

export const FINANCIAL_SUB_TYPES = ["new_cash", "mensualite", "contracte", "collecte"] as const;
export const FINANCIAL_SUB_TYPE_LABELS: Record<string, string> = {
  new_cash: "New Cash",
  mensualite: "Mensualité",
  contracte: "Contracté",
  collecte: "Collecté",
};

// ─── Assignment Roles ───────────────────────────────────

export const ASSIGNMENT_ROLES = ["manager", "coach", "setter", "closer", "cm", "monteur"] as const;
export const ASSIGNMENT_ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  coach: "Coach",
  setter: "Setter",
  closer: "Closer",
  cm: "CM",
  monteur: "Monteur",
};

// ─── Default Pipeline Columns ───────────────────────────

export const DEFAULT_PIPELINE_COLUMNS = [
  { name: "A contacter", color: "#94a3b8" },
  { name: "Contacté", color: "#60a5fa" },
  { name: "Qualifié", color: "#818cf8" },
  { name: "Lien envoyé", color: "#f59e0b" },
  { name: "Call booké", color: "#a855f7" },
  { name: "Contracté", color: "#10b981" },
  { name: "Collecté", color: "#059669" },
  { name: "Perdu", color: "#71717a" },
] as const;

export const ITEMS_PER_PAGE = 20;
