import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ProductionClass {
  id: string;
  name: string;
  organizationId: string;
}

export interface ProductionStudent {
  id: string;
  displayName: string;
  classId: string;
  targetTestDate: string | null;
}

export interface ProductionContentItem {
  itemVersionId: string;
  contentKey: string;
  taskType: string;
  prompt: string;
  title: string;
}

export interface ProductionAttemptSummary {
  id: string;
  studentId: string;
  studentName: string;
  assignmentTitle: string;
  submittedAt: string;
  isCorrect: boolean;
  confidence: string | null;
}

export interface TutorProductionWorkspace {
  organization: { id: string; name: string } | null;
  classes: ProductionClass[];
  students: ProductionStudent[];
  content: ProductionContentItem[];
  assignments: Array<{
    id: string;
    studentId: string;
    title: string;
    status: string;
    dueAt: string | null;
  }>;
  recentAttempts: ProductionAttemptSummary[];
}

export async function loadTutorProductionWorkspace(
  tutorId: string,
): Promise<TutorProductionWorkspace> {
  const supabase = await createSupabaseServerClient();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", tutorId)
    .eq("role", "tutor")
    .is("retired_at", null)
    .limit(1);
  const organizationId = memberships?.[0]?.organization_id;
  if (!organizationId) {
    return {
      organization: null,
      classes: [],
      students: [],
      content: [],
      assignments: [],
      recentAttempts: [],
    };
  }

  const [
    organizationResult,
    classesResult,
    linksResult,
    itemsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("classes")
      .select("id, name, organization_id")
      .eq("organization_id", organizationId)
      .is("retired_at", null)
      .order("created_at"),
    supabase
      .from("tutor_student_links")
      .select("student_id, class_id")
      .eq("tutor_id", tutorId)
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("items")
      .select("id, content_key, task_type")
      .eq("organization_id", organizationId)
      .is("retired_at", null)
      .order("created_at"),
    supabase
      .from("assignments")
      .select("id, student_id, title, status, due_at")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false }),
  ]);

  const studentIds = [
    ...new Set((linksResult.data ?? []).map((link) => link.student_id)),
  ];
  const { data: profiles } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, target_test_date")
        .in("id", studentIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const students = (linksResult.data ?? []).flatMap((link) => {
    const profile = profileMap.get(link.student_id);
    return profile
      ? [
          {
            id: profile.id,
            displayName: profile.display_name,
            classId: link.class_id,
            targetTestDate: profile.target_test_date,
          },
        ]
      : [];
  });

  const itemIds = (itemsResult.data ?? []).map((item) => item.id);
  const { data: versions } = itemIds.length
    ? await supabase
        .from("item_versions")
        .select("id, item_id, prompt, status")
        .in("item_id", itemIds)
        .eq("status", "published")
    : { data: [] };
  const itemMap = new Map(
    (itemsResult.data ?? []).map((item) => [item.id, item]),
  );
  const content = (versions ?? []).flatMap((version) => {
    const item = itemMap.get(version.item_id);
    return item
      ? [
          {
            itemVersionId: version.id,
            contentKey: item.content_key,
            taskType: item.task_type,
            prompt: version.prompt,
            title: item.content_key.replace(/^demo-/, "").replaceAll("-", " "),
          },
        ]
      : [];
  });

  const assignmentIds = (assignmentsResult.data ?? []).map(
    (assignment) => assignment.id,
  );
  const { data: assignmentItems } = assignmentIds.length
    ? await supabase
        .from("assignment_items")
        .select("id, assignment_id")
        .in("assignment_id", assignmentIds)
    : { data: [] };
  const assignmentItemIds = (assignmentItems ?? []).map((item) => item.id);
  const { data: attempts } = assignmentItemIds.length
    ? await supabase
        .from("attempts")
        .select("id, assignment_item_id, student_id, submitted_at")
        .in("assignment_item_id", assignmentItemIds)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(12)
    : { data: [] };
  const attemptIds = (attempts ?? []).map((attempt) => attempt.id);
  const [{ data: responses }, { data: confidence }] = attemptIds.length
    ? await Promise.all([
        supabase
          .from("responses")
          .select("attempt_id, is_correct")
          .in("attempt_id", attemptIds),
        supabase
          .from("confidence_ratings")
          .select("attempt_id, rating")
          .in("attempt_id", attemptIds),
      ])
    : [{ data: [] }, { data: [] }];
  const assignmentItemMap = new Map(
    (assignmentItems ?? []).map((item) => [item.id, item.assignment_id]),
  );
  const assignmentMap = new Map(
    (assignmentsResult.data ?? []).map((assignment) => [
      assignment.id,
      assignment,
    ]),
  );
  const responseMap = new Map(
    (responses ?? []).map((response) => [response.attempt_id, response]),
  );
  const confidenceMap = new Map(
    (confidence ?? []).map((rating) => [rating.attempt_id, rating.rating]),
  );

  return {
    organization: organizationResult.data,
    classes: (classesResult.data ?? []).map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      organizationId: classroom.organization_id,
    })),
    students,
    content,
    assignments: (assignmentsResult.data ?? []).map((assignment) => ({
      id: assignment.id,
      studentId: assignment.student_id,
      title: assignment.title,
      status: assignment.status,
      dueAt: assignment.due_at,
    })),
    recentAttempts: (attempts ?? []).flatMap((attempt) => {
      const assignmentId = assignmentItemMap.get(attempt.assignment_item_id);
      const assignment = assignmentId ? assignmentMap.get(assignmentId) : null;
      const response = responseMap.get(attempt.id);
      const student = profileMap.get(attempt.student_id);
      if (!assignment || !response || !student || !attempt.submitted_at)
        return [];
      return [
        {
          id: attempt.id,
          studentId: attempt.student_id,
          studentName: student.display_name,
          assignmentTitle: assignment.title,
          submittedAt: attempt.submitted_at,
          isCorrect: response.is_correct,
          confidence: confidenceMap.get(attempt.id) ?? null,
        },
      ];
    }),
  };
}

export interface StudentAssignmentItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  itemVersionId: string;
  prompt: string;
  taskType: string;
  dueAt: string | null;
  completed: boolean;
}

export async function loadStudentAssignments(studentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, due_at, status")
    .eq("student_id", studentId)
    .in("status", ["assigned", "completed"])
    .order("created_at", { ascending: false });
  const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);
  if (!assignmentIds.length) return [];
  const { data: assignmentItems } = await supabase
    .from("assignment_items")
    .select("id, assignment_id, item_version_id")
    .in("assignment_id", assignmentIds)
    .order("position");
  const versionIds = (assignmentItems ?? []).map(
    (item) => item.item_version_id,
  );
  const { data: versions } = versionIds.length
    ? await supabase
        .from("item_versions")
        .select("id, item_id, prompt")
        .in("id", versionIds)
    : { data: [] };
  const itemIds = (versions ?? []).map((version) => version.item_id);
  const { data: items } = itemIds.length
    ? await supabase.from("items").select("id, task_type").in("id", itemIds)
    : { data: [] };
  const assignmentItemIds = (assignmentItems ?? []).map((item) => item.id);
  const { data: attempts } = assignmentItemIds.length
    ? await supabase
        .from("attempts")
        .select("assignment_item_id")
        .in("assignment_item_id", assignmentItemIds)
        .eq("student_id", studentId)
        .eq("status", "submitted")
    : { data: [] };
  const assignmentMap = new Map(
    (assignments ?? []).map((assignment) => [assignment.id, assignment]),
  );
  const versionMap = new Map(
    (versions ?? []).map((version) => [version.id, version]),
  );
  const itemMap = new Map((items ?? []).map((item) => [item.id, item]));
  const completedIds = new Set(
    (attempts ?? []).map((attempt) => attempt.assignment_item_id),
  );
  return (assignmentItems ?? []).flatMap<StudentAssignmentItem>(
    (assignmentItem) => {
      const assignment = assignmentMap.get(assignmentItem.assignment_id);
      const version = versionMap.get(assignmentItem.item_version_id);
      const item = version ? itemMap.get(version.item_id) : null;
      if (!assignment || !version || !item) return [];
      return [
        {
          id: assignmentItem.id,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          itemVersionId: version.id,
          prompt: version.prompt,
          taskType: item.task_type,
          dueAt: assignment.due_at,
          completed: completedIds.has(assignmentItem.id),
        },
      ];
    },
  );
}

export async function loadProductionPracticeItem(
  studentId: string,
  assignmentItemId: string,
) {
  const assignments = await loadStudentAssignments(studentId);
  const assignmentItem = assignments.find(
    (item) => item.id === assignmentItemId,
  );
  if (!assignmentItem) return null;
  const supabase = await createSupabaseServerClient();
  const [{ data: version }, { data: options }, { data: evidence }] =
    await Promise.all([
      supabase
        .from("item_versions")
        .select("id, prompt, response_kind")
        .eq("id", assignmentItem.itemVersionId)
        .maybeSingle(),
      supabase
        .from("item_options")
        .select("id, option_key, label, position")
        .eq("item_version_id", assignmentItem.itemVersionId)
        .order("position"),
      supabase
        .from("evidence_spans")
        .select("id, segment_key, excerpt")
        .eq("item_version_id", assignmentItem.itemVersionId),
    ]);
  if (!version) return null;
  return {
    assignmentItem,
    version,
    options: options ?? [],
    evidence: evidence ?? [],
  };
}
