"use client";

import { toast } from "sonner";

/**
 * Affiche un toast animé pour le gain d'XP et optionnellement un badge.
 */
export function showXPToast(xp: number, badgeName?: string) {
  if (badgeName) {
    toast.success(`🏆 Badge débloqué : ${badgeName}`, {
      description: `+${xp} XP gagnés`,
      duration: 5000,
    });
  } else {
    toast.success(`+${xp} XP gagnés !`, {
      duration: 3000,
    });
  }
}
