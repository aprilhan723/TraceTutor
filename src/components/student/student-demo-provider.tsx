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
  MilestoneId,
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
import type { Vecr7Metric } from "@/services/retention-engine";
import type {
  MilestoneMoment,
  SprintRoadmapDay,
  WeeklyBossPreview,
} from "@/services/engagement-engine";

interface StudentDemoContextValue {
  hydrated: boolean;
  student: Student;
  state: StudentStudyState | null;
  programDateKey: string | null;
  dueReviewCount: number;
  metrics: StudentProgressMetrics | null;
  vecr7: Vecr7Metric | null;
  isOffline: boolean;
  queuedOfflineCount: number;
  sprintRoadmap: SprintRoadmapDay[];
  recoveryPass: {
    period: 1 | 2;
    available: boolean;
    protectedDate: string | null;
  } | null;
  weeklyBoss: WeeklyBossPreview | null;
  getMilestones(verifiedCorrectionCount: number): MilestoneMoment[];
  completeOnboarding(
    profile: Omit<OnboardingProfile, "completedAt">,
  ): Promise<void>;
  startMission(missionId: string): Promise<void>;
  saveDraft(
    missionId: string,
    entryId: string,
    patch: Partial<AnswerDraft>,
  ): Promise<void>;
  submitEntry(
    missionId: string,
    entryId: string,
    elapsedSeconds?: number,
  ): Promise<void>;
  completeProbe(diagnosisId: string, selectedOptionId: string): Promise<void>;
  advanceMission(missionId: string): Promise<StudentStudyState | null>;
  saveElapsedSeconds(missionId: string, seconds: number): Promise<void>;
  prepareNextMission(): Promise<void>;
  useLightDay(): Promise<void>;
  useRecoveryPass(): Promise<void>;
  startWeeklyBoss(): Promise<StudentStudyState | null>;
  celebrateMilestone(milestoneId: MilestoneId): Promise<void>;
  setDemoProgramDate(dateKey: string): Promise<void>;
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
  const [isOffline, setIsOffline] = useState(false);
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
    async (missionId: string, entryId: string, elapsedSeconds = 0) => {
      await runOperation((service) =>
        service.submitEntry(
          demoIds.student,
          missionId,
          entryId,
          elapsedSeconds,
          typeof navigator !== "undefined" && !navigator.onLine,
        ),
      );
    },
    [runOperation],
  );

  const completeProbe = useCallback(
    async (diagnosisId: string, selectedOptionId: string) => {
      await runOperation((service) =>
        service.completeProbe(demoIds.student, diagnosisId, selectedOptionId),
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

  const useLightDay = useCallback(async () => {
    await runOperation((service) => service.useLightDay(demoIds.student));
  }, [runOperation]);

  const useRecoveryPass = useCallback(async () => {
    await runOperation((service) => service.useRecoveryPass(demoIds.student));
  }, [runOperation]);

  const startWeeklyBoss = useCallback(
    () => runOperation((service) => service.startWeeklyBoss(demoIds.student)),
    [runOperation],
  );

  const celebrateMilestone = useCallback(
    async (milestoneId: MilestoneId) => {
      await runOperation((service) =>
        service.celebrateMilestone(demoIds.student, milestoneId),
      );
    },
    [runOperation],
  );

  const setDemoProgramDate = useCallback(
    async (dateKey: string) => {
      await runOperation((service) =>
        service.setDemoProgramDate(demoIds.student, dateKey),
      );
    },
    [runOperation],
  );

  useEffect(() => {
    function markOffline() {
      setIsOffline(true);
    }
    function markOnline() {
      setIsOffline(false);
      void runOperation((service) =>
        service.reconcileOfflineEvents(demoIds.student),
      );
    }
    if (!navigator.onLine) markOffline();
    else markOnline();
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
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
      vecr7: state ? service.getVecr7(state) : null,
      isOffline,
      queuedOfflineCount:
        state?.offlineEvents.filter((event) => event.status === "queued")
          .length ?? 0,
      sprintRoadmap: state ? service.getSprintRoadmap(state) : [],
      recoveryPass: state ? service.getRecoveryPassAvailability(state) : null,
      weeklyBoss: state ? service.getWeeklyBossPreview(state) : null,
      getMilestones: (verifiedCorrectionCount) =>
        state ? service.getMilestones(state, verifiedCorrectionCount) : [],
      completeOnboarding,
      startMission,
      saveDraft,
      submitEntry,
      completeProbe,
      advanceMission,
      saveElapsedSeconds,
      prepareNextMission,
      useLightDay,
      useRecoveryPass,
      startWeeklyBoss,
      celebrateMilestone,
      setDemoProgramDate,
      resetDemo,
    };
  }, [
    advanceMission,
    completeProbe,
    completeOnboarding,
    hydrated,
    isOffline,
    prepareNextMission,
    resetDemo,
    saveDraft,
    saveElapsedSeconds,
    service,
    startMission,
    startWeeklyBoss,
    state,
    student,
    submitEntry,
    celebrateMilestone,
    setDemoProgramDate,
    useLightDay,
    useRecoveryPass,
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
