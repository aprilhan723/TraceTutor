import type { ReadingTaskType } from "@/domain/models";
import type { ErrorCause } from "@/domain/mistake-intelligence";
import type { TransferItem } from "@/domain/study";

export interface ReviewedTransferBankEntry {
  item: TransferItem;
  errorCauses: ErrorCause[];
  sourceTaskTypes: ReadingTaskType[];
  trapKey: string;
  reviewStatus: "reviewed";
}

const boundaryCauses: ErrorCause[] = [
  "scope-expanded",
  "scope-narrowed",
  "modality-strengthened",
  "modality-weakened",
  "polarity-negation-missed",
];

const identityCauses: ErrorCause[] = [
  "actor-mismatch",
  "time-mismatch",
  "condition-mismatch",
];

const reasoningCauses: ErrorCause[] = [
  "evidence-not-found",
  "evidence-misread",
  "outside-knowledge-added",
  "cause-effect-reversed",
  "example-main-point-confusion",
];

const languageCauses: ErrorCause[] = [
  "lexical-meaning-failure",
  "grammar-morphology-failure",
  "spelling-failure",
];

export const reviewedTransferBank: ReviewedTransferBankEntry[] = [
  {
    item: {
      id: "intel-transfer-boundary-01",
      kind: "transfer",
      taskType: "daily-life",
      mistakeCategory: "inference-overreach",
      title: "Immediate transfer · Keep the strength",
      microContext:
        "A garden notice says some shaded paths may reopen after the morning safety check.",
      prompt: "Which statement preserves the notice’s limits?",
      options: [
        { id: "a", label: "All paths will definitely reopen this morning" },
        { id: "b", label: "Some shaded paths may reopen after a check" },
        { id: "c", label: "The garden never checks sunny paths" },
      ],
      correctOptionId: "b",
      explanation:
        "‘Some’ and ‘may’ preserve the original scope and possibility.",
    },
    errorCauses: boundaryCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "limited-claim-vs-guarantee-garden",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-boundary-02",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "inference-overreach",
      title: "2-day review · Preserve frequency",
      microContext:
        "A study reports that urban foxes often change routes when construction noise increases.",
      prompt: "Which conclusion matches the reported frequency?",
      options: [
        { id: "a", label: "Urban foxes always leave construction areas" },
        { id: "b", label: "Construction never affects fox routes" },
        { id: "c", label: "Route changes are common, but not universal" },
      ],
      correctOptionId: "c",
      explanation: "‘Often’ supports a common pattern, not an absolute rule.",
    },
    errorCauses: boundaryCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "frequency-vs-always-foxes",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-boundary-03",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "inference-overreach",
      title: "7-day review · Keep possibility",
      microContext:
        "Mineral layers in a cave can indicate periods of heavier rainfall, but local airflow can also affect their growth.",
      prompt: "Which claim is supported?",
      options: [
        { id: "a", label: "Every thick layer proves a year of heavy rain" },
        {
          id: "b",
          label: "Layer growth can suggest rainfall but is not exact",
        },
        { id: "c", label: "Airflow has no effect on cave minerals" },
      ],
      correctOptionId: "b",
      explanation: "The answer keeps both the possibility and the limitation.",
    },
    errorCauses: boundaryCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "possibility-vs-proof-cave",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-identity-01",
      kind: "transfer",
      taskType: "daily-life",
      mistakeCategory: "evidence-drift",
      title: "Immediate transfer · Match the actor",
      microContext:
        "Team leaders submit the equipment list. New members bring their own water bottles.",
      prompt: "Who brings a water bottle?",
      options: [
        { id: "a", label: "Team leaders" },
        { id: "b", label: "New members" },
        { id: "c", label: "Equipment suppliers" },
      ],
      correctOptionId: "b",
      explanation:
        "The action belongs to new members, not another named actor.",
    },
    errorCauses: identityCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "actor-assignment-team",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-identity-02",
      kind: "transfer",
      taskType: "daily-life",
      mistakeCategory: "evidence-drift",
      title: "2-day review · Match the date",
      microContext:
        "Reservations close Friday. The guided walk takes place the following Tuesday.",
      prompt: "What happens Tuesday?",
      options: [
        { id: "a", label: "Reservations close" },
        { id: "b", label: "The guided walk takes place" },
        { id: "c", label: "The schedule is published" },
      ],
      correctOptionId: "b",
      explanation: "Tuesday is the event date; Friday is the deadline.",
    },
    errorCauses: identityCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "date-vs-deadline-walk",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-identity-03",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "evidence-drift",
      title: "7-day review · Match the condition",
      microContext:
        "The coastal sensor sends an alert only when water rises quickly and wind exceeds 40 kilometers per hour.",
      prompt: "When is an alert sent?",
      options: [
        { id: "a", label: "Whenever wind rises at all" },
        { id: "b", label: "When both stated conditions occur" },
        { id: "c", label: "Whenever the water level changes slowly" },
      ],
      correctOptionId: "b",
      explanation: "The alert requires both conditions, not either one alone.",
    },
    errorCauses: identityCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "joint-condition-sensor",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-reasoning-01",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "purpose-confusion",
      title: "Immediate transfer · Separate claim and example",
      microContext:
        "Flexible schedules can reduce crowding. One library, for example, opens its study rooms earlier during exams.",
      prompt: "What is the main claim?",
      options: [
        { id: "a", label: "Every library must open earlier" },
        { id: "b", label: "Flexible schedules can reduce crowding" },
        { id: "c", label: "Exam rooms are always crowded" },
      ],
      correctOptionId: "b",
      explanation: "The library is an example of the broader scheduling claim.",
    },
    errorCauses: reasoningCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "claim-vs-example-library",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-reasoning-02",
      kind: "transfer",
      taskType: "daily-life",
      mistakeCategory: "evidence-drift",
      title: "2-day review · Stay inside the source",
      microContext:
        "The repair notice says the west stairway is closed because a handrail is being replaced.",
      prompt: "Which reason is stated?",
      options: [
        { id: "a", label: "The handrail is being replaced" },
        { id: "b", label: "The stairs were designed incorrectly" },
        { id: "c", label: "Visitors complained about the view" },
      ],
      correctOptionId: "a",
      explanation: "Only the handrail replacement is stated in the notice.",
    },
    errorCauses: reasoningCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "source-vs-outside-stairway",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-reasoning-03",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "inference-overreach",
      title: "7-day review · Keep cause and effect ordered",
      microContext:
        "After shade cloth was added, soil dried more slowly, allowing seedlings to survive longer between watering days.",
      prompt: "Which relationship is supported?",
      options: [
        { id: "a", label: "Seedlings caused the shade cloth to appear" },
        { id: "b", label: "Slower drying helped seedlings survive" },
        { id: "c", label: "Watering caused the soil to dry faster" },
      ],
      correctOptionId: "b",
      explanation: "The passage links slower drying to longer survival.",
    },
    errorCauses: reasoningCauses,
    sourceTaskTypes: ["daily-life", "academic-passage"],
    trapKey: "cause-effect-seedlings",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-language-01",
      kind: "transfer",
      taskType: "daily-life",
      mistakeCategory: "word-form",
      title: "Immediate transfer · Choose the form",
      microContext: "The archive created a ______ copy of each fragile map.",
      prompt: "Which form fits before the noun ‘copy’?",
      options: [
        { id: "a", label: "digitally" },
        { id: "b", label: "digital" },
        { id: "c", label: "digitize" },
      ],
      correctOptionId: "b",
      explanation: "The adjective ‘digital’ modifies the noun ‘copy.’",
    },
    errorCauses: languageCauses,
    sourceTaskTypes: ["complete-the-words"],
    trapKey: "adjective-before-noun-archive",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-language-02",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "word-form",
      title: "2-day review · Choose the inflection",
      microContext: "Last winter, the research team ______ the wetland twice.",
      prompt: "Which form fits the completed past action?",
      options: [
        { id: "a", label: "survey" },
        { id: "b", label: "surveyed" },
        { id: "c", label: "surveying" },
      ],
      correctOptionId: "b",
      explanation: "The time marker requires the past-tense form ‘surveyed.’",
    },
    errorCauses: languageCauses,
    sourceTaskTypes: ["complete-the-words"],
    trapKey: "past-tense-wetland",
    reviewStatus: "reviewed",
  },
  {
    item: {
      id: "intel-transfer-language-03",
      kind: "transfer",
      taskType: "academic-passage",
      mistakeCategory: "word-form",
      title: "7-day review · Match form and meaning",
      microContext:
        "The new seal was highly ______; no water entered the chamber during the test.",
      prompt: "Which word fits both grammar and meaning?",
      options: [
        { id: "a", label: "effect" },
        { id: "b", label: "effective" },
        { id: "c", label: "effectively" },
      ],
      correctOptionId: "b",
      explanation:
        "An adjective after ‘was’ describes a seal that successfully blocked water.",
    },
    errorCauses: languageCauses,
    sourceTaskTypes: ["complete-the-words"],
    trapKey: "adjective-meaning-seal",
    reviewStatus: "reviewed",
  },
];

export const mistakeTransferItems = reviewedTransferBank.map(
  (entry) => entry.item,
);
