// ─── Client Statuses ────────────────────────────────────

export const CLIENT_STATUSES = ["actif", "inactif", "archivé", "en_attente"] as const;

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  actif: "Actif",
  inactif: "Inactif",
  "archivé": "Archivé",
  en_attente: "En attente",
};

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  actif: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactif: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "archivé": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  en_attente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// ─── Lead Statuses ──────────────────────────────────────

export const LEAD_STATUSES = ["nouveau", "qualifie", "appel_booke", "en_reflexion", "close", "perdu", "no_show"] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  qualifie: "Qualifié",
  appel_booke: "Appel booké",
  en_reflexion: "En réflexion",
  close: "Closé",
  perdu: "Perdu",
  no_show: "No-show",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  nouveau: "bg-blue-500/20 text-blue-400",
  qualifie: "bg-indigo-500/20 text-indigo-400",
  appel_booke: "bg-purple-500/20 text-purple-400",
  en_reflexion: "bg-amber-500/20 text-amber-400",
  close: "bg-emerald-500/20 text-emerald-400",
  perdu: "bg-zinc-500/20 text-zinc-400",
  no_show: "bg-red-500/20 text-red-400",
};

export const LEAD_STAGE_COLORS: Record<string, string> = {
  nouveau: "#60a5fa",
  qualifie: "#818cf8",
  appel_booke: "#a855f7",
  en_reflexion: "#f59e0b",
  close: "#10b981",
  perdu: "#71717a",
  no_show: "#ef4444",
};

// ─── Lead Sources ───────────────────────────────────────

export const LEAD_SOURCES = [
  "instagram",
  "linkedin",
  "tiktok",
  "referral",
  "ads",
  "youtube",
  "site_web",
  "cold_dm",
  "skool",
  "autre",
] as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  referral: "Referral",
  ads: "Publicités",
  youtube: "YouTube",
  site_web: "Site web",
  cold_dm: "Cold DM",
  skool: "Skool",
  autre: "Autre",
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

export const CALL_STATUSES = ["planifié", "effectué", "annulé", "no_show", "reporté"] as const;
export const CALL_STATUS_LABELS: Record<string, string> = {
  "planifié": "Planifié",
  "effectué": "Effectué",
  "annulé": "Annulé",
  no_show: "No-show",
  "reporté": "Reporté",
};

// ─── Closer Call Statuses ───────────────────────────────

export const CLOSER_CALL_STATUSES = [
  "en_attente", "closé", "non_closé", "perdu", "no_show", "paiement_reussi", "paiement_echoue",
] as const;

export const CLOSER_CALL_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  "closé": "Closé",
  "non_closé": "Non closé",
  perdu: "Perdu",
  no_show: "No-show",
  paiement_reussi: "Paiement réussi",
  paiement_echoue: "Paiement échoué",
};

export const CLOSER_CALL_STATUS_COLORS: Record<string, string> = {
  en_attente: "bg-blue-500/20 text-blue-400",
  "closé": "bg-emerald-500/20 text-emerald-400",
  "non_closé": "bg-amber-500/20 text-amber-400",
  perdu: "bg-zinc-500/20 text-zinc-400",
  no_show: "bg-red-500/20 text-red-400",
  paiement_reussi: "bg-neon/20 text-neon",
  paiement_echoue: "bg-red-500/20 text-red-400",
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
