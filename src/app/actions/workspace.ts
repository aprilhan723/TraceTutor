"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccountRole } from "@/auth/access";
import {
  assignmentSchema,
  getFormString,
  responseSubmissionSchema,
} from "@/auth/schemas";
import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import { getReadingStimulus, practiceItems } from "@/data/practice-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { saveStudyPlanCommand } from "@/study/commands";
import { studyPlanWriteSchema } from "@/study/schemas";

export interface WorkspaceActionState {
  status: "idle" | "success" | "error";
  message: string;
  inviteUrl?: string;
  inviteCode?: string;
}

function appOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function generateStudentInviteAction(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  await requireAccountRole("tutor");
  const parsed = z.uuid().safeParse(getFormString(formData, "classId"));
  if (!parsed.success)
    return { status: "error", message: "Choose a valid class." };
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_student_invite", {
    p_class_id: parsed.data,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });
  if (error) return { status: "error", message: error.message };
  return {
    status: "success",
    message: "One-time invitation created. It expires in seven days.",
    inviteUrl: `${appOrigin()}/invite/${token}`,
    inviteCode: token,
  };
}

export async function createAssignmentAction(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  await requireAccountRole("tutor");
  const dueValue = getFormString(formData, "dueAt");
  const parsed = assignmentSchema.safeParse({
    classId: getFormString(formData, "classId"),
    studentId: getFormString(formData, "studentId"),
    itemVersionId: getFormString(formData, "itemVersionId"),
    title: getFormString(formData, "title"),
    dueAt: dueValue ? new Date(dueValue).toISOString() : undefined,
    idempotencyKey: getFormString(formData, "idempotencyKey"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Complete the assignment fields with valid linked records.",
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_assignment", {
    p_class_id: parsed.data.classId,
    p_student_id: parsed.data.studentId,
    p_item_version_id: parsed.data.itemVersionId,
    p_title: parsed.data.title,
    p_due_at: parsed.data.dueAt ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath("/tutor/dashboard");
  return {
    status: "success",
    message: "Assignment sent to the linked student.",
  };
}

export async function copyDemoContentAction(
  previous: WorkspaceActionState,
): Promise<WorkspaceActionState> {
  void previous;
  const account = await requireAccountRole("tutor");
  if (!account)
    return { status: "error", message: "Supabase is not configured." };
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", account.userId)
    .eq("role", "tutor")
    .is("retired_at", null)
    .limit(1)
    .maybeSingle();
  if (!membership)
    return { status: "error", message: "Create a tutor workspace first." };

  let copied = 0;
  for (const practiceItem of practiceItems) {
    const contentKey = `demo-${practiceItem.id}`;
    const { data: existingItem } = await supabase
      .from("items")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("content_key", contentKey)
      .maybeSingle();
    if (existingItem) {
      const { data: publishedVersion } = await supabase
        .from("item_versions")
        .select("id")
        .eq("item_id", existingItem.id)
        .eq("status", "published")
        .limit(1)
        .maybeSingle();
      if (publishedVersion) continue;
    }

    const sourceStimulus =
      practiceItem.kind === "reading-question"
        ? getReadingStimulus(practiceItem.stimulusId)
        : null;
    const segments = sourceStimulus
      ? sourceStimulus.segments
      : [
          {
            id: `${practiceItem.id}-source`,
            text:
              practiceItem.kind === "complete-words"
                ? `${practiceItem.paragraphBefore}${practiceItem.wordPrefix}___${practiceItem.paragraphAfter}`
                : practiceItem.kind === "transfer"
                  ? practiceItem.microContext
                  : practiceItem.prompt,
          },
        ];
    const stimulusKey = `demo-source-${practiceItem.id}`;
    const serializedSegments: Json = segments.map((segment) => ({
      id: segment.id,
      text: segment.text,
    }));
    const { data: existingStimulus } = await supabase
      .from("stimuli")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("content_key", stimulusKey)
      .maybeSingle();
    let stimulusId = existingStimulus?.id;
    if (!stimulusId) {
      const { data: createdStimulus, error: stimulusError } = await supabase
        .from("stimuli")
        .insert({
          organization_id: membership.organization_id,
          content_key: stimulusKey,
          task_type: practiceItem.taskType,
          created_by: account.userId,
        })
        .select("id")
        .single();
      if (stimulusError || !createdStimulus) {
        return {
          status: "error",
          message: stimulusError?.message ?? "Could not copy a stimulus.",
        };
      }
      stimulusId = createdStimulus.id;
    }
    const { data: existingStimulusVersion } = await supabase
      .from("stimulus_versions")
      .select("id")
      .eq("stimulus_id", stimulusId)
      .eq("status", "published")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    let stimulusVersionId = existingStimulusVersion?.id;
    if (!stimulusVersionId) {
      const { data: latestStimulusVersion } = await supabase
        .from("stimulus_versions")
        .select("version")
        .eq("stimulus_id", stimulusId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: stimulusVersion, error: stimulusVersionError } =
        await supabase
          .from("stimulus_versions")
          .insert({
            stimulus_id: stimulusId,
            version: (latestStimulusVersion?.version ?? 0) + 1,
            title: sourceStimulus?.title ?? practiceItem.title,
            context:
              sourceStimulus?.context ??
              "Original independent TraceTutor practice content.",
            segments: serializedSegments,
            status: "published",
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();
      if (stimulusVersionError || !stimulusVersion) {
        return {
          status: "error",
          message:
            stimulusVersionError?.message ??
            "Could not copy a stimulus version.",
        };
      }
      stimulusVersionId = stimulusVersion.id;
    }
    let itemId = existingItem?.id;
    if (!itemId) {
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          organization_id: membership.organization_id,
          stimulus_id: stimulusId,
          content_key: contentKey,
          task_type: practiceItem.taskType,
          created_by: account.userId,
        })
        .select("id")
        .single();
      if (itemError || !item)
        return {
          status: "error",
          message: itemError?.message ?? "Could not copy an item.",
        };
      itemId = item.id;
    }

    const prompt =
      practiceItem.kind === "complete-words"
        ? `Complete “${practiceItem.wordPrefix}___” in the paragraph.`
        : practiceItem.prompt;
    const { data: latestItemVersion } = await supabase
      .from("item_versions")
      .select("version")
      .eq("item_id", itemId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: itemVersion, error: versionError } = await supabase
      .from("item_versions")
      .insert({
        item_id: itemId,
        stimulus_version_id: stimulusVersionId,
        version: (latestItemVersion?.version ?? 0) + 1,
        prompt,
        explanation: practiceItem.explanation,
        response_kind:
          practiceItem.kind === "complete-words" ? "typed" : "choice",
        correct_response:
          practiceItem.kind === "complete-words"
            ? practiceItem.answerEnding
            : null,
        status: "reviewed",
      })
      .select("id")
      .single();
    if (versionError || !itemVersion)
      return {
        status: "error",
        message: versionError?.message ?? "Could not copy an item version.",
      };

    if (practiceItem.kind !== "complete-words") {
      const metadata = getItemDiagnosticMetadata(practiceItem);
      const { error: optionsError } = await supabase
        .from("item_options")
        .insert(
          practiceItem.options.map((option, index) => ({
            item_version_id: itemVersion.id,
            option_key: option.id,
            label: option.label,
            is_correct: option.id === practiceItem.correctOptionId,
            distractor_tag:
              option.id === practiceItem.correctOptionId
                ? null
                : (metadata.optionDistractorTags[option.id] ?? "unsupported"),
            position: index + 1,
          })),
        );
      if (optionsError)
        return { status: "error", message: optionsError.message };
    }

    const designatedIds =
      practiceItem.kind === "reading-question"
        ? new Set(practiceItem.correctEvidenceSegmentIds)
        : new Set([segments[0]?.id]);
    const { error: evidenceError } = await supabase
      .from("evidence_spans")
      .insert(
        segments.map((segment, index) => ({
          item_version_id: itemVersion.id,
          segment_key: segment.id,
          excerpt: segment.text,
          is_designated:
            designatedIds.has(segment.id) ||
            (designatedIds.size === 0 && index === 0),
        })),
      );
    if (evidenceError)
      return { status: "error", message: evidenceError.message };

    const skillCode = getItemDiagnosticMetadata(practiceItem).skill;
    const { data: skill } = await supabase
      .from("skills")
      .select("id")
      .eq("code", skillCode)
      .limit(1)
      .maybeSingle();
    if (skill) {
      const { error: mappingError } = await supabase
        .from("item_skill_mappings")
        .insert({
          item_version_id: itemVersion.id,
          skill_id: skill.id,
          weight: 1,
        });
      if (mappingError)
        return { status: "error", message: mappingError.message };
    }
    const { error: publishError } = await supabase
      .from("item_versions")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", itemVersion.id);
    if (publishError) return { status: "error", message: publishError.message };
    copied += 1;
  }

  revalidatePath("/tutor/content");
  revalidatePath("/tutor/dashboard");
  return {
    status: "success",
    message:
      copied > 0
        ? `Copied ${copied} original content items. No demo students or attempt history were copied.`
        : "The original demo content is already present. No attempt history was copied.",
  };
}

export async function saveStudentOnboardingAction(formData: FormData) {
  const account = await requireAccountRole("student");
  if (!account) return;
  const parsed = z
    .object({
      targetTestDate: z.iso.date(),
      readingConfidence: z.enum(["beginner", "developing", "strong"]),
      dailyStudyMinutes: z.coerce
        .number()
        .pipe(z.union([z.literal(5), z.literal(10), z.literal(15)])),
      reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      mainStruggle: z.enum([
        "vocabulary",
        "finding-evidence",
        "inference",
        "time-pressure",
        "not-sure",
      ]),
    })
    .safeParse({
      targetTestDate: getFormString(formData, "targetTestDate"),
      readingConfidence: getFormString(formData, "readingConfidence"),
      dailyStudyMinutes: getFormString(formData, "dailyStudyMinutes"),
      reminderTime: getFormString(formData, "reminderTime"),
      mainStruggle: getFormString(formData, "mainStruggle"),
    });
  if (!parsed.success) redirect("/student/today?onboarding=invalid");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      target_test_date: parsed.data.targetTestDate,
      reading_confidence: parsed.data.readingConfidence,
      daily_study_minutes: parsed.data.dailyStudyMinutes,
      reminder_time: `${parsed.data.reminderTime}:00`,
      main_struggle: parsed.data.mainStruggle,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", account.userId);
  if (error) redirect("/student/today?onboarding=error");
  revalidatePath("/student/today");
}

export async function savePersonalizedStudyPlanAction(formData: FormData) {
  const account = await requireAccountRole("student");
  if (!account) return;
  const completedAt = new Date().toISOString();
  const dailyMinutes = Number(getFormString(formData, "defaultDailyMinutes"));
  const studyDays = Number(getFormString(formData, "studyDaysPerWeek"));
  const explicitWeeklyGoal = Number(
    getFormString(formData, "weeklyGoalMinutes"),
  );
  const value = {
    learningStyle: getFormString(formData, "learningStyle"),
    defaultDailyMinutes: dailyMinutes,
    weeklyGoalMinutes:
      explicitWeeklyGoal || Math.max(30, dailyMinutes * studyDays),
    studyDaysPerWeek: studyDays,
    currentReadingLevel: getFormString(formData, "currentReadingLevel")
      ? Number(getFormString(formData, "currentReadingLevel"))
      : null,
    targetReadingScore: getFormString(formData, "targetReadingScore")
      ? Number(getFormString(formData, "targetReadingScore"))
      : null,
    targetTestDate: getFormString(formData, "targetTestDate") || null,
    readingPriority: getFormString(formData, "readingPriority"),
    preferredStudyTime: getFormString(formData, "preferredStudyTime") || null,
    timezone: getFormString(formData, "timezone") || "UTC",
    onboardingCompletedAt: completedAt,
  };
  const parsed = studyPlanWriteSchema.safeParse(value);
  if (!parsed.success) redirect("/student/today?study-plan=invalid");
  await saveStudyPlanCommand(parsed.data);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      target_test_date: parsed.data.targetTestDate,
      reminder_time: parsed.data.preferredStudyTime,
      onboarding_completed_at: completedAt,
    })
    .eq("id", account.userId);
  if (error) redirect("/student/today?study-plan=error");
  revalidatePath("/student", "layout");
  redirect("/student/today");
}

export async function submitProductionResponseAction(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  await requireAccountRole("student");
  const parsed = responseSubmissionSchema.safeParse({
    assignmentItemId: getFormString(formData, "assignmentItemId"),
    clientSubmissionId: getFormString(formData, "clientSubmissionId"),
    selectedOptionId: getFormString(formData, "selectedOptionId") || null,
    typedResponse: getFormString(formData, "typedResponse") || null,
    confidence: getFormString(formData, "confidence") || null,
    evidenceSpanIds: formData
      .getAll("evidenceSpanIds")
      .filter((value): value is string => typeof value === "string"),
    elapsedSeconds: Number(getFormString(formData, "elapsedSeconds") || "0"),
    answerChanges: Number(getFormString(formData, "answerChanges") || "0"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid response.",
    };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_assignment_response", {
    p_assignment_item_id: parsed.data.assignmentItemId,
    p_client_submission_id: parsed.data.clientSubmissionId,
    p_selected_option_id: parsed.data.selectedOptionId,
    p_typed_response: parsed.data.typedResponse,
    p_confidence: parsed.data.confidence,
    p_evidence_span_ids: parsed.data.evidenceSpanIds,
    p_elapsed_seconds: parsed.data.elapsedSeconds,
    p_answer_changes: parsed.data.answerChanges,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath("/student/today");
  revalidatePath("/tutor/dashboard");
  const result =
    data && typeof data === "object" && !Array.isArray(data) ? data : null;
  return {
    status: "success",
    message: result?.duplicate
      ? "This response was already saved safely."
      : "Response saved. Your linked tutor can now review it.",
  };
}
