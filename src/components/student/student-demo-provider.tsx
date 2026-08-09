"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Student } from "@/domain/models";
import type {
  AnswerDraft,
  OnboardingProfile,
  StudentProgressMetrics,
  StudentStudyState,
} from "@/domain/study";
import {
  createBrowserLearningService,
  demoLearningService,
  demoIds,
  type LearningService,
} from "@/services/learning-service";

interface StudentDemoContextValue {
  hydrated: boolean;
  student: Student;
  state: StudentStudyState | null;
  programDateKey: string | null;
  dueReviewCount: number;
  metrics: StudentProgressMetrics | null;
  completeOnboarding(
    profile: Omit<OnboardingProfile, "completedAt">,
  ): Promise<void>;
  startMission(missionId: string): Promise<void>;
  saveDraft(
    missionId: string,
    entryId: string,
    patch: Partial<AnswerDraft>,
  ): Promise<void>;
  submitEntry(missionId: string, entryId: string): Promise<void>;
  advanceMission(missionId: string): Promise<StudentStudyState | null>;
  saveElapsedSeconds(missionId: string, seconds: number): Promise<void>;
  prepareNextMission(): Promise<void>;
  resetDemo(): Promise<void>;
}

const StudentDemoContext = createContext<StudentDemoContextValue | null>(null);

export function StudentDemoProvider({
  student,
  children,
}: {
  student: Student;
  children: ReactNode;
}) {
  const [state, setState] = useState<StudentStudyState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [service] = useState<LearningService>(() =>
    typeof window === "undefined"
      ? demoLearningService
      : createBrowserLearningService(window.localStorage),
  );
  const operationQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    void service.getStudyState(demoIds.student).then((savedState) => {
      if (active) {
        setState(savedState);
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, [service]);

  const runOperation = useCallback(
    (operation: (service: LearningService) => Promise<StudentStudyState>) => {
      return new Promise<StudentStudyState | null>((resolve) => {
        operationQueue.current = operationQueue.current.then(async () => {
          const nextState = await operation(service);
          setState(nextState);
          resolve(nextState);
        });
      });
    },
    [service],
  );

  const completeOnboarding = useCallback(
    async (profile: Omit<OnboardingProfile, "completedAt">) => {
      await runOperation((service) =>
        service.saveOnboarding(demoIds.student, profile),
      );
    },
    [runOperation],
  );

  const startMission = useCallback(
    async (missionId: string) => {
      await runOperation((service) =>
        service.startMission(demoIds.student, missionId),
      );
    },
    [runOperation],
  );

  const saveDraft = useCallback(
    async (missionId: string, entryId: string, patch: Partial<AnswerDraft>) => {
      await runOperation((service) =>
        service.saveDraft(demoIds.student, missionId, entryId, patch),
      );
    },
    [runOperation],
  );

  const submitEntry = useCallback(
    async (missionId: string, entryId: string) => {
      await runOperation((service) =>
        service.submitEntry(demoIds.student, missionId, entryId),
      );
    },
    [runOperation],
  );

  const advanceMission = useCallback(
    (missionId: string) =>
      runOperation((service) =>
        service.advanceMission(demoIds.student, missionId),
      ),
    [runOperation],
  );

  const saveElapsedSeconds = useCallback(
    async (missionId: string, seconds: number) => {
      await runOperation((service) =>
        service.saveElapsedSeconds(demoIds.student, missionId, seconds),
      );
    },
    [runOperation],
  );

  const prepareNextMission = useCallback(async () => {
    await runOperation((service) =>
      service.prepareNextMission(demoIds.student),
    );
  }, [runOperation]);

  const resetDemo = useCallback(async () => {
    await runOperation((service) => service.resetStudyState(demoIds.student));
  }, [runOperation]);

  const value = useMemo<StudentDemoContextValue>(() => {
    return {
      hydrated,
      student,
      state,
      programDateKey: state ? service.getProgramDateKey(state) : null,
      dueReviewCount: state ? service.getDueReviews(state).length : 0,
      metrics: state ? service.getProgressMetrics(state) : null,
      completeOnboarding,
      startMission,
      saveDraft,
      submitEntry,
      advanceMission,
      saveElapsedSeconds,
      prepareNextMission,
      resetDemo,
    };
  }, [
    advanceMission,
    completeOnboarding,
    hydrated,
    prepareNextMission,
    resetDemo,
    saveDraft,
    saveElapsedSeconds,
    service,
    startMission,
    state,
    student,
    submitEntry,
  ]);

  return (
    <StudentDemoContext.Provider value={value}>
      {children}
    </StudentDemoContext.Provider>
  );
}

export function useStudentDemo() {
  const value = useContext(StudentDemoContext);
  if (!value) {
    throw new Error("useStudentDemo must be used within StudentDemoProvider");
  }
  return value;
}
