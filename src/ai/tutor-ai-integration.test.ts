import { describe, expect, it } from "vitest";
import { createEvaluationAudit } from "@/ai/evaluation/fixtures";
import { createInitialTutorWorkspaceState } from "@/data/seed-tutor-workspace";
import { demoStudent } from "@/data/mock-data";
import {
  appendAiSuggestion,
  calculateWeeklyReport,
} from "@/services/tutor-operations";

describe("tutor AI suggestion audit boundary", () => {
  it("appends model audit data without changing rules or adjudication", () => {
    const workspace = createInitialTutorWorkspaceState();
    const item = workspace.diagnosisCases[1];
    const audit = createEvaluationAudit("actor-rule-model-contradiction");
    expect(item).toBeDefined();
    expect(audit).not.toBeNull();
    const ruleSnapshot = structuredClone(item!.machineSuggestion);
    const adjudication = structuredClone(item!.adjudication);
    const next = appendAiSuggestion(
      workspace,
      item!.id,
      audit!,
      workspace.tutorId,
      "2026-08-11T01:00:00.000Z",
    );
    const updated = next.diagnosisCases[1];
    expect(updated?.machineSuggestion).toEqual(ruleSnapshot);
    expect(updated?.adjudication).toEqual(adjudication);
    expect(updated?.aiSuggestions?.at(-1)).toEqual(audit);
    expect(updated?.auditTrail.at(-1)?.action).toBe("ai-suggestion-recorded");
  });

  it("releases only AI explanations that match a completed tutor decision", () => {
    const workspace = createInitialTutorWorkspaceState();
    const report = calculateWeeklyReport(workspace, demoStudent.id);
    expect(report.approvedAiExplanations).toHaveLength(1);
    expect(report.approvedAiExplanations[0]).toContain("may have attached");
  });
});
