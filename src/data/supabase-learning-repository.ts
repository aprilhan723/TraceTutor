import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyStudyState } from "@/data/seed-study-state";
import type {
  DailyMission,
  Intervention,
  MistakeCategory,
  MistakePattern,
  Student,
  Tutor,
} from "@/domain/models";
import type { LearningRepository } from "@/domain/repositories/learning-repository";
import type {
  LearnerStudyPlan,
  StudentStudyState,
  StudySession,
} from "@/domain/study";
import type { TutorWorkspaceState } from "@/domain/tutor";
import type { Database } from "@/lib/supabase/database.types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function categoryForCause(cause: string): MistakeCategory {
  if (
    cause.includes("grammar") ||
    cause.includes("spell") ||
    cause.includes("lex")
  ) {
    return "word-form";
  }
  if (
    cause.includes("scope") ||
    cause.includes("modality") ||
    cause.includes("outside")
  ) {
    return "inference-overreach";
  }
  if (cause.includes("main-point") || cause.includes("purpose")) {
    return "purpose-confusion";
  }
  return "evidence-drift";
}

function emptyTutorWorkspace(tutorId: string): TutorWorkspaceState {
  return {
    version: 1,
    tutorId,
    diagnosisCases: [],
    studentProfiles: [],
    contentVersions: [],
    lessonBriefs: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export class SupabaseLearningRepository implements LearningRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly accountId: string,
  ) {}

  async getStudent(studentId: string): Promise<Student | null> {
    const { data: profile } = await this.client
      .from("profiles")
      .select("id, display_name")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();
    if (!profile) return null;
    const { data: links } = await this.client
      .from("tutor_student_links")
      .select("tutor_id")
      .eq("student_id", studentId)
      .eq("status", "active")
      .limit(1);
    const tutorId = links?.[0]?.tutor_id;
    if (!tutorId) return null;
    const { count } = await this.client
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "completed");
    return {
      id: profile.id,
      tutorId,
      name: profile.display_name,
      initials: initials(profile.display_name),
      targetScore: 0,
      currentStreakDays: count ?? 0,
    };
  }

  async getTutor(tutorId: string): Promise<Tutor | null> {
    const { data } = await this.client
      .from("profiles")
      .select("id, display_name, created_at")
      .eq("id", tutorId)
      .eq("role", "tutor")
      .maybeSingle();
    return data
      ? {
          id: data.id,
          name: data.display_name,
          initials: initials(data.display_name),
          title: "TOEFL Reading Tutor",
          verifiedAt: data.created_at,
        }
      : null;
  }

  async getStudentsForTutor(tutorId: string): Promise<Student[]> {
    const { data: links } = await this.client
      .from("tutor_student_links")
      .select("student_id")
      .eq("tutor_id", tutorId)
      .eq("status", "active");
    const students = await Promise.all(
      (links ?? []).map((link) => this.getStudent(link.student_id)),
    );
    return students.filter((student): student is Student => student !== null);
  }

  async getTodayMission(studentId: string): Promise<DailyMission | null> {
    const { data: assignments } = await this.client
      .from("assignments")
      .select("id, title, due_at")
      .eq("student_id", studentId)
      .eq("status", "assigned")
      .order("due_at")
      .limit(1);
    const assignment = assignments?.[0];
    if (!assignment) return null;
    const { data: items } = await this.client
      .from("assignment_items")
      .select("id")
      .eq("assignment_id", assignment.id)
      .order("position");
    return {
      id: assignment.id,
      studentId,
      title: assignment.title,
      focus: "evidence-drift",
      focusLabel: "Tutor-assigned correction",
      estimatedMinutes: 10,
      progress: 0,
      dueLabel: assignment.due_at
        ? `Due ${assignment.due_at.slice(0, 10)}`
        : "Ready now",
      steps: (items ?? []).map((item, index) => ({
        id: item.id,
        label: `Correction ${index + 1}`,
        detail: "Original tutor-assigned practice",
        status: index === 0 ? "ready" : "locked",
      })),
    };
  }

  async getMistakePatterns(studentId: string): Promise<MistakePattern[]> {
    const { data } = await this.client
      .from("learner_error_states")
      .select("id, error_cause_code, status, recurrence_count, updated_at")
      .eq("student_id", studentId);
    return (data ?? []).map((state) => ({
      id: state.id,
      studentId,
      category: categoryForCause(state.error_cause_code),
      label: state.error_cause_code.replaceAll("-", " "),
      description: "A current, evidence-linked correction pattern.",
      recurrenceCount: state.recurrence_count,
      trend:
        state.status === "improving" || state.status === "resolved"
          ? "improving"
          : state.status === "recurring" || state.status === "unstable"
            ? "needs-attention"
            : "steady",
      lastSeenAt: state.updated_at,
    }));
  }

  async getInterventions(tutorId: string): Promise<Intervention[]> {
    const students = await this.getStudentsForTutor(tutorId);
    const patterns = await Promise.all(
      students.map(async (student) => ({
        student,
        patterns: await this.getMistakePatterns(student.id),
      })),
    );
    return patterns.flatMap(({ student, patterns: studentPatterns }) =>
      studentPatterns
        .filter((pattern) => pattern.trend === "needs-attention")
        .map((pattern) => ({
          id: `intervention-${pattern.id}`,
          tutorId,
          studentId: student.id,
          studentName: student.name,
          patternLabel: pattern.label,
          reason: `${pattern.recurrenceCount} stored observations in the linked workspace`,
          priority: pattern.recurrenceCount >= 3 ? "high" : "medium",
          suggestedAction:
            "Review the response evidence before the next lesson.",
        })),
    );
  }

  async getStudyState(studentId: string): Promise<StudentStudyState> {
    const state = createEmptyStudyState(studentId);
    const [
      profileResult,
      planResult,
      sessionsResult,
      dailyResult,
      streakResult,
      recommendationsResult,
    ] = await Promise.all([
      this.client
        .from("profiles")
        .select(
          "target_test_date, reading_confidence, daily_study_minutes, reminder_time, main_struggle, onboarding_completed_at, updated_at",
        )
        .eq("id", studentId)
        .eq("role", "student")
        .maybeSingle(),
      this.client
        .from("learner_study_plans")
        .select("*")
        .eq("learner_id", studentId)
        .maybeSingle(),
      this.client
        .from("study_sessions")
        .select("*")
        .eq("learner_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
      this.client
        .from("daily_learner_progress")
        .select("*")
        .eq("learner_id", studentId)
        .order("local_date")
        .limit(120),
      this.client
        .from("learner_streak_stats")
        .select("*")
        .eq("learner_id", studentId)
        .maybeSingle(),
      this.client
        .from("tutor_study_recommendations")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const data = profileResult.data;
    if (!data) return state;
    if (
      data.target_test_date &&
      data.reading_confidence &&
      data.daily_study_minutes &&
      data.reminder_time &&
      data.main_struggle &&
      data.onboarding_completed_at
    ) {
      state.onboarding = {
        targetTestDate: data.target_test_date,
        readingConfidence: data.reading_confidence,
        dailyStudyMinutes: data.daily_study_minutes,
        reminderTime: data.reminder_time.slice(0, 5),
        mainStruggle: data.main_struggle as NonNullable<
          StudentStudyState["onboarding"]
        >["mainStruggle"],
        completedAt: data.onboarding_completed_at,
      };
    }
    const plan = planResult.data;
    if (plan) {
      state.studyPlan = {
        learningStyle:
          plan.learning_style === "deep_focus" ? "deep-focus" : "daily-rhythm",
        defaultDailyMinutes: plan.default_daily_minutes,
        weeklyGoalMinutes: plan.weekly_goal_minutes,
        studyDaysPerWeek: plan.study_days_per_week,
        currentReadingLevel: plan.current_reading_level,
        targetReadingScore: plan.target_reading_score,
        targetTestDate: plan.target_test_date,
        readingPriority: plan.reading_priority.replaceAll(
          "_",
          "-",
        ) as LearnerStudyPlan["readingPriority"],
        timezone: plan.timezone,
        preferredStudyTime: plan.preferred_study_time?.slice(0, 5) ?? null,
        onboardingCompletedAt: plan.onboarding_completed_at,
        updatedAt: plan.updated_at,
      };
    }
    state.studySessions = (sessionsResult.data ?? []).map(
      (session): StudySession => ({
        id: session.id,
        learnerId: session.learner_id,
        sessionType: session.session_type.replaceAll(
          "_",
          "-",
        ) as StudySession["sessionType"],
        topic: session.topic.replaceAll("_", "-") as StudySession["topic"],
        plannedMinutes: session.planned_minutes,
        availableMinutes: session.available_minutes,
        activeSeconds: session.active_seconds,
        startedAt: session.started_at,
        lastActivityAt: session.last_activity_at,
        completedAt: session.completed_at,
        pausedAt: session.paused_at,
        status: session.status,
        questionsAnswered: session.questions_answered,
        correctAnswers: session.correct_answers,
        dueReviewsCompleted: session.due_reviews_completed,
        transferItemsCompleted: session.transfer_items_completed,
        diagnosticLoopsCompleted: session.diagnostic_loops_completed,
        source: session.source.replaceAll("_", "-") as StudySession["source"],
        includeDueReviews: session.include_due_reviews,
        timed: session.timed,
        blocks: [],
        contentShortage: session.content_shortage,
        shortageMessage: session.shortage_message,
        endedAfterBlockId: session.ended_after_block_key,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      }),
    );
    state.activeSessionId =
      state.studySessions.find((session) =>
        ["active", "paused"].includes(session.status),
      )?.id ?? null;
    state.dailyProgress = (dailyResult.data ?? []).map((entry) => ({
      learnerId: entry.learner_id,
      localDate: entry.local_date,
      activeSeconds: entry.active_seconds,
      questionsAnswered: entry.questions_answered,
      correctAnswers: entry.correct_answers,
      reviewsCompleted: entry.reviews_completed,
      transferItemsCompleted: entry.transfer_items_completed,
      diagnosticsCompleted: entry.diagnostics_completed,
      dailyCoreCompleted: entry.daily_core_completed,
      streakEligible: entry.streak_eligible,
      goalMinutes: entry.goal_minutes,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    }));
    if (streakResult.data) {
      state.streakStats = {
        current: streakResult.data.current_streak,
        longest: streakResult.data.longest_streak,
        lastEligibleLocalDate: streakResult.data.last_eligible_local_date,
      };
      state.correctionStreak = streakResult.data.current_streak;
    }
    state.tutorRecommendations = (recommendationsResult.data ?? []).map(
      (entry) => ({
        id: entry.id,
        recommendedAt: entry.created_at,
        weeklyGoalMinutes: entry.weekly_goal_minutes,
        readingPriority: entry.reading_priority
          ? (entry.reading_priority.replaceAll(
              "_",
              "-",
            ) as LearnerStudyPlan["readingPriority"])
          : null,
        sessionType:
          entry.session_type === "focused" || entry.session_type === "deep"
            ? entry.session_type
            : null,
        note: entry.note,
        acknowledgedAt: entry.acknowledged_at,
        decision:
          entry.decision === "kept_current" ? "kept-current" : entry.decision,
      }),
    );
    state.updatedAt = data.updated_at;
    return state;
  }

  async saveStudyState(state: StudentStudyState): Promise<void> {
    void state;
    throw new Error(
      "Supabase aggregate writes must use the validated assignment response or onboarding command.",
    );
  }

  async resetStudyState(studentId: string) {
    return this.getStudyState(studentId);
  }

  async getTutorWorkspace(tutorId: string) {
    return emptyTutorWorkspace(tutorId);
  }

  async saveTutorWorkspace(state: TutorWorkspaceState): Promise<void> {
    void state;
    throw new Error(
      "Supabase tutor mutations must use validated, audited relational commands.",
    );
  }

  async resetTutorWorkspace(tutorId: string) {
    return this.getTutorWorkspace(tutorId);
  }

  get activeAccountId() {
    return this.accountId;
  }
}
