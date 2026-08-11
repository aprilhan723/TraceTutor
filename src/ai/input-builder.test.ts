import { describe, expect, it } from "vitest";
import { buildAiDiagnosisInput } from "@/ai/input-builder";
import { createInitialTutorWorkspaceState } from "@/data/seed-tutor-workspace";
import { buildTutorDiagnosisDetail } from "@/services/tutor-operations";

describe("buildAiDiagnosisInput", () => {
  it("includes only the minimum de-identified diagnostic data", () => {
    const item = createInitialTutorWorkspaceState().diagnosisCases[0];
    expect(item).toBeDefined();
    const input = buildAiDiagnosisInput(buildTutorDiagnosisDetail(item!));
    expect(input).not.toBeNull();
    expect(input).toMatchObject({
      item: { taskType: "daily-life", skill: "inference" },
      selectedOptionRelation: "too-broad",
      response: { confidence: "certain" },
    });
    const serialized = JSON.stringify(input);
    expect(serialized).not.toContain("Jamie");
    expect(serialized).not.toContain(item!.studentId);
    expect(serialized).not.toContain("email");
  });
});
