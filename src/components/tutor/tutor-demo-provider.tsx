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
import type {
  ContentEditorDraft,
  TutorAdjudicationCommand,
} from "@/domain/tutor";
import {
  createBrowserLearningService,
  demoIds,
  demoLearningService,
  type LearningService,
} from "@/services/learning-service";

type TutorBundle = NonNullable<
  Awaited<ReturnType<LearningService["getTutorWorkspaceBundle"]>>
>;

interface TutorDemoContextValue {
  hydrated: boolean;
  bundle: TutorBundle | null;
  adjudicate(caseId: string, command: TutorAdjudicationCommand): Promise<void>;
  saveContent(draft: ContentEditorDraft): Promise<Record<string, string>>;
  saveLessonNotes(studentId: string, notes: string): Promise<void>;
  saveStudentNotes(studentId: string, notes: string): Promise<void>;
  resetTutorDemo(): Promise<void>;
}

const TutorDemoContext = createContext<TutorDemoContextValue | null>(null);

export function TutorDemoProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<TutorBundle | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [service] = useState<LearningService>(() =>
    typeof window === "undefined"
      ? demoLearningService
      : createBrowserLearningService(window.localStorage),
  );
  const operationQueue = useRef<Promise<void>>(Promise.resolve());

  const refresh = useCallback(async () => {
    const next = await service.getTutorWorkspaceBundle(
      demoIds.tutor,
      demoIds.student,
    );
    if (next) setBundle(next);
  }, [service]);

  useEffect(() => {
    let active = true;
    void service
      .getTutorWorkspaceBundle(demoIds.tutor, demoIds.student)
      .then((next) => {
        if (active) {
          setBundle(next);
          setHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, [service]);

  const enqueue = useCallback(
    (operation: () => Promise<void>) =>
      new Promise<void>((resolve) => {
        operationQueue.current = operationQueue.current.then(async () => {
          await operation();
          await refresh();
          resolve();
        });
      }),
    [refresh],
  );

  const adjudicate = useCallback(
    (caseId: string, command: TutorAdjudicationCommand) =>
      enqueue(async () => {
        await service.adjudicateDiagnosis(demoIds.tutor, caseId, command);
      }),
    [enqueue, service],
  );

  const saveContent = useCallback(
    (draft: ContentEditorDraft) =>
      new Promise<Record<string, string>>((resolve) => {
        operationQueue.current = operationQueue.current.then(async () => {
          const result = await service.saveTutorContent(demoIds.tutor, draft);
          if (Object.keys(result.errors).length === 0) await refresh();
          resolve(result.errors);
        });
      }),
    [refresh, service],
  );

  const saveLessonNotes = useCallback(
    (studentId: string, notes: string) =>
      enqueue(async () => {
        await service.saveLessonBriefNotes(demoIds.tutor, studentId, notes);
      }),
    [enqueue, service],
  );

  const saveStudentNotes = useCallback(
    (studentId: string, notes: string) =>
      enqueue(async () => {
        await service.saveTutorStudentNotes(demoIds.tutor, studentId, notes);
      }),
    [enqueue, service],
  );

  const resetTutorDemo = useCallback(
    () =>
      enqueue(async () => {
        await service.resetTutorWorkspace(demoIds.tutor);
      }),
    [enqueue, service],
  );

  const value = useMemo<TutorDemoContextValue>(
    () => ({
      hydrated,
      bundle,
      adjudicate,
      saveContent,
      saveLessonNotes,
      saveStudentNotes,
      resetTutorDemo,
    }),
    [
      adjudicate,
      bundle,
      hydrated,
      resetTutorDemo,
      saveContent,
      saveLessonNotes,
      saveStudentNotes,
    ],
  );

  return (
    <TutorDemoContext.Provider value={value}>
      {children}
    </TutorDemoContext.Provider>
  );
}

export function useTutorDemo() {
  const value = useContext(TutorDemoContext);
  if (!value) {
    throw new Error("useTutorDemo must be used within TutorDemoProvider");
  }
  return value;
}
