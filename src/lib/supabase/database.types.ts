export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

type Timestamped = {
  created_at: string;
  updated_at: string;
};

export type AccountRole = "student" | "tutor";
export type ContentStatus = "draft" | "reviewed" | "published" | "retired";
export type LearningStyle = "daily_rhythm" | "deep_focus";
export type ReadingPriority =
  "balanced" | "complete_words" | "daily_life" | "academic" | "mistake_review";
export type StudySessionType =
  "daily_core" | "quick" | "focused" | "deep" | "intensive" | "custom";

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        Timestamped & {
          id: string;
          role: AccountRole;
          display_name: string;
          target_test_date: string | null;
          reading_confidence: "beginner" | "developing" | "strong" | null;
          daily_study_minutes: 5 | 10 | 15 | null;
          reminder_time: string | null;
          main_struggle: string | null;
          onboarding_completed_at: string | null;
          retired_at: string | null;
        },
        {
          id: string;
          role: AccountRole;
          display_name: string;
          target_test_date?: string | null;
          reading_confidence?: "beginner" | "developing" | "strong" | null;
          daily_study_minutes?: 5 | 10 | 15 | null;
          reminder_time?: string | null;
          main_struggle?: string | null;
          onboarding_completed_at?: string | null;
          retired_at?: string | null;
        }
      >;
      organizations: Table<
        Timestamped & {
          id: string;
          name: string;
          created_by: string;
          retired_at: string | null;
        },
        {
          id?: string;
          name: string;
          created_by: string;
          retired_at?: string | null;
        }
      >;
      memberships: Table<
        {
          id: string;
          organization_id: string;
          profile_id: string;
          role: AccountRole;
          joined_at: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          profile_id: string;
          role: AccountRole;
          joined_at?: string;
          retired_at?: string | null;
        }
      >;
      classes: Table<
        Timestamped & {
          id: string;
          organization_id: string;
          name: string;
          created_by: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          name: string;
          created_by: string;
          retired_at?: string | null;
        }
      >;
      tutor_student_links: Table<
        {
          id: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          student_id: string;
          status: "active" | "retired";
          linked_at: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          student_id: string;
          status?: "active" | "retired";
          linked_at?: string;
          retired_at?: string | null;
        }
      >;
      student_invites: Table<
        {
          id: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
          retired_at?: string | null;
        }
      >;
      stimuli: Table<
        Timestamped & {
          id: string;
          organization_id: string;
          content_key: string;
          task_type: string;
          created_by: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          content_key: string;
          task_type: string;
          created_by: string;
          retired_at?: string | null;
        }
      >;
      stimulus_versions: Table<
        Timestamped & {
          id: string;
          stimulus_id: string;
          version: number;
          title: string;
          context: string;
          segments: Json;
          status: ContentStatus;
          published_at: string | null;
          retired_at: string | null;
        },
        {
          id?: string;
          stimulus_id: string;
          version: number;
          title: string;
          context: string;
          segments: Json;
          status?: ContentStatus;
          published_at?: string | null;
          retired_at?: string | null;
        }
      >;
      items: Table<
        Timestamped & {
          id: string;
          organization_id: string;
          stimulus_id: string | null;
          content_key: string;
          task_type: string;
          created_by: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          stimulus_id?: string | null;
          content_key: string;
          task_type: string;
          created_by: string;
          retired_at?: string | null;
        }
      >;
      item_versions: Table<
        Timestamped & {
          id: string;
          item_id: string;
          stimulus_version_id: string | null;
          version: number;
          prompt: string;
          explanation: string;
          response_kind: string;
          correct_response: string | null;
          status: ContentStatus;
          published_at: string | null;
          retired_at: string | null;
        },
        {
          id?: string;
          item_id: string;
          stimulus_version_id?: string | null;
          version: number;
          prompt: string;
          explanation: string;
          response_kind: string;
          correct_response?: string | null;
          status?: ContentStatus;
          published_at?: string | null;
          retired_at?: string | null;
        }
      >;
      item_options: Table<
        {
          id: string;
          item_version_id: string;
          option_key: string;
          label: string;
          is_correct: boolean;
          distractor_tag: string | null;
          position: number;
          created_at: string;
        },
        {
          id?: string;
          item_version_id: string;
          option_key: string;
          label: string;
          is_correct?: boolean;
          distractor_tag?: string | null;
          position: number;
          created_at?: string;
        }
      >;
      evidence_spans: Table<
        {
          id: string;
          item_version_id: string;
          segment_key: string;
          excerpt: string;
          start_offset: number | null;
          end_offset: number | null;
          is_designated: boolean;
          created_at: string;
        },
        {
          id?: string;
          item_version_id: string;
          segment_key: string;
          excerpt: string;
          start_offset?: number | null;
          end_offset?: number | null;
          is_designated?: boolean;
          created_at?: string;
        }
      >;
      skills: Table<
        {
          id: string;
          taxonomy_version_id: string;
          code: string;
          label: string;
          description: string;
          parent_skill_id: string | null;
          retired_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          taxonomy_version_id: string;
          code: string;
          label: string;
          description?: string;
          parent_skill_id?: string | null;
          retired_at?: string | null;
          created_at?: string;
        }
      >;
      item_skill_mappings: Table<
        {
          id: string;
          item_version_id: string;
          skill_id: string;
          weight: number;
          created_at: string;
        },
        {
          id?: string;
          item_version_id: string;
          skill_id: string;
          weight?: number;
          created_at?: string;
        }
      >;
      assignments: Table<
        Timestamped & {
          id: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          student_id: string;
          title: string;
          status: "draft" | "assigned" | "completed" | "cancelled";
          due_at: string | null;
          assigned_at: string | null;
          completed_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          class_id: string;
          tutor_id: string;
          student_id: string;
          title: string;
          status?: "draft" | "assigned" | "completed" | "cancelled";
          due_at?: string | null;
          assigned_at?: string | null;
          completed_at?: string | null;
        }
      >;
      assignment_items: Table<
        {
          id: string;
          assignment_id: string;
          item_version_id: string;
          position: number;
          purpose: string;
          created_at: string;
        },
        {
          id?: string;
          assignment_id: string;
          item_version_id: string;
          position: number;
          purpose?: string;
          created_at?: string;
        }
      >;
      attempts: Table<
        {
          id: string;
          assignment_item_id: string;
          student_id: string;
          attempt_number: number;
          client_submission_id: string;
          started_at: string;
          submitted_at: string | null;
          elapsed_seconds: number;
          answer_changes: number;
          status: "in_progress" | "submitted" | "void";
          created_at: string;
        },
        {
          id?: string;
          assignment_item_id: string;
          student_id: string;
          attempt_number?: number;
          client_submission_id: string;
          started_at?: string;
          submitted_at?: string | null;
          elapsed_seconds?: number;
          answer_changes?: number;
          status?: "in_progress" | "submitted" | "void";
          created_at?: string;
        }
      >;
      responses: Table<
        {
          id: string;
          attempt_id: string;
          selected_option_id: string | null;
          typed_response: string | null;
          normalized_response: string | null;
          is_correct: boolean;
          created_at: string;
        },
        {
          id?: string;
          attempt_id: string;
          selected_option_id?: string | null;
          typed_response?: string | null;
          normalized_response?: string | null;
          is_correct: boolean;
          created_at?: string;
        }
      >;
      confidence_ratings: Table<
        { id: string; attempt_id: string; rating: string; created_at: string },
        { id?: string; attempt_id: string; rating: string; created_at?: string }
      >;
      evidence_selections: Table<
        {
          id: string;
          attempt_id: string;
          evidence_span_id: string;
          created_at: string;
        },
        {
          id?: string;
          attempt_id: string;
          evidence_span_id: string;
          created_at?: string;
        }
      >;
      diagnostic_sessions: Table<
        Timestamped & {
          id: string;
          attempt_id: string;
          student_id: string;
          machine_suggestion: Json;
          machine_model_version: string;
          diagnosis_confidence: number | null;
          student_probe_answer: Json | null;
          status: "pending" | "reviewed" | "ambiguous";
        },
        {
          id?: string;
          attempt_id: string;
          student_id: string;
          machine_suggestion: Json;
          machine_model_version: string;
          diagnosis_confidence?: number | null;
          student_probe_answer?: Json | null;
          status?: "pending" | "reviewed" | "ambiguous";
        }
      >;
      tutor_adjudications: Table<
        {
          id: string;
          diagnostic_session_id: string;
          tutor_id: string;
          revision: number;
          decision: string;
          primary_cause: string | null;
          secondary_causes: string[];
          feedback: string | null;
          transfer_item_version_id: string | null;
          follow_up_question: string | null;
          add_to_lesson: boolean;
          created_at: string;
        },
        {
          id?: string;
          diagnostic_session_id: string;
          tutor_id: string;
          revision: number;
          decision: string;
          primary_cause?: string | null;
          secondary_causes?: string[];
          feedback?: string | null;
          transfer_item_version_id?: string | null;
          follow_up_question?: string | null;
          add_to_lesson?: boolean;
          created_at?: string;
        }
      >;
      tutor_notes: Table<
        Timestamped & {
          id: string;
          organization_id: string;
          tutor_id: string;
          student_id: string;
          body: string;
          retired_at: string | null;
        },
        {
          id?: string;
          organization_id: string;
          tutor_id: string;
          student_id: string;
          body: string;
          retired_at?: string | null;
        }
      >;
      learner_error_states: Table<
        Timestamped & {
          id: string;
          student_id: string;
          taxonomy_version_id: string;
          skill_id: string | null;
          error_cause_code: string;
          status: string;
          recurrence_count: number;
          secure_transfer_count: number;
          resolved_at: string | null;
        },
        {
          id?: string;
          student_id: string;
          taxonomy_version_id: string;
          skill_id?: string | null;
          error_cause_code: string;
          status: string;
          recurrence_count?: number;
          secure_transfer_count?: number;
          resolved_at?: string | null;
        }
      >;
      ai_diagnosis_suggestions: Table<
        {
          id: string;
          diagnostic_session_id: string;
          organization_id: string;
          requested_by: string;
          request_id: string;
          input_fingerprint: string;
          model_version: string;
          prompt_version: string;
          schema_version: string;
          suggestion: Json;
          policy_review: Json;
          input_tokens: number;
          output_tokens: number;
          estimated_cost_microusd: number | null;
          created_at: string;
        },
        {
          id?: string;
          diagnostic_session_id: string;
          organization_id: string;
          requested_by: string;
          request_id: string;
          input_fingerprint: string;
          model_version: string;
          prompt_version: string;
          schema_version: string;
          suggestion: Json;
          policy_review: Json;
          input_tokens?: number;
          output_tokens?: number;
          estimated_cost_microusd?: number | null;
          created_at?: string;
        }
      >;
      learner_study_plans: Table<
        Timestamped & {
          learner_id: string;
          learning_style: LearningStyle;
          default_daily_minutes: number;
          weekly_goal_minutes: number;
          study_days_per_week: number;
          current_reading_level: number | null;
          target_reading_score: number | null;
          target_test_date: string | null;
          reading_priority: ReadingPriority;
          preferred_study_time: string | null;
          timezone: string;
          onboarding_completed_at: string | null;
        },
        {
          learner_id: string;
          learning_style: LearningStyle;
          default_daily_minutes: number;
          weekly_goal_minutes: number;
          study_days_per_week: number;
          current_reading_level?: number | null;
          target_reading_score?: number | null;
          target_test_date?: string | null;
          reading_priority?: ReadingPriority;
          preferred_study_time?: string | null;
          timezone: string;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      entry_reading_diagnostics: Table<
        {
          id: string;
          learner_id: string;
          idempotency_key: string;
          version: string;
          reading_priority: ReadingPriority;
          recommended_skill: string;
          primary_observation: string;
          result: Json;
          completed_at: string;
          created_at: string;
        },
        {
          id?: string;
          learner_id: string;
          idempotency_key: string;
          version?: string;
          reading_priority: ReadingPriority;
          recommended_skill: string;
          primary_observation: string;
          result?: Json;
          completed_at?: string;
          created_at?: string;
        }
      >;
      entry_reading_diagnostic_responses: Table<
        {
          id: string;
          diagnostic_id: string;
          learner_id: string;
          item_id: string;
          response: string;
          confidence: string;
          elapsed_seconds: number;
          is_correct: boolean;
          created_at: string;
        },
        {
          id?: string;
          diagnostic_id: string;
          learner_id: string;
          item_id: string;
          response: string;
          confidence: string;
          elapsed_seconds: number;
          is_correct: boolean;
          created_at?: string;
        }
      >;
      study_sessions: Table<
        Timestamped & {
          id: string;
          learner_id: string;
          session_type: StudySessionType;
          status: "planned" | "active" | "paused" | "completed" | "abandoned";
          source: "dashboard" | "tutor_assignment" | "review_queue" | "library";
          topic: string;
          planned_minutes: number;
          available_minutes: number;
          active_seconds: number;
          questions_answered: number;
          correct_answers: number;
          due_reviews_completed: number;
          transfer_items_completed: number;
          diagnostic_loops_completed: number;
          include_due_reviews: boolean;
          timed: boolean;
          plan: Json;
          content_shortage: boolean;
          shortage_message: string | null;
          started_at: string | null;
          last_activity_at: string | null;
          paused_at: string | null;
          completed_at: string | null;
          ended_after_block_key: string | null;
        },
        {
          id?: string;
          learner_id: string;
          session_type: StudySessionType;
          status?: "planned" | "active" | "paused" | "completed" | "abandoned";
          source?:
            "dashboard" | "tutor_assignment" | "review_queue" | "library";
          topic: string;
          planned_minutes: number;
          available_minutes: number;
          active_seconds?: number;
          questions_answered?: number;
          correct_answers?: number;
          due_reviews_completed?: number;
          transfer_items_completed?: number;
          diagnostic_loops_completed?: number;
          include_due_reviews?: boolean;
          timed?: boolean;
          plan?: Json;
          content_shortage?: boolean;
          shortage_message?: string | null;
          started_at?: string | null;
          last_activity_at?: string | null;
          paused_at?: string | null;
          completed_at?: string | null;
          ended_after_block_key?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      daily_learner_progress: Table<
        Timestamped & {
          id: string;
          learner_id: string;
          local_date: string;
          active_seconds: number;
          questions_answered: number;
          correct_answers: number;
          reviews_completed: number;
          transfer_items_completed: number;
          diagnostics_completed: number;
          daily_core_completed: boolean;
          streak_eligible: boolean;
          goal_minutes: number;
        },
        {
          id?: string;
          learner_id: string;
          local_date: string;
          active_seconds?: number;
          questions_answered?: number;
          correct_answers?: number;
          reviews_completed?: number;
          transfer_items_completed?: number;
          diagnostics_completed?: number;
          daily_core_completed?: boolean;
          streak_eligible?: boolean;
          goal_minutes: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      learner_streak_stats: Table<
        {
          learner_id: string;
          current_streak: number;
          longest_streak: number;
          last_eligible_local_date: string | null;
          updated_at: string;
        },
        {
          learner_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_eligible_local_date?: string | null;
          updated_at?: string;
        }
      >;
      study_activity_events: Table<
        {
          id: string;
          session_id: string;
          learner_id: string;
          client_event_id: string;
          local_date: string;
          active_seconds: number;
          questions_answered: number;
          correct_answers: number;
          reviews_completed: number;
          transfer_items_completed: number;
          diagnostics_completed: number;
          created_at: string;
        },
        {
          id?: string;
          session_id: string;
          learner_id: string;
          client_event_id: string;
          local_date: string;
          active_seconds?: number;
          questions_answered?: number;
          correct_answers?: number;
          reviews_completed?: number;
          transfer_items_completed?: number;
          diagnostics_completed?: number;
          created_at?: string;
        }
      >;
      tutor_study_recommendations: Table<
        {
          id: string;
          organization_id: string;
          tutor_id: string;
          student_id: string;
          weekly_goal_minutes: number | null;
          reading_priority: ReadingPriority | null;
          session_type: StudySessionType | null;
          note: string;
          acknowledged_at: string | null;
          decision: "accepted" | "kept_current" | null;
          created_at: string;
        },
        {
          id?: string;
          organization_id: string;
          tutor_id: string;
          student_id: string;
          weekly_goal_minutes?: number | null;
          reading_priority?: ReadingPriority | null;
          session_type?: StudySessionType | null;
          note: string;
          acknowledged_at?: string | null;
          decision?: "accepted" | "kept_current" | null;
          created_at?: string;
        }
      >;
      audit_logs: Table<
        {
          id: string;
          organization_id: string | null;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state: Json | null;
          after_state: Json | null;
          created_at: string;
        },
        {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state?: Json | null;
          after_state?: Json | null;
          created_at?: string;
        }
      >;
    };
    Views: Record<never, never>;
    Functions: {
      accept_student_invite: {
        Args: { p_token_hash: string; p_display_name: string };
        Returns: Json;
      };
      complete_reading_entry_diagnostic: {
        Args: {
          p_idempotency_key: string;
          p_target_test_date: string;
          p_responses: Json;
        };
        Returns: Json;
      };
      create_student_invite: {
        Args: {
          p_class_id: string;
          p_token_hash: string;
          p_expires_at: string;
        };
        Returns: string;
      };
      create_tutor_profile: {
        Args: { p_display_name: string };
        Returns: Json;
      };
      create_tutor_workspace: {
        Args: { p_organization_name: string; p_class_name: string };
        Returns: Json;
      };
      create_assignment: {
        Args: {
          p_class_id: string;
          p_student_id: string;
          p_item_version_id: string;
          p_title: string;
          p_due_at: string | null;
          p_idempotency_key: string;
        };
        Returns: string;
      };
      submit_assignment_response: {
        Args: {
          p_assignment_item_id: string;
          p_client_submission_id: string;
          p_selected_option_id: string | null;
          p_typed_response: string | null;
          p_confidence: string | null;
          p_evidence_span_ids: string[];
          p_elapsed_seconds: number;
          p_answer_changes: number;
        };
        Returns: Json;
      };
      adjudicate_diagnosis: {
        Args: {
          p_diagnostic_session_id: string;
          p_decision: string;
          p_primary_cause: string | null;
          p_secondary_causes: string[];
          p_feedback: string | null;
          p_transfer_item_version_id: string | null;
          p_follow_up_question: string | null;
          p_add_to_lesson: boolean;
          p_idempotency_key: string;
        };
        Returns: string;
      };
      record_ai_diagnosis_suggestion: {
        Args: {
          p_diagnostic_session_id: string;
          p_request_id: string;
          p_input_fingerprint: string;
          p_model_version: string;
          p_prompt_version: string;
          p_schema_version: string;
          p_suggestion: Json;
          p_policy_review: Json;
          p_input_tokens: number;
          p_output_tokens: number;
          p_estimated_cost_microusd: number | null;
        };
        Returns: string;
      };
      record_study_activity: {
        Args: {
          p_session_id: string;
          p_client_event_id: string;
          p_local_date: string;
          p_active_seconds?: number;
          p_questions_answered?: number;
          p_correct_answers?: number;
          p_reviews_completed?: number;
          p_transfer_items_completed?: number;
          p_diagnostics_completed?: number;
        };
        Returns: boolean;
      };
      complete_daily_core: {
        Args: { p_local_date: string; p_goal_minutes: number };
        Returns: Json;
      };
      respond_to_study_recommendation: {
        Args: { p_recommendation_id: string; p_accept: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      account_role: AccountRole;
      content_status: ContentStatus;
      learning_style: LearningStyle;
      reading_priority: ReadingPriority;
      study_session_type: StudySessionType;
      study_session_status:
        "planned" | "active" | "paused" | "completed" | "abandoned";
      study_session_source:
        "dashboard" | "tutor_assignment" | "review_queue" | "library";
    };
    CompositeTypes: Record<never, never>;
  };
}
