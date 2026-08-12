import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import { getReadingStimulus, practiceItems } from "@/data/practice-content";
import type {
  AnswerConfidence,
  PracticeItem,
  ReadingPriority,
} from "@/domain/study";

export const ENTRY_READING_DIAGNOSTIC_VERSION = "reading-entry-v1" as const;
export const entryReadingDiagnosticItemIds = [
  "ctw-02",
  "ctw-04",
  "daily-01",
  "daily-05",
  "academic-01",
  "academic-05",
] as const;

export interface EntryReadingDiagnosticResponse {
  itemId: (typeof entryReadingDiagnosticItemIds)[number];
  response: string;
  confidence: AnswerConfidence;
  elapsedSeconds: number;
}

export interface EntryReadingDiagnosticItem {
  id: string;
  kind: "complete-words" | "reading-question";
  taskType: "complete-the-words" | "daily-life" | "academic-passage";
  title: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  paragraphBefore?: string;
  wordPrefix?: string;
  paragraphAfter?: string;
  stimulusTitle?: string;
  stimulusContext?: string;
  stimulusSegments?: Array<{ id: string; text: string }>;
}

export interface EntryReadingDiagnosticResult {
  version: typeof ENTRY_READING_DIAGNOSTIC_VERSION;
  completedAt: string;
  readingPriority: ReadingPriority;
  recommendedSkill: string;
  primaryObservation: string;
  taskResults: Array<{
    taskType: EntryReadingDiagnosticItem["taskType"];
    correct: number;
    total: number;
    highConfidenceWrong: number;
  }>;
  nextStep: string;
}

function selectedItems(): PracticeItem[] {
  const items = entryReadingDiagnosticItemIds.map((id) =>
    practiceItems.find((item) => item.id === id),
  );
  if (items.some((item) => !item)) {
    throw new Error("Entry Reading diagnostic content is incomplete.");
  }
  return items as PracticeItem[];
}

export function getEntryReadingDiagnosticItems(): EntryReadingDiagnosticItem[] {
  return selectedItems().map((item) => {
    if (item.kind === "complete-words") {
      return {
        id: item.id,
        kind: item.kind,
        taskType: item.taskType,
        title: item.title,
        prompt: "Complete the missing word ending.",
        options: [],
        paragraphBefore: item.paragraphBefore,
        wordPrefix: item.wordPrefix,
        paragraphAfter: item.paragraphAfter,
      };
    }
    if (item.kind === "transfer") {
      throw new Error("Transfer items cannot be used in the entry diagnostic.");
    }
    const stimulus = getReadingStimulus(item.stimulusId);
    return {
      id: item.id,
      kind: "reading-question",
      taskType: item.taskType,
      title: item.title,
      prompt: item.prompt,
      options: item.options,
      stimulusTitle: stimulus?.title,
      stimulusContext: stimulus?.context,
      stimulusSegments: stimulus?.segments,
    };
  });
}

function correct(item: PracticeItem, response: string) {
  if (item.kind === "complete-words") {
    const normalized = response.trim().toLowerCase().replaceAll(" ", "");
    return item.acceptedAnswers.some(
      (answer) =>
        answer.trim().toLowerCase().replaceAll(" ", "") === normalized,
    );
  }
  return item.correctOptionId === response.trim().toLowerCase();
}

const priorityByTask: Record<
  EntryReadingDiagnosticItem["taskType"],
  ReadingPriority
> = {
  "complete-the-words": "complete-words",
  "daily-life": "daily-life",
  "academic-passage": "academic",
};

export function evaluateEntryReadingDiagnostic(input: {
  responses: EntryReadingDiagnosticResponse[];
  completedAt: string;
}): EntryReadingDiagnosticResult {
  const items = selectedItems();
  const responses = new Map(input.responses.map((row) => [row.itemId, row]));
  if (
    responses.size !== items.length ||
    items.some(
      (item) =>
        !responses.has(item.id as EntryReadingDiagnosticResponse["itemId"]),
    )
  ) {
    throw new Error(
      "Every Reading diagnostic item must be answered exactly once.",
    );
  }
  const evaluated = items.map((item) => {
    const response = responses.get(
      item.id as EntryReadingDiagnosticResponse["itemId"],
    )!;
    return { item, response, correct: correct(item, response.response) };
  });
  const taskTypes: EntryReadingDiagnosticItem["taskType"][] = [
    "complete-the-words",
    "daily-life",
    "academic-passage",
  ];
  const taskResults = taskTypes.map((taskType) => {
    const rows = evaluated.filter((row) => row.item.taskType === taskType);
    return {
      taskType,
      correct: rows.filter((row) => row.correct).length,
      total: rows.length,
      highConfidenceWrong: rows.filter(
        (row) => !row.correct && row.response.confidence === "certain",
      ).length,
    };
  });
  const recommendation = [...taskResults].sort((left, right) => {
    const leftRisk =
      left.total - left.correct + left.highConfidenceWrong * 0.75;
    const rightRisk =
      right.total - right.correct + right.highConfidenceWrong * 0.75;
    if (rightRisk !== leftRisk) return rightRisk - leftRisk;
    return taskTypes.indexOf(left.taskType) - taskTypes.indexOf(right.taskType);
  })[0];
  const firstMiss = evaluated.find(
    (row) => row.item.taskType === recommendation.taskType && !row.correct,
  );
  const target =
    firstMiss?.item ??
    evaluated.find((row) => row.item.taskType === recommendation.taskType)!
      .item;
  const metadata = getItemDiagnosticMetadata(target);
  const priority = priorityByTask[recommendation.taskType];
  return {
    version: ENTRY_READING_DIAGNOSTIC_VERSION,
    completedAt: input.completedAt,
    readingPriority: priority,
    recommendedSkill: metadata.skill,
    primaryObservation: firstMiss
      ? `${recommendation.taskType} needs a supported correction before more volume.`
      : `Build speed while retaining accuracy in ${recommendation.taskType}.`,
    taskResults,
    nextStep: `Start with ${metadata.skill.replaceAll("-", " ")} and make the supporting clue explicit before choosing.`,
  };
}
