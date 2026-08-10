import { describe, expect, it } from "vitest";
import { adjudicationSchema, responseSubmissionSchema } from "@/auth/schemas";

const responseBase = {
  assignmentItemId: "10000000-0000-4000-8000-000000000001",
  clientSubmissionId: "10000000-0000-4000-8000-000000000002",
  confidence: "certain" as const,
  evidenceSpanIds: ["10000000-0000-4000-8000-000000000003"],
  elapsedSeconds: 45,
  answerChanges: 1,
};

describe("authenticated command schemas", () => {
  it("requires exactly one response shape before reaching the database", () => {
    expect(
      responseSubmissionSchema.safeParse({
        ...responseBase,
        selectedOptionId: "10000000-0000-4000-8000-000000000004",
        typedResponse: null,
      }).success,
    ).toBe(true);
    expect(
      responseSubmissionSchema.safeParse({
        ...responseBase,
        selectedOptionId: "10000000-0000-4000-8000-000000000004",
        typedResponse: "also supplied",
      }).success,
    ).toBe(false);
    expect(
      responseSubmissionSchema.safeParse({
        ...responseBase,
        selectedOptionId: null,
        typedResponse: null,
      }).success,
    ).toBe(false);
  });

  it("requires a cause for verified adjudications but permits ambiguity", () => {
    const base = {
      diagnosticSessionId: "10000000-0000-4000-8000-000000000005",
      primaryCause: null,
      secondaryCauses: [],
      feedback: null,
      transferItemVersionId: null,
      followUpQuestion: null,
      addToLesson: false,
      idempotencyKey: "10000000-0000-4000-8000-000000000006",
    };
    expect(
      adjudicationSchema.safeParse({ ...base, decision: "approved" }).success,
    ).toBe(false);
    expect(
      adjudicationSchema.safeParse({ ...base, decision: "ambiguous" }).success,
    ).toBe(true);
  });
});
