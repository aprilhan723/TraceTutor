import { getPracticeItem } from "@/data/practice-content";
import {
  getCompleteWordsMetadata,
  getItemDiagnosticMetadata,
} from "@/data/diagnostic-metadata";
import { getDiagnosticProbe } from "@/data/diagnostic-probes";
import {
  LocalDemoLearningRepository,
  type KeyValueStore,
} from "@/data/local-demo-learning-repository";
import { demoStudent, demoTutor } from "@/data/mock-data";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type {
  AnswerDraft,
  OnboardingProfile,
  PracticeItem,
  StudentPatternRecord,
  StudentStudyState,
  StudyAttempt,
} from "@/domain/study";
import type {
  ContentEditorDraft,
  TutorAdjudicationCommand,
  TutorWorkspaceState,
} from "@/domain/tutor";
import {
  errorCauseLabels,
  processStageLabels,
  type DiagnosisRecord,
  type DiagnosisResult,
  type ErrorCause,
  type ProbeResponse,
  type RetentionCadence,
  type RetentionSchedule,
} from "@/domain/mistake-intelligence";
import type { Clock } from "@/lib/clock";
import { FixedClock } from "@/lib/clock";
import { evaluatePracticeItem } from "@/services/answer-evaluation";
import { analyzeCompleteWordsResponse } from "@/services/complete-words-analysis";
import {
  diagnoseAttempt,
  refineDiagnosisWithProbe,
} from "@/services/diagnosis-service";
import {
  createMissionForState,
  getDueReviews,
  getDueRetentionSchedules,
  getProgramDateKey,
} from "@/services/mission-engine";
import {
  calculateVecr7,
  createRetentionSchedules,
  transitionPatternStatus,
} from "@/services/retention-engine";
import { calculateProgressMetrics } from "@/services/study-analytics";
import {
  applyTutorAdjudication,
  buildContentLibrary,
  buildContentEditorDrafts,
  buildLessonBrief,
  buildTutorDiagnosisDetail,
  buildTutorDashboard,
  calculateWeeklyReport,
  saveContentVersion,
  updateLessonNotes,
  updateTutorStudentNotes,
} from "@/services/tutor-operations";

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

  async getTutorWorkspaceBundle(tutorId: string, studentId: string) {
    const [tutor, students, workspace, studyState] = await Promise.all([
      this.repository.getTutor(tutorId),
      this.repository.getStudentsForTutor(tutorId),
      this.repository.getTutorWorkspace(tutorId),
      this.repository.getStudyState(studentId),
    ]);
    if (!tutor) return null;
    const todayKey = this.clock.now().toISOString().slice(0, 10);
    return {
      tutor,
      students,
      workspace,
      studyState,
      todayKey,
      dashboard: buildTutorDashboard(workspace, studyState, todayKey),
      caseDetails: workspace.diagnosisCases.map(buildTutorDiagnosisDetail),
      contentLibrary: buildContentLibrary(workspace),
      contentEditorDrafts: buildContentEditorDrafts(workspace),
      lessonBrief: buildLessonBrief(
        workspace,
        studentId,
        this.clock.now().toISOString(),
      ),
      weeklyReport: calculateWeeklyReport(workspace, studentId),
    };
  }

  async adjudicateDiagnosis(
    tutorId: string,
    caseId: string,
    command: TutorAdjudicationCommand,
  ) {
    const workspace = await this.repository.getTutorWorkspace(tutorId);
    const next = applyTutorAdjudication(
      workspace,
      caseId,
      command,
      tutorId,
      this.clock.now().toISOString(),
    );
    await this.repository.saveTutorWorkspace(next);
    return next;
  }

  async saveTutorContent(tutorId: string, draft: ContentEditorDraft) {
    const workspace = await this.repository.getTutorWorkspace(tutorId);
    const result = saveContentVersion(
      workspace.contentVersions,
      draft,
      tutorId,
      this.clock.now().toISOString(),
    );
    if (Object.keys(result.errors).length > 0) {
      return { workspace, errors: result.errors };
    }
    const next: TutorWorkspaceState = {
      ...workspace,
      contentVersions: result.versions,
      updatedAt: this.clock.now().toISOString(),
    };
    await this.repository.saveTutorWorkspace(next);
    return { workspace: next, errors: result.errors };
  }

  async saveLessonBriefNotes(
    tutorId: string,
    studentId: string,
    tutorNotes: string,
  ) {
    const workspace = await this.repository.getTutorWorkspace(tutorId);
    const next = updateLessonNotes(
      workspace,
      studentId,
      tutorNotes,
      this.clock.now().toISOString(),
    );
    await this.repository.saveTutorWorkspace(next);
    return next;
  }

  async saveTutorStudentNotes(
    tutorId: string,
    studentId: string,
    tutorNotes: string,
  ) {
    const workspace = await this.repository.getTutorWorkspace(tutorId);
    const next = updateTutorStudentNotes(
      workspace,
      studentId,
      tutorNotes,
      this.clock.now().toISOString(),
    );
    await this.repository.saveTutorWorkspace(next);
    return next;
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

  async submitEntry(
    studentId: string,
    missionId: string,
    entryId: string,
    elapsedSeconds = 0,
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
    const entry = mission.items.find((item) => item.entryId === entryId);
    const item = entry ? getPracticeItem(entry.itemId) : null;
    const draft = mission.drafts[entryId];
    if (!entry || !item || !draft) {
      return state;
    }

    const evaluation = evaluatePracticeItem(item, draft);
    const attemptId = `attempt-${mission.id}-${entryId}`;
    const diagnosisResult = this.createDiagnosisResult(
      state,
      item,
      draft,
      elapsedSeconds,
    );
    const diagnosisId = diagnosisResult ? `diagnosis-${attemptId}` : null;
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
      answerChanges: draft.answerChanges ?? 0,
      elapsedSeconds,
      diagnosisId,
      submittedAt: this.clock.now().toISOString(),
      reviewOfAttemptId:
        entry.reviewScheduleId !== undefined
          ? (state.reviewSchedules.find(
              (review) => review.id === entry.reviewScheduleId,
            )?.sourceAttemptId ?? null)
          : entry.sourceDiagnosisId
            ? (state.diagnoses.find(
                (diagnosis) => diagnosis.id === entry.sourceDiagnosisId,
              )?.attemptId ?? null)
            : null,
    };

    const diagnosis: DiagnosisRecord | null =
      diagnosisResult && diagnosisId
        ? {
            ...diagnosisResult,
            id: diagnosisId,
            attemptId,
            itemId: item.id,
            taskType: item.taskType,
            skill: getItemDiagnosticMetadata(item).skill,
            createdAt: this.clock.now().toISOString(),
            probeResponseId: null,
            probeResolvedAt: null,
          }
        : null;

    const reviewSchedules = state.reviewSchedules.map((review) =>
      review.id === entry.reviewScheduleId
        ? { ...review, completedAt: this.clock.now().toISOString() }
        : review,
    );
    let retentionSchedules = state.retentionSchedules.map((schedule) =>
      schedule.id === entry.retentionScheduleId
        ? {
            ...schedule,
            completedAt: this.clock.now().toISOString(),
            completedAttemptId: attemptId,
            outcome:
              evaluation.result === "secure"
                ? ("secure" as const)
                : ("needs-work" as const),
          }
        : schedule,
    );
    const newRetentionSchedules =
      diagnosis?.primaryHypothesis && diagnosis.outcome !== "secure"
        ? createRetentionSchedules(diagnosis, mission.dateKey, item.taskType, [
            ...mission.items.map((missionItem) => missionItem.itemId),
          ])
        : [];
    retentionSchedules = [...retentionSchedules, ...newRetentionSchedules];

    const immediateSchedule = newRetentionSchedules.find(
      (schedule) => schedule.cadence === "immediate",
    );
    const missionItems = [...mission.items];
    if (
      immediateSchedule &&
      !missionItems.some(
        (missionItem) => missionItem.itemId === immediateSchedule.itemId,
      )
    ) {
      const currentIndex = missionItems.findIndex(
        (missionItem) => missionItem.entryId === entryId,
      );
      missionItems.splice(currentIndex + 1, 0, {
        entryId: `retention-${immediateSchedule.id}`,
        itemId: immediateSchedule.itemId,
        part: "transfer",
        retentionScheduleId: immediateSchedule.id,
        retentionCadence: "immediate",
        sourceDiagnosisId: diagnosis?.id,
      });
    }

    const patterns = this.updatePatterns({
      state,
      item,
      attempt,
      diagnosis,
      retentionSchedules,
      completedRetentionScheduleId: entry.retentionScheduleId ?? null,
    });

    const nextState: StudentStudyState = {
      ...state,
      attempts: [...state.attempts, attempt],
      diagnoses: diagnosis ? [...state.diagnoses, diagnosis] : state.diagnoses,
      retentionSchedules,
      reviewSchedules,
      patterns,
      activeMission: {
        ...mission,
        items: missionItems,
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

  async completeProbe(
    studentId: string,
    diagnosisId: string,
    selectedOptionId: string,
  ) {
    const state = await this.repository.getStudyState(studentId);
    const diagnosis = state.diagnoses.find(
      (candidate) => candidate.id === diagnosisId,
    );
    if (
      !diagnosis ||
      !diagnosis.recommendedProbeCode ||
      diagnosis.probeResponseId
    ) {
      return state;
    }
    const probe = getDiagnosticProbe(diagnosis.recommendedProbeCode);
    const selected = probe?.options.find(
      (option) => option.id === selectedOptionId,
    );
    if (!probe || !selected) return state;

    const response: ProbeResponse = {
      id: `probe-response-${diagnosis.id}`,
      diagnosisId: diagnosis.id,
      probeCode: probe.code,
      selectedOptionId,
      correct: selectedOptionId === probe.correctOptionId,
      interpretation: selected.interpretation,
      submittedAt: this.clock.now().toISOString(),
    };
    const refined = refineDiagnosisWithProbe(
      diagnosis,
      probe,
      selectedOptionId,
    );
    const nextState: StudentStudyState = {
      ...state,
      diagnoses: state.diagnoses.map((candidate) =>
        candidate.id === diagnosis.id
          ? {
              ...candidate,
              ...refined,
              probeResponseId: response.id,
              probeResolvedAt: this.clock.now().toISOString(),
            }
          : candidate,
      ),
      probeResponses: [...state.probeResponses, response],
      patterns: state.patterns.map((pattern) =>
        pattern.diagnosisIds.includes(diagnosis.id)
          ? {
              ...pattern,
              tutorReviewRequired:
                pattern.tutorReviewRequired || refined.tutorReviewRequired,
            }
          : pattern,
      ),
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
    const currentAttempt = state.attempts.find(
      (attempt) =>
        attempt.id === mission.attemptIdsByEntry[currentEntry.entryId],
    );
    const pendingDiagnosis = currentAttempt?.diagnosisId
      ? state.diagnoses.find(
          (diagnosis) => diagnosis.id === currentAttempt.diagnosisId,
        )
      : null;
    if (
      pendingDiagnosis?.recommendedProbeCode &&
      !pendingDiagnosis.probeResponseId
    ) {
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
    const state = await this.repository.resetStudyState(studentId);
    await this.repository.resetTutorWorkspace(demoTutor.id);
    return state;
  }

  async resetTutorWorkspace(tutorId: string) {
    return this.repository.resetTutorWorkspace(tutorId);
  }

  getProgressMetrics(state: StudentStudyState) {
    return calculateProgressMetrics(state);
  }

  getDueReviews(state: StudentStudyState) {
    return [
      ...getDueRetentionSchedules(state, this.clock),
      ...getDueReviews(state, this.clock),
    ];
  }

  getProgramDateKey(state: StudentStudyState) {
    return getProgramDateKey(state, this.clock);
  }

  getVecr7(state: StudentStudyState) {
    return calculateVecr7(state, getProgramDateKey(state, this.clock));
  }

  private createDiagnosisResult(
    state: StudentStudyState,
    item: PracticeItem,
    draft: AnswerDraft,
    elapsedSeconds: number,
  ): DiagnosisResult | null {
    if (item.kind === "transfer") return null;
    const evaluation = evaluatePracticeItem(item, draft);

    if (item.kind !== "complete-words" && evaluation.result === "secure") {
      return null;
    }

    if (item.kind === "complete-words") {
      if (evaluation.correct) return null;
      const metadata = getCompleteWordsMetadata(item.id);
      if (!metadata) return null;
      const analysis = analyzeCompleteWordsResponse(
        metadata,
        item.wordPrefix,
        draft.typedAnswer ?? "",
      );
      const processStage =
        analysis.primaryCause === "lexical-meaning-failure"
          ? ("evidence-interpretation" as const)
          : ("constraint-application" as const);
      return {
        observations: [
          ...analysis.observations,
          ...(elapsedSeconds < 3
            ? [
                {
                  code: "timing-fast",
                  label: "Faster than this item’s review range",
                  detail:
                    "The response was unusually fast. This is context only, not a claimed cause.",
                },
              ]
            : []),
        ],
        behavioralContext: elapsedSeconds < 3 ? ["unusually-fast"] : [],
        primaryHypothesis: analysis.primaryCause,
        secondaryHypotheses: [],
        confidence: analysis.primaryCause === "spelling-failure" ? 0.9 : 0.78,
        supportingEvidence: analysis.supportingEvidence,
        recommendedProbeCode: null,
        tutorReviewRequired: analysis.tutorReviewRequired,
        nextRemediationTarget: {
          processStage,
          errorCause: analysis.primaryCause,
          label: analysis.primaryCause
            ? `${processStageLabels[processStage]} · ${errorCauseLabels[analysis.primaryCause]}`
            : processStageLabels[processStage],
        },
        interventionPriority: analysis.tutorReviewRequired ? "medium" : "low",
        outcome: evaluation.result,
        distractorRelation: null,
      };
    }

    const metadata = getItemDiagnosticMetadata(item);
    const priorCauseCounts: Partial<Record<ErrorCause, number>> = {};
    for (const diagnosis of state.diagnoses) {
      if (diagnosis.primaryHypothesis) {
        priorCauseCounts[diagnosis.primaryHypothesis] =
          (priorCauseCounts[diagnosis.primaryHypothesis] ?? 0) + 1;
      }
    }
    return diagnoseAttempt({
      metadata,
      selectedOptionId: draft.selectedOptionId ?? "",
      selectedEvidenceSegmentIds: draft.evidenceSegmentIds,
      confidence: draft.confidence ?? null,
      elapsedSeconds,
      answerChanges: draft.answerChanges ?? 0,
      history: {
        priorCauseCounts,
        priorWrongCount: state.attempts.filter(
          (attempt) => attempt.itemId === item.id && !attempt.correct,
        ).length,
      },
    });
  }

  private updatePatterns({
    state,
    item,
    attempt,
    diagnosis,
    retentionSchedules,
    completedRetentionScheduleId,
  }: {
    state: StudentStudyState;
    item: PracticeItem;
    attempt: StudyAttempt;
    diagnosis: DiagnosisRecord | null;
    retentionSchedules: RetentionSchedule[];
    completedRetentionScheduleId: string | null;
  }): StudentPatternRecord[] {
    const now = this.clock.now().toISOString();
    if (diagnosis?.primaryHypothesis) {
      const existingIndex = state.patterns.findIndex(
        (pattern) => pattern.errorCause === diagnosis.primaryHypothesis,
      );
      const existing = state.patterns[existingIndex];
      const recurrenceCount =
        (existing?.recurrenceCount ?? 0) +
        (attempt.result === "secure" ? 0 : 1);
      const diagnosisSchedules = retentionSchedules.filter(
        (schedule) => schedule.diagnosisId === diagnosis.id,
      );
      const retention = existing
        ? { ...existing.retention }
        : {
            immediate: {
              outcome: "not-scheduled" as const,
              dueDate: null,
            },
            d2: { outcome: "not-scheduled" as const, dueDate: null },
            d7: { outcome: "not-scheduled" as const, dueDate: null },
          };
      for (const schedule of diagnosisSchedules) {
        retention[this.retentionKey(schedule.cadence)] = {
          outcome: schedule.outcome,
          dueDate: schedule.dueDate,
        };
      }
      const nextPattern: StudentPatternRecord = {
        id: existing?.id ?? `pattern-${diagnosis.primaryHypothesis}`,
        category: item.mistakeCategory,
        label: errorCauseLabels[diagnosis.primaryHypothesis],
        description: `The observable trace is most consistent with ${errorCauseLabels[diagnosis.primaryHypothesis].toLocaleLowerCase("en")}. This remains a reviewable hypothesis.`,
        status: transitionPatternStatus({
          currentStatus: existing?.status ?? "new",
          outcome: diagnosis.outcome,
          cadence: null,
          distinctTransferItemCount:
            existing?.distinctTransferItemIds.length ?? 0,
          recurrenceCount,
        }),
        errorCause: diagnosis.primaryHypothesis,
        processStage: diagnosis.nextRemediationTarget.processStage,
        recurrenceCount,
        secureCount:
          (existing?.secureCount ?? 0) + (attempt.result === "secure" ? 1 : 0),
        diagnosisIds: [...(existing?.diagnosisIds ?? []), diagnosis.id],
        distinctTransferItemIds: existing?.distinctTransferItemIds ?? [],
        recentEvidence: [
          {
            attemptId: attempt.id,
            summary: diagnosis.supportingEvidence[0] ?? "Attempt observed.",
            observedAt: now,
          },
          ...(existing?.recentEvidence ?? []),
        ].slice(0, 3),
        retention,
        tutorReviewRequired:
          (existing?.tutorReviewRequired ?? false) ||
          diagnosis.tutorReviewRequired,
        lastSeenAt: now,
      };
      if (existingIndex < 0) return [...state.patterns, nextPattern];
      return state.patterns.map((pattern, index) =>
        index === existingIndex ? nextPattern : pattern,
      );
    }

    if (completedRetentionScheduleId) {
      const completedSchedule = retentionSchedules.find(
        (schedule) => schedule.id === completedRetentionScheduleId,
      );
      const sourceDiagnosis = completedSchedule
        ? state.diagnoses.find(
            (candidate) => candidate.id === completedSchedule.diagnosisId,
          )
        : null;
      if (completedSchedule && sourceDiagnosis?.primaryHypothesis) {
        return state.patterns.map((pattern) => {
          if (pattern.errorCause !== sourceDiagnosis.primaryHypothesis) {
            return pattern;
          }
          const distinctTransferItemIds = [
            ...new Set([...pattern.distinctTransferItemIds, item.id]),
          ];
          const recurrenceCount =
            pattern.recurrenceCount + (attempt.result === "secure" ? 0 : 1);
          return {
            ...pattern,
            status: transitionPatternStatus({
              currentStatus: pattern.status,
              outcome: attempt.result,
              cadence: completedSchedule.cadence,
              distinctTransferItemCount: distinctTransferItemIds.length,
              recurrenceCount,
            }),
            recurrenceCount,
            secureCount:
              pattern.secureCount + (attempt.result === "secure" ? 1 : 0),
            distinctTransferItemIds,
            recentEvidence: [
              {
                attemptId: attempt.id,
                summary: `${completedSchedule.cadence} transfer was ${attempt.result}.`,
                observedAt: now,
              },
              ...pattern.recentEvidence,
            ].slice(0, 3),
            retention: {
              ...pattern.retention,
              [this.retentionKey(completedSchedule.cadence)]: {
                outcome: completedSchedule.outcome,
                dueDate: completedSchedule.dueDate,
              },
            },
            tutorReviewRequired:
              pattern.tutorReviewRequired || attempt.result === "diagnose",
            lastSeenAt: now,
          };
        });
      }
    }

    return state.patterns.map((pattern) => {
      if (pattern.category !== item.mistakeCategory) return pattern;
      const recurrenceCount =
        pattern.recurrenceCount + (attempt.result === "secure" ? 0 : 1);
      return {
        ...pattern,
        status: transitionPatternStatus({
          currentStatus: pattern.status,
          outcome: attempt.result,
          cadence: null,
          distinctTransferItemCount: pattern.distinctTransferItemIds.length,
          recurrenceCount,
        }),
        recurrenceCount,
        secureCount:
          pattern.secureCount + (attempt.result === "secure" ? 1 : 0),
        recentEvidence: [
          {
            attemptId: attempt.id,
            summary: `${item.title}: ${attempt.result}.`,
            observedAt: now,
          },
          ...pattern.recentEvidence,
        ].slice(0, 3),
        lastSeenAt: now,
      };
    });
  }

  private retentionKey(cadence: RetentionCadence): "immediate" | "d2" | "d7" {
    if (cadence === "immediate") return "immediate";
    return cadence === "D2" ? "d2" : "d7";
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
