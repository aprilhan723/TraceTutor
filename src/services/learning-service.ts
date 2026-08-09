import { getPracticeItem } from "@/data/practice-content";
import {
  LocalDemoLearningRepository,
  type KeyValueStore,
} from "@/data/local-demo-learning-repository";
import { demoStudent, demoTutor } from "@/data/mock-data";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type {
  AnswerDraft,
  OnboardingProfile,
  ReviewSchedule,
  StudentStudyState,
  StudyAttempt,
} from "@/domain/study";
import type { Clock } from "@/lib/clock";
import { addDays, FixedClock } from "@/lib/clock";
import { evaluatePracticeItem } from "@/services/answer-evaluation";
import {
  createMissionForState,
  getDueReviews,
  getProgramDateKey,
} from "@/services/mission-engine";
import { calculateProgressMetrics } from "@/services/study-analytics";

export class LearningService {
  constructor(
    private readonly repository: LearningRepository,
    private readonly clock: Clock = new FixedClock(),
  ) {}

  async getStudentHome(studentId: string) {
    const [student, mission, patterns] = await Promise.all([
      this.repository.getStudent(studentId),
      this.repository.getTodayMission(studentId),
      this.repository.getMistakePatterns(studentId),
    ]);

    if (!student) {
      return null;
    }

    return { student, mission, patterns };
  }

  async getTutorDashboard(tutorId: string) {
    const [tutor, students, interventions] = await Promise.all([
      this.repository.getTutor(tutorId),
      this.repository.getStudentsForTutor(tutorId),
      this.repository.getInterventions(tutorId),
    ]);

    if (!tutor) {
      return null;
    }

    return { tutor, students, interventions };
  }

  async getStudyState(studentId: string) {
    const state = await this.repository.getStudyState(studentId);
    if (state.onboarding && !state.activeMission) {
      return this.prepareNextMissionFromState(state);
    }
    return state;
  }

  async saveOnboarding(
    studentId: string,
    profile: Omit<OnboardingProfile, "completedAt">,
  ) {
    const state = await this.repository.getStudyState(studentId);
    const nextState: StudentStudyState = {
      ...state,
      onboarding: {
        ...profile,
        completedAt: this.clock.now().toISOString(),
      },
      updatedAt: this.clock.now().toISOString(),
    };
    return this.prepareNextMissionFromState(nextState);
  }

  async startMission(studentId: string, missionId: string) {
    const state = await this.repository.getStudyState(studentId);
    if (!state.activeMission || state.activeMission.id !== missionId) {
      return state;
    }
    const nextState: StudentStudyState = {
      ...state,
      activeMission: {
        ...state.activeMission,
        startedAt:
          state.activeMission.startedAt ?? this.clock.now().toISOString(),
        lastSavedAt: this.clock.now().toISOString(),
      },
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  async saveDraft(
    studentId: string,
    missionId: string,
    entryId: string,
    patch: Partial<AnswerDraft>,
  ) {
    const state = await this.repository.getStudyState(studentId);
    const mission = state.activeMission;
    if (
      !mission ||
      mission.id !== missionId ||
      mission.attemptIdsByEntry[entryId]
    ) {
      return state;
    }

    const existing = mission.drafts[entryId] ?? {
      evidenceSegmentIds: [],
      savedAt: this.clock.now().toISOString(),
    };
    const nextState: StudentStudyState = {
      ...state,
      activeMission: {
        ...mission,
        drafts: {
          ...mission.drafts,
          [entryId]: {
            ...existing,
            ...patch,
            savedAt: this.clock.now().toISOString(),
          },
        },
        lastSavedAt: this.clock.now().toISOString(),
      },
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  async saveElapsedSeconds(
    studentId: string,
    missionId: string,
    elapsedSeconds: number,
  ) {
    const state = await this.repository.getStudyState(studentId);
    if (!state.activeMission || state.activeMission.id !== missionId) {
      return state;
    }
    const nextState: StudentStudyState = {
      ...state,
      activeMission: {
        ...state.activeMission,
        elapsedSeconds,
        lastSavedAt: this.clock.now().toISOString(),
      },
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  async submitEntry(studentId: string, missionId: string, entryId: string) {
    const state = await this.repository.getStudyState(studentId);
    const mission = state.activeMission;
    if (
      !mission ||
      mission.id !== missionId ||
      mission.attemptIdsByEntry[entryId]
    ) {
      return state;
    }
    const entry = mission.items.find((item) => item.entryId === entryId);
    const item = entry ? getPracticeItem(entry.itemId) : null;
    const draft = mission.drafts[entryId];
    if (!entry || !item || !draft) {
      return state;
    }

    const evaluation = evaluatePracticeItem(item, draft);
    const attemptId = `attempt-${mission.id}-${entryId}`;
    const attempt: StudyAttempt = {
      id: attemptId,
      missionId,
      missionEntryId: entryId,
      itemId: item.id,
      taskType: item.taskType,
      response: evaluation.response,
      confidence: draft.confidence ?? null,
      evidenceSegmentIds: draft.evidenceSegmentIds,
      correct: evaluation.correct,
      evidenceCorrect: evaluation.evidenceCorrect,
      result: evaluation.result,
      submittedAt: this.clock.now().toISOString(),
      reviewOfAttemptId:
        entry.reviewScheduleId === undefined
          ? null
          : (state.reviewSchedules.find(
              (review) => review.id === entry.reviewScheduleId,
            )?.sourceAttemptId ?? null),
    };

    const reviewSchedules = state.reviewSchedules.map((review) =>
      review.id === entry.reviewScheduleId
        ? { ...review, completedAt: this.clock.now().toISOString() }
        : review,
    );
    const schedulesWithNewReviews =
      entry.part === "review" || evaluation.result === "secure"
        ? reviewSchedules
        : [
            ...reviewSchedules,
            ...this.createReviewSchedules(attempt, mission.dateKey),
          ];

    const patterns = state.patterns.map((pattern) => {
      if (pattern.category !== item.mistakeCategory) {
        return pattern;
      }
      const secureCount =
        pattern.secureCount + (evaluation.result === "secure" ? 1 : 0);
      return {
        ...pattern,
        secureCount,
        recurrenceCount:
          pattern.recurrenceCount + (evaluation.result === "secure" ? 0 : 1),
        status:
          evaluation.result === "diagnose"
            ? ("working" as const)
            : evaluation.result === "unstable"
              ? ("unstable" as const)
              : secureCount >= 3
                ? ("resolved" as const)
                : ("improving" as const),
        lastSeenAt: this.clock.now().toISOString(),
      };
    });

    const nextState: StudentStudyState = {
      ...state,
      attempts: [...state.attempts, attempt],
      reviewSchedules: schedulesWithNewReviews,
      patterns,
      activeMission: {
        ...mission,
        attemptIdsByEntry: {
          ...mission.attemptIdsByEntry,
          [entryId]: attemptId,
        },
        lastSavedAt: this.clock.now().toISOString(),
      },
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  async advanceMission(studentId: string, missionId: string) {
    const state = await this.repository.getStudyState(studentId);
    const mission = state.activeMission;
    if (!mission || mission.id !== missionId) {
      return state;
    }
    const currentEntry = mission.items[mission.currentIndex];
    if (!currentEntry || !mission.attemptIdsByEntry[currentEntry.entryId]) {
      return state;
    }

    if (mission.currentIndex < mission.items.length - 1) {
      const nextState: StudentStudyState = {
        ...state,
        activeMission: {
          ...mission,
          currentIndex: mission.currentIndex + 1,
          lastSavedAt: this.clock.now().toISOString(),
        },
        updatedAt: this.clock.now().toISOString(),
      };
      await this.repository.saveStudyState(nextState);
      return nextState;
    }

    const missionAttempts = state.attempts.filter(
      (attempt) => attempt.missionId === mission.id,
    );
    const completedAt = this.clock.now().toISOString();
    const nextState: StudentStudyState = {
      ...state,
      correctionStreak: state.correctionStreak + 1,
      missionHistory: [
        ...state.missionHistory,
        {
          missionId: mission.id,
          dayNumber: mission.dayNumber,
          dateKey: mission.dateKey,
          title: mission.title,
          completedAt,
          secureCount: missionAttempts.filter(
            (attempt) => attempt.result === "secure",
          ).length,
          attemptCount: missionAttempts.length,
          estimatedMinutes: mission.estimatedMinutes,
        },
      ],
      activeMission: { ...mission, completedAt, lastSavedAt: completedAt },
      updatedAt: completedAt,
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  async prepareNextMission(studentId: string) {
    const state = await this.repository.getStudyState(studentId);
    return this.prepareNextMissionFromState({ ...state, activeMission: null });
  }

  async resetStudyState(studentId: string) {
    return this.repository.resetStudyState(studentId);
  }

  getProgressMetrics(state: StudentStudyState) {
    return calculateProgressMetrics(state);
  }

  getDueReviews(state: StudentStudyState) {
    return getDueReviews(state, this.clock);
  }

  getProgramDateKey(state: StudentStudyState) {
    return getProgramDateKey(state, this.clock);
  }

  private async prepareNextMissionFromState(state: StudentStudyState) {
    const mission = createMissionForState(
      { ...state, activeMission: null },
      this.clock,
    );
    const nextState: StudentStudyState = {
      ...state,
      activeMission: mission,
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveStudyState(nextState);
    return nextState;
  }

  private createReviewSchedules(attempt: StudyAttempt, dateKey: string) {
    const schedules: ReviewSchedule[] = [
      {
        id: `review-${attempt.id}-d2`,
        sourceAttemptId: attempt.id,
        itemId: attempt.itemId,
        cadence: "D2",
        dueDate: addDays(dateKey, 2),
        completedAt: null,
      },
      {
        id: `review-${attempt.id}-d7`,
        sourceAttemptId: attempt.id,
        itemId: attempt.itemId,
        cadence: "D7",
        dueDate: addDays(dateKey, 7),
        completedAt: null,
      },
    ];
    return schedules;
  }
}

export function createBrowserLearningService(storage: KeyValueStore) {
  return new LearningService(
    new LocalDemoLearningRepository(storage),
    new FixedClock(),
  );
}

export const demoLearningService = new LearningService(
  new LocalDemoLearningRepository(),
  new FixedClock(),
);

export const demoIds = {
  student: demoStudent.id,
  tutor: demoTutor.id,
} as const;
