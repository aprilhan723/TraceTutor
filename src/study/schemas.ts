import { z } from "zod";
import { isValidTimeZone } from "@/services/personalized-learning";

const halfStepScore = z
  .number()
  .min(1)
  .max(6)
  .refine((value) => Number.isInteger(value * 2), "Use 0.5 score steps.")
  .nullable();

export const studyPlanWriteSchema = z
  .object({
    learningStyle: z.enum(["daily-rhythm", "deep-focus"]),
    defaultDailyMinutes: z.number().int().min(10).max(120),
    weeklyGoalMinutes: z.number().int().min(30).max(840),
    studyDaysPerWeek: z.number().int().min(3).max(7),
    currentReadingLevel: halfStepScore,
    targetReadingScore: halfStepScore,
    targetTestDate: z.iso.date().nullable(),
    readingPriority: z.enum([
      "balanced",
      "complete-words",
      "daily-life",
      "academic",
      "mistake-review",
    ]),
    preferredStudyTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    timezone: z.string().trim().min(1).max(80),
    onboardingCompletedAt: z.iso.datetime().nullable(),
  })
  .superRefine((plan, context) => {
    if (!isValidTimeZone(plan.timezone)) {
      context.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "Use a valid IANA timezone.",
      });
    }
    if (plan.targetTestDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (plan.targetTestDate < today) {
        context.addIssue({
          code: "custom",
          path: ["targetTestDate"],
          message: "The target test date cannot be in the past.",
        });
      }
    }
  });

export const studyActivityWriteSchema = z
  .object({
    sessionId: z.uuid(),
    clientEventId: z.uuid(),
    localDate: z.iso.date(),
    activeSeconds: z.number().int().min(0).max(90),
    questionsAnswered: z.number().int().min(0).max(10),
    correctAnswers: z.number().int().min(0).max(10),
    reviewsCompleted: z.number().int().min(0).max(10),
    transferItemsCompleted: z.number().int().min(0).max(10),
    diagnosticsCompleted: z.number().int().min(0).max(10),
  })
  .refine(
    (value) =>
      [
        value.correctAnswers,
        value.reviewsCompleted,
        value.transferItemsCompleted,
        value.diagnosticsCompleted,
      ].every((count) => count <= value.questionsAnswered),
    "Activity counts cannot exceed questions answered.",
  );

export const studyRecommendationWriteSchema = z.object({
  studentId: z.uuid(),
  weeklyGoalMinutes: z.number().int().min(30).max(840).nullable(),
  readingPriority: z
    .enum([
      "balanced",
      "complete-words",
      "daily-life",
      "academic",
      "mistake-review",
    ])
    .nullable(),
  sessionType: z.enum(["focused", "deep"]).nullable(),
  note: z.string().trim().min(3).max(500),
});

export const recommendationResponseSchema = z.object({
  recommendationId: z.uuid(),
  accept: z.boolean(),
});
