export const readingTaskTypes = [
  "complete-the-words",
  "daily-life",
  "academic-passage",
] as const;

export type ReadingTaskType = (typeof readingTaskTypes)[number];

export const mistakeCategories = [
  "evidence-drift",
  "word-form",
  "purpose-confusion",
  "inference-overreach",
] as const;

export type MistakeCategory = (typeof mistakeCategories)[number];

export interface Tutor {
  id: string;
  name: string;
  initials: string;
  title: string;
  verifiedAt: string;
}

export interface Student {
  id: string;
  tutorId: Tutor["id"];
  name: string;
  initials: string;
  targetScore: number;
  currentStreakDays: number;
}

export interface MissionStep {
  id: string;
  label: string;
  detail: string;
  status: "ready" | "locked" | "complete";
}

export interface DailyMission {
  id: string;
  studentId: Student["id"];
  title: string;
  focus: MistakeCategory;
  focusLabel: string;
  estimatedMinutes: number;
  progress: number;
  dueLabel: string;
  steps: MissionStep[];
}

export interface MistakePattern {
  id: string;
  studentId: Student["id"];
  category: MistakeCategory;
  label: string;
  description: string;
  recurrenceCount: number;
  trend: "improving" | "steady" | "needs-attention";
  lastSeenAt: string;
}

export interface Intervention {
  id: string;
  tutorId: Tutor["id"];
  studentId: Student["id"];
  studentName: string;
  patternLabel: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggestedAction: string;
}

export interface ReadingTaskCoverage {
  type: ReadingTaskType;
  title: string;
  description: string;
}
