import type { PracticeItem } from "@/domain/study";
import type {
  LearnerStudyPlan,
  StudyActivityType,
  StudyPlanBlock,
  StudySessionType,
  StudyTopic,
} from "@/domain/study";
import { differenceInDays } from "@/lib/clock";

export interface RecentItemHistory {
  itemId: string;
  localDate: string;
}

export interface AdaptiveSessionPlannerInput {
  requestedMinutes: number;
  studyPlan: LearnerStudyPlan;
  dueReviewItemIds: string[];
  unresolvedItemIds: string[];
  highConfidenceMistakeItemIds: string[];
  recentItemHistory: RecentItemHistory[];
  publishedItems: PracticeItem[];
  todayKey: string;
  selectedTopic: StudyTopic;
  includeDueReviews: boolean;
  timed: boolean;
  dailyCoreItemIds: string[];
}

export interface AdaptiveSessionPlan {
  requestedMinutes: number;
  availableMinutes: number;
  sessionType: StudySessionType;
  blocks: StudyPlanBlock[];
  contentShortage: boolean;
  shortageMessage: string | null;
}

interface BlockSpec {
  title: string;
  detail: string;
  type: StudyActivityType;
  minutes: number;
  itemCount: number;
  breakMinutes?: number;
}

const sessionTypes: Array<[number, StudySessionType]> = [
  [15, "quick"],
  [30, "focused"],
  [60, "deep"],
  [90, "intensive"],
  [120, "custom"],
];

export function sessionTypeForMinutes(minutes: number): StudySessionType {
  if (minutes <= 10) return "daily-core";
  return sessionTypes.find(([ceiling]) => minutes <= ceiling)?.[1] ?? "custom";
}

function baseTemplate(minutes: number, timed: boolean): BlockSpec[] {
  if (minutes <= 10) {
    return [
      {
        title: "Daily Core",
        detail:
          "Due work, one correction loop, and a fresh transfer when needed.",
        type: "daily-core",
        minutes: 10,
        itemCount: 6,
      },
    ];
  }
  if (minutes <= 15) {
    return [
      {
        title: "Daily Core",
        detail: "Complete the minimum viable study day first.",
        type: "daily-core",
        minutes: 10,
        itemCount: 6,
      },
      {
        title: "Compact extension",
        detail: "Add one short skill-specific proof without padding the clock.",
        type: "complete-words",
        minutes: 4,
        itemCount: 4,
      },
      {
        title: "Close the trace",
        detail: "Name the one signal to carry into tomorrow.",
        type: "summary",
        minutes: 1,
        itemCount: 0,
      },
    ];
  }
  if (minutes <= 30) {
    return [
      {
        title: "Daily Core",
        detail: "Protect due work before adding volume.",
        type: "daily-core",
        minutes: 10,
        itemCount: 6,
      },
      {
        title: "Word-form speed",
        detail: "Use grammar and context signals under light pace pressure.",
        type: "complete-words",
        minutes: 6,
        itemCount: 5,
      },
      {
        title: "Reading set",
        detail: "Trace evidence through one connected reading surface.",
        type: "daily-life",
        minutes: 8,
        itemCount: 2,
      },
      {
        title: "Mistake review",
        detail: "Compare the tempting relation with the supported answer.",
        type: "mistake-review",
        minutes: 4,
        itemCount: 1,
      },
      {
        title: "Session summary",
        detail: "Save the correction and its next return.",
        type: "summary",
        minutes: 2,
        itemCount: 0,
      },
    ];
  }
  if (minutes <= 60) {
    return [
      {
        title: "Daily Core",
        detail: "Finish urgent correction work first.",
        type: "daily-core",
        minutes: 10,
        itemCount: 6,
      },
      {
        title: "Speed practice",
        detail: "Build language-form fluency without dropping context.",
        type: "complete-words",
        minutes: 9,
        itemCount: 7,
      },
      {
        title: "Daily Life set",
        detail: "Follow audience, purpose, and constraints in practical text.",
        type: "daily-life",
        minutes: 10,
        itemCount: 2,
      },
      {
        title: "Academic passage block",
        detail: "Read for claim structure, evidence, and distractor limits.",
        type: "academic",
        minutes: 16,
        itemCount: 3,
      },
      {
        title: "Correction lab",
        detail: "Analyze one unresolved pattern and prove a transfer.",
        type: "mistake-review",
        minutes: 10,
        itemCount: 2,
      },
      {
        title: "Session summary",
        detail: "Record what improved and what returns on D2 or D7.",
        type: "summary",
        minutes: 5,
        itemCount: 0,
      },
    ];
  }
  if (minutes <= 90) {
    return [
      {
        title: "Daily Core",
        detail: "Clear the highest-priority correction work.",
        type: "daily-core",
        minutes: 10,
        itemCount: 6,
      },
      {
        title: "Block 1 · Speed and daily reading",
        detail: "Alternate language form with a practical reading set.",
        type: "daily-life",
        minutes: 20,
        itemCount: 6,
      },
      {
        title: "Recovery break",
        detail: "Stand up, look away, and return with fresh attention.",
        type: "break",
        minutes: 5,
        itemCount: 0,
        breakMinutes: 5,
      },
      {
        title: "Block 2 · Academic depth",
        detail: "Work through claim structure and keyed evidence.",
        type: "academic",
        minutes: 22,
        itemCount: 4,
      },
      {
        title: "Mistake analysis",
        detail: "Inspect the strongest recurring distractor relation.",
        type: "mistake-review",
        minutes: 10,
        itemCount: 2,
      },
      {
        title: timed ? "Timed mixed set" : "Mixed transfer set",
        detail: timed
          ? "Use a visible limit while preserving the evidence step."
          : "Move the same correction across task formats.",
        type: timed ? "timed-mixed" : "transfer",
        minutes: 17,
        itemCount: 4,
      },
      {
        title: "Session summary",
        detail: "Keep completed work even if you stop here.",
        type: "summary",
        minutes: 6,
        itemCount: 0,
      },
    ];
  }
  return [
    {
      title: "Daily Core",
      detail: "Secure the minimum viable study day.",
      type: "daily-core",
      minutes: 10,
      itemCount: 6,
    },
    {
      title: "Block 1 · Format switch",
      detail: "Move from language form into practical reading.",
      type: "daily-life",
      minutes: 20,
      itemCount: 7,
    },
    {
      title: "Recovery break",
      detail: "Take five minutes away from the screen.",
      type: "break",
      minutes: 5,
      itemCount: 0,
      breakMinutes: 5,
    },
    {
      title: "Block 2 · Academic depth",
      detail: "Study one passage family with evidence and option analysis.",
      type: "academic",
      minutes: 25,
      itemCount: 5,
    },
    {
      title: "Long break",
      detail: "Reset attention before timed work.",
      type: "break",
      minutes: 10,
      itemCount: 0,
      breakMinutes: 10,
    },
    {
      title: "Timed mixed set",
      detail: "Practice task switching under a transparent time limit.",
      type: "timed-mixed",
      minutes: 20,
      itemCount: 5,
    },
    {
      title: "Deep correction lab",
      detail: "Compare evidence, distractor relation, and transfer rule.",
      type: "mistake-review",
      minutes: 15,
      itemCount: 3,
    },
    {
      title: "Retention transfer",
      detail: "Finish with due or unresolved work on a distinct surface.",
      type: "transfer",
      minutes: 10,
      itemCount: 3,
    },
    {
      title: "Session summary",
      detail: "Save the learning trace and next scheduled review.",
      type: "summary",
      minutes: 5,
      itemCount: 0,
    },
  ];
}

function fitTemplateToRequestedMinutes(
  template: BlockSpec[],
  requestedMinutes: number,
) {
  let remaining = requestedMinutes;
  const fitted: BlockSpec[] = [];
  for (const spec of template) {
    if (remaining <= 0) break;
    const minutes = Math.min(spec.minutes, remaining);
    const itemCount =
      spec.itemCount === 0
        ? 0
        : Math.max(1, Math.round(spec.itemCount * (minutes / spec.minutes)));
    fitted.push({
      ...spec,
      minutes,
      itemCount,
      breakMinutes:
        spec.type === "break" ? Math.min(spec.breakMinutes ?? 0, minutes) : 0,
    });
    remaining -= minutes;
  }
  return fitted;
}

function poolForType(
  items: PracticeItem[],
  type: StudyActivityType,
  topic: StudyTopic,
) {
  const effectiveType: StudyActivityType =
    topic === "complete-words"
      ? "complete-words"
      : topic === "daily-life"
        ? "daily-life"
        : topic === "academic"
          ? "academic"
          : topic === "mistake-review"
            ? "mistake-review"
            : topic === "due-reviews"
              ? "due-review"
              : topic === "timed-mixed"
                ? "timed-mixed"
                : type;
  if (effectiveType === "complete-words") {
    return items.filter((item) => item.taskType === "complete-the-words");
  }
  if (effectiveType === "daily-life") {
    return items.filter((item) => item.taskType === "daily-life");
  }
  if (effectiveType === "academic") {
    return items.filter((item) => item.taskType === "academic-passage");
  }
  if (effectiveType === "transfer" || effectiveType === "mistake-review") {
    return items.filter((item) => item.kind === "transfer");
  }
  return items;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function generateAdaptiveSessionPlan(
  input: AdaptiveSessionPlannerInput,
): AdaptiveSessionPlan {
  const requestedMinutes = Math.max(10, Math.min(120, input.requestedMinutes));
  const recentCutoff = new Date(`${input.todayKey}T12:00:00.000Z`);
  recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 6);
  const cutoffKey = recentCutoff.toISOString().slice(0, 10);
  const recent = new Set(
    input.recentItemHistory
      .filter((entry) => entry.localDate >= cutoffKey)
      .map((entry) => entry.itemId),
  );
  const due = unique(input.includeDueReviews ? input.dueReviewItemIds : []);
  const deliberateReview = new Set([
    ...due,
    ...input.unresolvedItemIds,
    ...input.highConfidenceMistakeItemIds,
  ]);
  const usable = input.publishedItems.filter(
    (item) => !recent.has(item.id) || deliberateReview.has(item.id),
  );
  const byId = new Map(input.publishedItems.map((item) => [item.id, item]));
  const used = new Set<string>();
  const templates = fitTemplateToRequestedMinutes(
    baseTemplate(requestedMinutes, input.timed),
    requestedMinutes,
  );
  const daysToTest = input.studyPlan.targetTestDate
    ? differenceInDays(input.studyPlan.targetTestDate, input.todayKey)
    : null;
  if (
    requestedMinutes >= 30 &&
    daysToTest !== null &&
    daysToTest <= 21 &&
    !templates.some((block) => block.type === "timed-mixed")
  ) {
    const candidate = templates.find(
      (block) => block.type === "daily-life" || block.type === "academic",
    );
    if (candidate) {
      candidate.type = "timed-mixed";
      candidate.title = "Countdown-aware timed set";
      candidate.detail =
        "A nearby test date makes controlled pace practice useful today.";
    }
  }

  const blocks: StudyPlanBlock[] = [];
  let shortage = false;
  for (const [index, spec] of templates.entries()) {
    let itemIds: string[] = [];
    if (spec.type === "daily-core") {
      itemIds = unique(input.dailyCoreItemIds).filter((id) => byId.has(id));
      itemIds.forEach((id) => used.add(id));
    } else if (spec.type === "due-review") {
      itemIds = due.filter((id) => byId.has(id) && !used.has(id));
    } else if (!["break", "summary"].includes(spec.type)) {
      const priorityIds =
        spec.type === "mistake-review" || spec.type === "transfer"
          ? unique([
              ...input.highConfidenceMistakeItemIds,
              ...input.unresolvedItemIds,
            ])
          : [];
      const priorityItems = poolForType(
        priorityIds
          .map((id) => byId.get(id))
          .filter((item): item is PracticeItem => Boolean(item)),
        spec.type,
        input.selectedTopic,
      );
      const pool = [
        ...priorityItems,
        ...poolForType(usable, spec.type, input.selectedTopic),
      ];
      itemIds = pool
        .map((item) => item.id)
        .filter((id) => !used.has(id))
        .slice(0, spec.itemCount);
      if (itemIds.length < spec.itemCount) shortage = true;
    }
    itemIds.forEach((id) => used.add(id));
    if (
      spec.itemCount > 0 &&
      itemIds.length === 0 &&
      spec.type !== "daily-core"
    ) {
      continue;
    }
    const scale =
      spec.itemCount > 0 && itemIds.length < spec.itemCount
        ? itemIds.length / spec.itemCount
        : 1;
    const estimatedMinutes = Math.max(
      spec.type === "summary" || spec.type === "break" ? spec.minutes : 1,
      Math.round(spec.minutes * scale),
    );
    blocks.push({
      id: `block-${String(index + 1).padStart(2, "0")}-${spec.type}`,
      title: spec.title,
      detail: spec.detail,
      activityType: spec.type,
      estimatedMinutes,
      itemIds,
      missionEntryIds: [],
      status: index === 0 ? "active" : "upcoming",
      breakMinutes: spec.breakMinutes ?? 0,
    });
  }
  const availableMinutes = blocks.reduce(
    (sum, block) => sum + block.estimatedMinutes,
    0,
  );
  shortage = shortage || availableMinutes < requestedMinutes - 3;
  return {
    requestedMinutes,
    availableMinutes,
    sessionType: sessionTypeForMinutes(requestedMinutes),
    blocks,
    contentShortage: shortage,
    shortageMessage: shortage
      ? `The reviewed pool supports a ${availableMinutes}-minute plan today. TraceTutor did not duplicate unseen items to fill the clock.`
      : null,
  };
}
