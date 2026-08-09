import { describe, expect, it } from "vitest";
import { demoIds, demoLearningService } from "@/services/learning-service";

describe("LearningService", () => {
  it("assembles the demo student home without exposing storage details", async () => {
    const home = await demoLearningService.getStudentHome(demoIds.student);

    expect(home?.student.name).toBe("Jamie Park");
    expect(home?.mission?.estimatedMinutes).toBe(10);
    expect(home?.patterns).toHaveLength(2);
  });

  it("assembles a tutor queue connected to the demo student", async () => {
    const dashboard = await demoLearningService.getTutorDashboard(
      demoIds.tutor,
    );

    expect(dashboard?.students).toHaveLength(1);
    expect(dashboard?.interventions[0]?.studentId).toBe(demoIds.student);
  });
});
