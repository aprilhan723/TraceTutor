import {
  demoInterventions,
  demoMission,
  demoMistakePatterns,
  demoStudent,
  demoTutor,
} from "@/data/mock-data";
import { createInitialStudyState } from "@/data/seed-study-state";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type { StudentStudyState } from "@/domain/study";

export const DEMO_STUDY_STORAGE_KEY = "tracetutor.demo.study.v2";

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
    candidate.version === 2 &&
    typeof candidate.studentId === "string" &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.reviewSchedules) &&
    Array.isArray(candidate.missionHistory) &&
    Array.isArray(candidate.patterns)
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

    const serialized = this.storage.getItem(DEMO_STUDY_STORAGE_KEY);
    if (!serialized) {
      return createInitialStudyState();
    }

    try {
      const parsed: unknown = JSON.parse(serialized);
      return isStudyState(parsed) ? parsed : createInitialStudyState();
    } catch {
      return createInitialStudyState();
    }
  }

  async saveStudyState(state: StudentStudyState) {
    this.storage.setItem(DEMO_STUDY_STORAGE_KEY, JSON.stringify(state));
  }

  async resetStudyState(studentId: string) {
    this.storage.removeItem(DEMO_STUDY_STORAGE_KEY);
    const initialState = createInitialStudyState();
    if (studentId === demoStudent.id) {
      await this.saveStudyState(initialState);
    }
    return initialState;
  }
}
