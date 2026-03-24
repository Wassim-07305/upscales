export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon: string;
  unlockCondition: (stats: UserStats) => boolean;
}

export interface UserStats {
  xp: number;
  level: number;
  totalActions: number;
  currentStreak: number;
  bestStreak: number;
  postsCount: number;
  commentsCount: number;
  coursesCompleted: number;
  quizzesCompleted: number;
  daysActive: number;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  frozen: boolean;
  freezesRemaining: number;
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
  title: string;
}

const LEVEL_THRESHOLDS: number[] = Array.from({ length: 50 }, (_, i) => {
  if (i === 0) return 0;
  return Math.floor(100 * Math.pow(1.15, i - 1));
});

const LEVEL_TITLES: Record<number, string> = {
  1: "Debutant",
  5: "Apprenti",
  10: "Initie",
  15: "Confirme",
  20: "Expert",
  25: "Maitre",
  30: "Grand Maitre",
  35: "Legende",
  40: "Mythique",
  45: "Transcendant",
  50: "Divin",
};

function getLevelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) return LEVEL_TITLES[key];
  }
  return "Debutant";
}

export function calculateLevel(xp: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const xpForCurrentLevel = LEVEL_THRESHOLDS[level - 1] || 0;
  const xpForNextLevel = level < 50 ? LEVEL_THRESHOLDS[level] : LEVEL_THRESHOLDS[level - 1];
  const xpInLevel = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return { level, currentXp: xp, xpForCurrentLevel, xpForNextLevel, progress, title: getLevelTitle(level) };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_step", name: "Premier pas", description: "Effectuer sa premiere action", tier: "bronze", icon: "Sparkles", unlockCondition: (s) => s.totalActions >= 1 },
  { id: "social_butterfly", name: "Papillon social", description: "Publier 5 posts dans la communaute", tier: "bronze", icon: "MessageCircle", unlockCondition: (s) => s.postsCount >= 5 },
  { id: "early_bird", name: "Leve-tot", description: "Maintenir un streak de 3 jours", tier: "bronze", icon: "Sunrise", unlockCondition: (s) => s.bestStreak >= 3 },
  { id: "dedicated", name: "Devoue", description: "Atteindre le niveau 10", tier: "silver", icon: "Target", unlockCondition: (s) => s.level >= 10 },
  { id: "scholar", name: "Erudit", description: "Completer 5 formations", tier: "silver", icon: "GraduationCap", unlockCondition: (s) => s.coursesCompleted >= 5 },
  { id: "streak_master", name: "Maitre du streak", description: "Maintenir un streak de 14 jours", tier: "silver", icon: "Flame", unlockCondition: (s) => s.bestStreak >= 14 },
  { id: "veteran", name: "Veteran", description: "Atteindre le niveau 25", tier: "gold", icon: "Shield", unlockCondition: (s) => s.level >= 25 },
  { id: "community_leader", name: "Leader communautaire", description: "50 posts et 100 commentaires", tier: "gold", icon: "Crown", unlockCondition: (s) => s.postsCount >= 50 && s.commentsCount >= 100 },
  { id: "unstoppable", name: "Inarretable", description: "Streak de 30 jours consecutifs", tier: "gold", icon: "Zap", unlockCondition: (s) => s.bestStreak >= 30 },
  { id: "legend", name: "Legende", description: "Atteindre le niveau 50", tier: "platinum", icon: "Trophy", unlockCondition: (s) => s.level >= 50 },
  { id: "centurion", name: "Centurion", description: "Streak de 100 jours consecutifs", tier: "platinum", icon: "Star", unlockCondition: (s) => s.bestStreak >= 100 },
];

export function checkBadgeUnlock(stats: UserStats) {
  const unlocked: BadgeDefinition[] = [];
  const locked: BadgeDefinition[] = [];
  for (const badge of BADGE_DEFINITIONS) {
    if (badge.unlockCondition(stats)) unlocked.push(badge);
    else locked.push(badge);
  }
  return { unlocked, locked };
}

export function calculateStreak(streakData: StreakData): StreakData {
  const today = new Date().toISOString().split("T")[0];
  if (streakData.lastActiveDate === today) return streakData;

  const lastDate = new Date(streakData.lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const newStreak = streakData.currentStreak + 1;
    return { ...streakData, currentStreak: newStreak, bestStreak: Math.max(newStreak, streakData.bestStreak), lastActiveDate: today, frozen: false };
  }

  if (diffDays === 2 && streakData.freezesRemaining > 0) {
    return { ...streakData, lastActiveDate: today, frozen: true, freezesRemaining: streakData.freezesRemaining - 1 };
  }

  return { currentStreak: 1, bestStreak: streakData.bestStreak, lastActiveDate: today, frozen: false, freezesRemaining: streakData.freezesRemaining };
}
