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
import type { AiDiagnosisInput } from "@/domain/ai-diagnosis";
import { aiDiagnosisDecisionSchema } from "@/ai/schemas";
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
  requestAiSuggestion(caseId: string, input: AiDiagnosisInput): Promise<string>;
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

  const requestAiSuggestion = useCallback(
    async (caseId: string, input: AiDiagnosisInput) => {
      let response: Response;
      try {
        response = await fetch("/api/ai/diagnosis", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: crypto.randomUUID(), input }),
        });
      } catch {
        return "AI assist is unavailable. Continue with the rule trace.";
      }
      const parsed = aiDiagnosisDecisionSchema.safeParse(
        await response.json().catch(() => null),
      );
      if (!response.ok || !parsed.success) {
        return "AI assist returned an invalid response. Continue with the rule trace.";
      }
      if (parsed.data.status === "fallback") return parsed.data.message;
      const audit = parsed.data.audit;
      if (!audit) {
        return "AI assist returned an invalid response. Continue with the rule trace.";
      }
      await enqueue(async () => {
        await service.recordAiSuggestion(demoIds.tutor, caseId, audit);
      });
      return "AI suggestion saved for tutor review.";
    },
    [enqueue, service],
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
      requestAiSuggestion,
      saveContent,
      saveLessonNotes,
      saveStudentNotes,
      resetTutorDemo,
    }),
    [
      adjudicate,
      bundle,
      hydrated,
      requestAiSuggestion,
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
