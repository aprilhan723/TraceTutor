import {
  demoInterventions,
  demoMission,
  demoMistakePatterns,
  demoStudent,
  demoTutor,
} from "@/data/mock-data";
import { createInitialStudyState } from "@/data/seed-study-state";
import { createInitialTutorWorkspaceState } from "@/data/seed-tutor-workspace";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type {
  MissionHistoryRecord,
  StudentPatternRecord,
  StudentStudyState,
  StudyAttempt,
  StudyMission,
} from "@/domain/study";
import type { TutorWorkspaceState } from "@/domain/tutor";
import { DEMO_CLOCK_STORAGE_KEY } from "@/lib/clock";

export const DEMO_STUDY_STORAGE_KEY = "tracetutor.demo.study.v4";
export const LEGACY_DEMO_STUDY_V3_STORAGE_KEY = "tracetutor.demo.study.v3";
export const LEGACY_DEMO_STUDY_STORAGE_KEY = "tracetutor.demo.study.v2";
export const DEMO_TUTOR_STORAGE_KEY = "tracetutor.demo.tutor.v1";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryKeyValueStore implements KeyValueStore {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function isStudyState(value: unknown): value is StudentStudyState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StudentStudyState>;
  return (
    candidate.version === 4 &&
    typeof candidate.studentId === "string" &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.reviewSchedules) &&
    Array.isArray(candidate.diagnoses) &&
    Array.isArray(candidate.probeResponses) &&
    Array.isArray(candidate.retentionSchedules) &&
    Array.isArray(candidate.missionHistory) &&
    Array.isArray(candidate.patterns) &&
    Array.isArray(candidate.recoveryPassUses) &&
    Array.isArray(candidate.celebratedMilestones) &&
    Array.isArray(candidate.offlineEvents)
  );
}

type LegacyMission = Omit<StudyMission, "mode"> &
  Partial<Pick<StudyMission, "mode">>;

type LegacyHistory = Omit<
  MissionHistoryRecord,
  "mode" | "correctionStreakEarned" | "streakReason"
> &
  Partial<
    Pick<
      MissionHistoryRecord,
      "mode" | "correctionStreakEarned" | "streakReason"
    >
  >;

interface Phase3StudyState extends Omit<
  StudentStudyState,
  | "version"
  | "recoveryPassUses"
  | "celebratedMilestones"
  | "offlineEvents"
  | "parkedMission"
  | "activeMission"
  | "missionHistory"
> {
  version: 3;
  activeMission: LegacyMission | null;
  missionHistory: LegacyHistory[];
}

function isPhase3StudyState(value: unknown): value is Phase3StudyState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Phase3StudyState>;
  return (
    candidate.version === 3 &&
    typeof candidate.studentId === "string" &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.reviewSchedules) &&
    Array.isArray(candidate.diagnoses) &&
    Array.isArray(candidate.probeResponses) &&
    Array.isArray(candidate.retentionSchedules) &&
    Array.isArray(candidate.missionHistory) &&
    Array.isArray(candidate.patterns)
  );
}

function upgradeMission(mission: LegacyMission | null) {
  return mission ? { ...mission, mode: mission.mode ?? "standard" } : null;
}

function upgradeHistory(history: LegacyHistory[]): MissionHistoryRecord[] {
  return history.map((mission) => {
    const baseline = mission.dayNumber === 0;
    return {
      ...mission,
      mode: mission.mode ?? (baseline ? "tutor-assigned" : "standard"),
      correctionStreakEarned: mission.correctionStreakEarned ?? true,
      streakReason:
        mission.streakReason ??
        (baseline ? "tutor-assigned" : "full-correction-loop"),
    };
  });
}

function migratePhase3State(legacy: Phase3StudyState): StudentStudyState {
  const missionHistory = upgradeHistory(legacy.missionHistory);
  return {
    ...legacy,
    version: 4,
    correctionStreak: missionHistory.filter(
      (mission) => mission.correctionStreakEarned,
    ).length,
    recoveryPasses: 1,
    recoveryPassUses: [],
    celebratedMilestones: [],
    offlineEvents: [],
    activeMission: upgradeMission(legacy.activeMission),
    parkedMission: null,
    missionHistory,
  };
}

type LegacyAttempt = Omit<
  StudyAttempt,
  "answerChanges" | "elapsedSeconds" | "diagnosisId"
> &
  Partial<
    Pick<StudyAttempt, "answerChanges" | "elapsedSeconds" | "diagnosisId">
  >;

type LegacyPattern = Omit<
  StudentPatternRecord,
  | "errorCause"
  | "processStage"
  | "diagnosisIds"
  | "distinctTransferItemIds"
  | "recentEvidence"
  | "retention"
  | "tutorReviewRequired"
> &
  Partial<
    Pick<
      StudentPatternRecord,
      | "errorCause"
      | "processStage"
      | "diagnosisIds"
      | "distinctTransferItemIds"
      | "recentEvidence"
      | "retention"
      | "tutorReviewRequired"
    >
  >;

interface LegacyStudyState extends Omit<
  Phase3StudyState,
  | "version"
  | "attempts"
  | "patterns"
  | "diagnoses"
  | "probeResponses"
  | "retentionSchedules"
> {
  version: 2;
  attempts: LegacyAttempt[];
  patterns: LegacyPattern[];
}

function isLegacyStudyState(value: unknown): value is LegacyStudyState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LegacyStudyState>;
  return (
    candidate.version === 2 &&
    typeof candidate.studentId === "string" &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.reviewSchedules) &&
    Array.isArray(candidate.missionHistory) &&
    Array.isArray(candidate.patterns)
  );
}

function migrateLegacyState(legacy: LegacyStudyState): StudentStudyState {
  const seedPatterns = createInitialStudyState().patterns;
  const phase3: Phase3StudyState = {
    ...legacy,
    version: 3,
    attempts: legacy.attempts.map((attempt) => ({
      ...attempt,
      answerChanges: attempt.answerChanges ?? 0,
      elapsedSeconds: attempt.elapsedSeconds ?? 0,
      diagnosisId: attempt.diagnosisId ?? null,
    })),
    patterns: legacy.patterns.map((pattern) => {
      const seed = seedPatterns.find(
        (candidate) => candidate.category === pattern.category,
      );
      return {
        ...pattern,
        errorCause: pattern.errorCause ?? seed?.errorCause ?? null,
        processStage: pattern.processStage ?? seed?.processStage ?? null,
        diagnosisIds: pattern.diagnosisIds ?? [],
        distinctTransferItemIds: pattern.distinctTransferItemIds ?? [],
        recentEvidence: pattern.recentEvidence ?? [],
        retention: pattern.retention ?? {
          immediate: { outcome: "not-scheduled", dueDate: null },
          d2: { outcome: "not-scheduled", dueDate: null },
          d7: { outcome: "not-scheduled", dueDate: null },
        },
        tutorReviewRequired: pattern.tutorReviewRequired ?? false,
      };
    }),
    diagnoses: [],
    probeResponses: [],
    retentionSchedules: [],
  };
  return migratePhase3State(phase3);
}

function isTutorWorkspace(value: unknown): value is TutorWorkspaceState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TutorWorkspaceState>;
  return (
    candidate.version === 1 &&
    typeof candidate.tutorId === "string" &&
    Array.isArray(candidate.diagnosisCases) &&
    Array.isArray(candidate.studentProfiles) &&
    Array.isArray(candidate.contentVersions) &&
    Array.isArray(candidate.lessonBriefs)
  );
}

export class LocalDemoLearningRepository implements LearningRepository {
  constructor(
    private readonly storage: KeyValueStore = new MemoryKeyValueStore(),
  ) {}

  async getStudent(studentId: string) {
    return studentId === demoStudent.id ? demoStudent : null;
  }

  async getTutor(tutorId: string) {
    return tutorId === demoTutor.id ? demoTutor : null;
  }

  async getStudentsForTutor(tutorId: string) {
    return tutorId === demoTutor.id ? [demoStudent] : [];
  }

  async getTodayMission(studentId: string) {
    return studentId === demoStudent.id ? demoMission : null;
  }

  async getMistakePatterns(studentId: string) {
    return studentId === demoStudent.id ? demoMistakePatterns : [];
  }

  async getInterventions(tutorId: string) {
    return tutorId === demoTutor.id ? demoInterventions : [];
  }

  async getStudyState(studentId: string) {
    if (studentId !== demoStudent.id) {
      return createInitialStudyState();
    }

    const serialized =
      this.storage.getItem(DEMO_STUDY_STORAGE_KEY) ??
      this.storage.getItem(LEGACY_DEMO_STUDY_V3_STORAGE_KEY) ??
      this.storage.getItem(LEGACY_DEMO_STUDY_STORAGE_KEY);
    if (!serialized) {
      return createInitialStudyState();
    }

    try {
      const parsed: unknown = JSON.parse(serialized);
      if (isStudyState(parsed)) return parsed;
      if (isPhase3StudyState(parsed)) {
        const migrated = migratePhase3State(parsed);
        await this.saveStudyState(migrated);
        return migrated;
      }
      if (isLegacyStudyState(parsed)) {
        const migrated = migrateLegacyState(parsed);
        await this.saveStudyState(migrated);
        return migrated;
      }
      return createInitialStudyState();
    } catch {
      return createInitialStudyState();
    }
  }

  async saveStudyState(state: StudentStudyState) {
    this.storage.setItem(DEMO_STUDY_STORAGE_KEY, JSON.stringify(state));
  }

  async resetStudyState(studentId: string) {
    this.storage.removeItem(DEMO_STUDY_STORAGE_KEY);
    this.storage.removeItem(LEGACY_DEMO_STUDY_V3_STORAGE_KEY);
    this.storage.removeItem(LEGACY_DEMO_STUDY_STORAGE_KEY);
    this.storage.removeItem(DEMO_TUTOR_STORAGE_KEY);
    this.storage.removeItem(DEMO_CLOCK_STORAGE_KEY);
    const initialState = createInitialStudyState();
    if (studentId === demoStudent.id) {
      await this.saveStudyState(initialState);
    }
    return initialState;
  }

  async getTutorWorkspace(tutorId: string) {
    if (tutorId !== demoTutor.id) return createInitialTutorWorkspaceState();
    const serialized = this.storage.getItem(DEMO_TUTOR_STORAGE_KEY);
    if (!serialized) return createInitialTutorWorkspaceState();
    try {
      const parsed: unknown = JSON.parse(serialized);
      return isTutorWorkspace(parsed)
        ? parsed
        : createInitialTutorWorkspaceState();
    } catch {
      return createInitialTutorWorkspaceState();
    }
  }

  async saveTutorWorkspace(state: TutorWorkspaceState) {
    this.storage.setItem(DEMO_TUTOR_STORAGE_KEY, JSON.stringify(state));
  }

  async resetTutorWorkspace(tutorId: string) {
    this.storage.removeItem(DEMO_TUTOR_STORAGE_KEY);
    const initialState = createInitialTutorWorkspaceState();
    if (tutorId === demoTutor.id) await this.saveTutorWorkspace(initialState);
    return initialState;
  }
}
