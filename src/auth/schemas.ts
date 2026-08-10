import { z } from "zod";

const displayName = z.string().trim().min(2).max(80);
const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Za-z]/, "Use at least one letter.")
  .regex(/[0-9]/, "Use at least one number.");

export const signInSchema = z.object({ email, password });
export const signUpSchema = z.object({ email, password, displayName });
export const magicLinkSchema = z.object({ email });
export const completeProfileSchema = z.object({
  displayName,
  role: z.enum(["tutor", "student"]),
  inviteToken: z.string().trim().min(32).max(256).optional(),
});
export const tutorWorkspaceSchema = z.object({
  organizationName: z.string().trim().min(2).max(100),
  className: z.string().trim().min(2).max(100),
});
export const inviteSchema = z.object({
  classId: z.uuid(),
});
export const assignmentSchema = z.object({
  classId: z.uuid(),
  studentId: z.uuid(),
  itemVersionId: z.uuid(),
  title: z.string().trim().min(3).max(120),
  dueAt: z.iso.datetime().optional(),
  idempotencyKey: z.uuid(),
});
export const responseSubmissionSchema = z
  .object({
    assignmentItemId: z.uuid(),
    clientSubmissionId: z.uuid(),
    selectedOptionId: z.uuid().nullable(),
    typedResponse: z.string().trim().max(240).nullable(),
    confidence: z.enum(["guessing", "think-so", "certain"]).nullable(),
    evidenceSpanIds: z.array(z.uuid()).max(12),
    elapsedSeconds: z.number().int().min(0).max(7200),
    answerChanges: z.number().int().min(0).max(100),
  })
  .refine(
    ({ selectedOptionId, typedResponse }) =>
      (selectedOptionId !== null) !== Boolean(typedResponse),
    { message: "Submit exactly one answer type." },
  );
export const adjudicationSchema = z
  .object({
    diagnosticSessionId: z.uuid(),
    decision: z.enum(["approved", "changed", "ambiguous"]),
    primaryCause: z.string().trim().max(80).nullable(),
    secondaryCauses: z.array(z.string().trim().max(80)).max(3),
    feedback: z.string().trim().max(500).nullable(),
    transferItemVersionId: z.uuid().nullable(),
    followUpQuestion: z.string().trim().max(240).nullable(),
    addToLesson: z.boolean(),
    idempotencyKey: z.uuid(),
  })
  .refine(
    ({ decision, primaryCause }) =>
      decision === "ambiguous" || Boolean(primaryCause),
    { message: "A primary cause is required for a verified decision." },
  );

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
