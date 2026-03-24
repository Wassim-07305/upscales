export type DripMode = "time-based" | "progress-based";

export interface DripModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  dayOffset: number;
  isUnlocked: boolean;
  unlockDate?: string;
  requiredProgress?: number;
  lessonsCount: number;
  completedLessons: number;
}

export interface DripConfig {
  courseId: string;
  mode: DripMode;
  startDate: string;
  modules: DripModule[];
  autoNotify: boolean;
}

export interface DripScheduleEntry {
  moduleId: string;
  moduleTitle: string;
  scheduledDate: string;
  dayOffset: number;
  status: "released" | "scheduled" | "locked";
}

export interface DripEngineResult {
  isEligible: boolean;
  reason?: string;
  nextUnlockDate?: string;
  nextUnlockModule?: string;
}
