import type { DripModule, DripConfig, DripScheduleEntry, DripEngineResult } from "./drip-types";

export function calculateUnlockDate(startDate: string, dayOffset: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

export function isTimeBasedUnlocked(startDate: string, dayOffset: number): boolean {
  const unlockDate = calculateUnlockDate(startDate, dayOffset);
  return new Date() >= unlockDate;
}

export function isProgressBasedUnlocked(modules: DripModule[], moduleIndex: number): boolean {
  if (moduleIndex === 0) return true;
  const previousModule = modules[moduleIndex - 1];
  if (!previousModule) return false;
  const progress = previousModule.lessonsCount > 0
    ? (previousModule.completedLessons / previousModule.lessonsCount) * 100
    : 0;
  return progress >= (previousModule.requiredProgress ?? 100);
}

export function generateSchedule(config: DripConfig): DripScheduleEntry[] {
  return config.modules.map((module) => {
    const scheduledDate = calculateUnlockDate(config.startDate, module.dayOffset);
    const now = new Date();
    let status: DripScheduleEntry["status"] = "locked";
    if (module.isUnlocked) {
      status = "released";
    } else if (now >= scheduledDate && config.mode === "time-based") {
      status = "scheduled";
    }
    return {
      moduleId: module.id,
      moduleTitle: module.title,
      scheduledDate: scheduledDate.toISOString(),
      dayOffset: module.dayOffset,
      status,
    };
  });
}

export function evaluateDripState(config: DripConfig): DripEngineResult {
  const lockedModules = config.modules.filter((m) => !m.isUnlocked);
  if (lockedModules.length === 0) return { isEligible: true };

  const nextModule = lockedModules[0];
  const nextUnlockDate = calculateUnlockDate(config.startDate, nextModule.dayOffset);

  return {
    isEligible: false,
    reason: config.mode === "time-based"
      ? `Prochain deblocage le ${nextUnlockDate.toLocaleDateString("fr-FR")}`
      : `Completez le module precedent pour debloquer "${nextModule.title}"`,
    nextUnlockDate: nextUnlockDate.toISOString(),
    nextUnlockModule: nextModule.title,
  };
}
