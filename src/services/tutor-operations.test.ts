import { describe, expect, it } from "vitest";
import { createInitialTutorWorkspaceState } from "@/data/seed-tutor-workspace";
import { demoIds } from "@/services/learning-service";
import type { ContentEditorDraft } from "@/domain/tutor";
import {
  applyTutorAdjudication,
  buildLessonBrief,
  buildTutorQueue,
  calculateWeeklyReport,
  saveContentVersion,
  validateContentDraft,
} from "@/services/tutor-operations";

const validDraft: ContentEditorDraft = {
  contentKey: "tutor-original-test",
  taskType: "daily-life",
  skill: "detail",
  title: "Community room notice",
  stimulusTitle: "Room change",
  stimulusText:
    "The map workshop will meet in Room 4 on Friday. Bring a pencil.",
  prompt: "Where will the map workshop meet?",
  options: [
    { id: "a", label: "Room 4", distractorRelation: null },
    { id: "b", label: "Room 5", distractorRelation: "unsupported" },
    { id: "c", label: "The lobby", distractorRelation: "wrong-condition" },
    { id: "d", label: "Outside", distractorRelation: "opposite" },
  ],
  correctOptionId: "a",
  designatedEvidence: "The map workshop will meet in Room 4 on Friday.",
  status: "published",
};

describe("tutor operations", () => {
  it("ranks transparent instructional signals with the strongest case first", () => {
    const queue = buildTutorQueue(
      createInitialTutorWorkspaceState(),
      "2026-08-10",
    );

    expect(queue[0]?.caseId).toBe("case-scope-expansion");
    expect(queue[0]?.priority).toBe("high");
    expect(queue[0]?.reasons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/certain confidence/i),
        expect.stringMatching(/unresolved question/i),
      ]),
    );
    expect(queue.map((item) => item.priorityScore)).toEqual(
      [...queue.map((item) => item.priorityScore)].sort(
        (left, right) => right - left,
      ),
    );
  });

  it("preserves the original machine suggestion through an adjudication audit trail", () => {
    const initial = createInitialTutorWorkspaceState();
    const original = initial.diagnosisCases[0]?.machineSuggestion;
    const changed = applyTutorAdjudication(
      initial,
      "case-scope-expansion",
      { type: "change-primary", cause: "outside-knowledge-added" },
      demoIds.tutor,
      "2026-08-10T09:10:00.000Z",
    );
    const approved = applyTutorAdjudication(
      changed,
      "case-scope-expansion",
      { type: "approve", reviewDurationSeconds: 135 },
      demoIds.tutor,
      "2026-08-10T09:12:00.000Z",
    );
    const reviewed = approved.diagnosisCases[0];

    expect(reviewed?.machineSuggestion).toEqual(original);
    expect(reviewed?.adjudication.primaryCause).toBe("outside-knowledge-added");
    expect(reviewed?.adjudication.status).toBe("changed");
    expect(reviewed?.auditTrail.map((event) => event.action)).toEqual([
      "primary-changed",
      "approved",
    ]);
  });

  it("validates evidence, option completeness, one key, and distractor tags", () => {
    expect(validateContentDraft(validDraft)).toEqual({});
    expect(
      validateContentDraft({
        ...validDraft,
        designatedEvidence: "A sentence not in the source.",
        correctOptionId: "missing",
        options: validDraft.options.map((option) => ({
          ...option,
          distractorRelation: null,
        })),
      }),
    ).toMatchObject({
      designatedEvidence: expect.any(String),
      correctOptionId: expect.any(String),
      distractorTags: expect.any(String),
    });
  });

  it("creates a new immutable version when published content is edited", () => {
    const first = saveContentVersion(
      [],
      validDraft,
      demoIds.tutor,
      "2026-08-10T09:00:00.000Z",
    );
    const second = saveContentVersion(
      first.versions,
      { ...validDraft, title: "Community room notice — clarified" },
      demoIds.tutor,
      "2026-08-10T10:00:00.000Z",
    );

    expect(second.versions).toHaveLength(2);
    expect(second.versions[0]?.title).toBe("Community room notice");
    expect(second.versions[1]).toMatchObject({
      version: 2,
      parentVersionId: "tutor-original-test-v1",
      title: "Community room notice — clarified",
    });
  });

  it("selects only one to three verified priorities for the lesson brief", () => {
    const brief = buildLessonBrief(
      createInitialTutorWorkspaceState(),
      demoIds.student,
      "2026-08-10T09:00:00.000Z",
    );

    expect(brief.priorities.length).toBeGreaterThanOrEqual(1);
    expect(brief.priorities.length).toBeLessThanOrEqual(3);
    expect(brief.priorities[0]?.cause).toBe("grammar-morphology-failure");
    const totalMinutes = brief.priorities.reduce(
      (sum, priority) => sum + Number(priority.intervention.match(/^\d+/)?.[0]),
      0,
    );
    expect(totalMinutes).toBeGreaterThanOrEqual(10);
    expect(totalMinutes).toBeLessThanOrEqual(15);
    expect(brief.itemLinks).toHaveLength(2);
    expect(brief.unresolvedQuestions[0]).toMatch(/any number/i);
  });

  it("calculates the student-facing weekly report without a score claim", () => {
    const report = calculateWeeklyReport(
      createInitialTutorWorkspaceState(),
      demoIds.student,
    );

    expect(report.missionsCompleted).toBe(6);
    expect(report.verifiedCorrections).toBe(2);
    expect(report.confidenceCalibrationChange).toBe(13);
    expect(report.waitingForReview.length).toBeGreaterThan(0);
    expect(JSON.stringify(report)).not.toMatch(/score/i);
  });
});
