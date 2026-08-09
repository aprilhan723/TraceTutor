import { reviewedTransferBank } from "@/data/mistake-transfer-bank";
import type { ReadingTaskType } from "@/domain/models";
import type {
  DiagnosisRecord,
  ErrorCause,
  RetentionCadence,
  RetentionSchedule,
} from "@/domain/mistake-intelligence";
import type { PatternStatus, StudentStudyState } from "@/domain/study";
import { addDays } from "@/lib/clock";

const cadenceOffsets: Record<RetentionCadence, number> = {
  immediate: 0,
  D2: 2,
  D7: 7,
};

export function selectTransferSequence(
  errorCause: ErrorCause,
  sourceTaskType: ReadingTaskType,
  excludedItemIds: string[] = [],
) {
  const excluded = new Set(excludedItemIds);
  return reviewedTransferBank
    .filter(
      (entry) =>
        entry.errorCauses.includes(errorCause) && !excluded.has(entry.item.id),
    )
    .sort((left, right) => {
      const leftMatch = left.sourceTaskTypes.includes(sourceTaskType) ? 1 : 0;
      const rightMatch = right.sourceTaskTypes.includes(sourceTaskType) ? 1 : 0;
      return rightMatch - leftMatch;
    })
    .slice(0, 3);
}

export function createRetentionSchedules(
  diagnosis: DiagnosisRecord,
  dateKey: string,
  sourceTaskType: ReadingTaskType,
  excludedItemIds: string[] = [],
): RetentionSchedule[] {
  if (!diagnosis.primaryHypothesis) return [];
  const transferSequence = selectTransferSequence(
    diagnosis.primaryHypothesis,
    sourceTaskType,
    [diagnosis.itemId, ...excludedItemIds],
  );
  const cadences: RetentionCadence[] = ["immediate", "D2", "D7"];
  return transferSequence.map((entry, index) => {
    const cadence = cadences[index] ?? "D7";
    return {
      id: `retention-${diagnosis.id}-${cadence.toLowerCase()}`,
      diagnosisId: diagnosis.id,
      errorCause: diagnosis.primaryHypothesis!,
      itemId: entry.item.id,
      cadence,
      dueDate: addDays(dateKey, cadenceOffsets[cadence]),
      completedAt: null,
      completedAttemptId: null,
      outcome: "scheduled",
    };
  });
}

export interface PatternTransitionInput {
  currentStatus: PatternStatus;
  outcome: "secure" | "unstable" | "diagnose";
  cadence: RetentionCadence | null;
  distinctTransferItemCount: number;
  recurrenceCount: number;
}

export function transitionPatternStatus({
  currentStatus,
  outcome,
  cadence,
  distinctTransferItemCount,
  recurrenceCount,
}: PatternTransitionInput): PatternStatus {
  if (outcome === "unstable") return "unstable";
  if (outcome === "diagnose") {
    if (
      currentStatus === "improving" ||
      currentStatus === "resolved" ||
      recurrenceCount > 1
    ) {
      return "recurring";
    }
    return "working";
  }
  if (cadence === "D7" && distinctTransferItemCount >= 3) {
    return "resolved";
  }
  return "improving";
}

export interface Vecr7Metric {
  eligibleDiagnoses: number;
  retainedDiagnoses: number;
  rate: number | null;
}

export function calculateVecr7(
  state: Pick<StudentStudyState, "retentionSchedules">,
  asOfDateKey: string,
): Vecr7Metric {
  const eligible = state.retentionSchedules.filter(
    (schedule) =>
      schedule.cadence === "D7" &&
      schedule.dueDate.localeCompare(asOfDateKey) <= 0,
  );
  const eligibleDiagnosisIds = [
    ...new Set(eligible.map((schedule) => schedule.diagnosisId)),
  ];
  if (eligibleDiagnosisIds.length === 0) {
    return { eligibleDiagnoses: 0, retainedDiagnoses: 0, rate: null };
  }
  const retainedDiagnoses = eligibleDiagnosisIds.filter((diagnosisId) =>
    eligible.some(
      (schedule) =>
        schedule.diagnosisId === diagnosisId && schedule.outcome === "secure",
    ),
  ).length;
  return {
    eligibleDiagnoses: eligibleDiagnosisIds.length,
    retainedDiagnoses,
    rate: Math.round((retainedDiagnoses / eligibleDiagnosisIds.length) * 100),
  };
}
