"use server";

import { requireAccountRole } from "@/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  recommendationResponseSchema,
  studyActivityWriteSchema,
  studyPlanWriteSchema,
  studyRecommendationWriteSchema,
} from "@/study/schemas";

function databasePriority(priority: string) {
  return priority.replaceAll("-", "_") as
    | "balanced"
    | "complete_words"
    | "daily_life"
    | "academic"
    | "mistake_review";
}

export async function saveStudyPlanCommand(input: unknown) {
  const account = await requireAccountRole("student");
  if (!account) throw new Error("Student account required.");
  const plan = studyPlanWriteSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("learner_study_plans").upsert({
    learner_id: account.userId,
    learning_style:
      plan.learningStyle === "deep-focus" ? "deep_focus" : "daily_rhythm",
    default_daily_minutes: plan.defaultDailyMinutes,
    weekly_goal_minutes: plan.weeklyGoalMinutes,
    study_days_per_week: plan.studyDaysPerWeek,
    current_reading_level: plan.currentReadingLevel,
    target_reading_score: plan.targetReadingScore,
    target_test_date: plan.targetTestDate,
    reading_priority: databasePriority(plan.readingPriority),
    preferred_study_time: plan.preferredStudyTime,
    timezone: plan.timezone,
    onboarding_completed_at: plan.onboardingCompletedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("The study plan could not be saved.");
}

export async function recordStudyActivityCommand(input: unknown) {
  const account = await requireAccountRole("student");
  if (!account) throw new Error("Student account required.");
  const event = studyActivityWriteSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_study_activity", {
    p_session_id: event.sessionId,
    p_client_event_id: event.clientEventId,
    p_local_date: event.localDate,
    p_active_seconds: event.activeSeconds,
    p_questions_answered: event.questionsAnswered,
    p_correct_answers: event.correctAnswers,
    p_reviews_completed: event.reviewsCompleted,
    p_transfer_items_completed: event.transferItemsCompleted,
    p_diagnostics_completed: event.diagnosticsCompleted,
  });
  if (error) throw new Error("Study activity could not be recorded.");
  return { accepted: data };
}

export async function recommendStudyPlanCommand(input: unknown) {
  const account = await requireAccountRole("tutor");
  if (!account) throw new Error("Tutor account required.");
  const recommendation = studyRecommendationWriteSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: link } = await supabase
    .from("tutor_student_links")
    .select("organization_id")
    .eq("tutor_id", account.userId)
    .eq("student_id", recommendation.studentId)
    .eq("status", "active")
    .maybeSingle();
  if (!link) throw new Error("Linked student not found.");
  const { error } = await supabase.from("tutor_study_recommendations").insert({
    organization_id: link.organization_id,
    tutor_id: account.userId,
    student_id: recommendation.studentId,
    weekly_goal_minutes: recommendation.weeklyGoalMinutes,
    reading_priority: recommendation.readingPriority
      ? databasePriority(recommendation.readingPriority)
      : null,
    session_type: recommendation.sessionType,
    note: recommendation.note,
  });
  if (error) throw new Error("The recommendation could not be saved.");
}

export async function respondToStudyRecommendationCommand(input: unknown) {
  const account = await requireAccountRole("student");
  if (!account) throw new Error("Student account required.");
  const response = recommendationResponseSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("respond_to_study_recommendation", {
    p_recommendation_id: response.recommendationId,
    p_accept: response.accept,
  });
  if (error) throw new Error("The recommendation response could not be saved.");
}
