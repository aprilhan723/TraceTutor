import type {
  DailyMission,
  Intervention,
  MistakePattern,
  ReadingTaskCoverage,
  Student,
  Tutor,
} from "@/domain/models";

export const demoTutor: Tutor = {
  id: "tutor-maya-chen",
  name: "Maya Chen",
  initials: "MC",
  title: "TOEFL Reading Tutor",
  verifiedAt: "2026-08-01T09:00:00.000Z",
};

export const demoStudent: Student = {
  id: "student-jamie-park",
  tutorId: demoTutor.id,
  name: "Jamie Park",
  initials: "JP",
  targetScore: 27,
  currentStreakDays: 4,
};

export const demoMission: DailyMission = {
  id: "mission-jamie-2026-08-10",
  studentId: demoStudent.id,
  title: "Trace the sentence that proves it",
  focus: "evidence-drift",
  focusLabel: "Evidence drift",
  estimatedMinutes: 10,
  progress: 0,
  dueLabel: "Ready today",
  steps: [
    {
      id: "answer",
      label: "Answer",
      detail: "One original academic-passage item",
      status: "ready",
    },
    {
      id: "evidence",
      label: "Trace evidence",
      detail: "Mark the exact sentence that supports your choice",
      status: "locked",
    },
    {
      id: "transfer",
      label: "Transfer",
      detail: "Apply the correction to a fresh context",
      status: "locked",
    },
  ],
};

export const demoMistakePatterns: MistakePattern[] = [
  {
    id: "pattern-evidence-drift",
    studentId: demoStudent.id,
    category: "evidence-drift",
    label: "Evidence drift",
    description:
      "Choosing a plausible answer without anchoring it to the text.",
    recurrenceCount: 3,
    trend: "needs-attention",
    lastSeenAt: "2026-08-09T10:30:00.000Z",
  },
  {
    id: "pattern-word-form",
    studentId: demoStudent.id,
    category: "word-form",
    label: "Word-form mismatch",
    description:
      "Missing the grammar signal around a partially completed word.",
    recurrenceCount: 1,
    trend: "improving",
    lastSeenAt: "2026-08-06T12:15:00.000Z",
  },
];

export const demoInterventions: Intervention[] = [
  {
    id: "intervention-jamie-evidence",
    tutorId: demoTutor.id,
    studentId: demoStudent.id,
    studentName: demoStudent.name,
    patternLabel: "Evidence drift",
    reason: "Repeated in 3 of the last 5 correction sprints",
    priority: "high",
    suggestedAction: "Review Jamie’s evidence trace before the next lesson.",
  },
];

export const readingTaskCoverage: ReadingTaskCoverage[] = [
  {
    type: "complete-the-words",
    title: "Complete the Words",
    description:
      "Use grammar, form, and context signals—not a vocabulary guess.",
  },
  {
    type: "daily-life",
    title: "Read in Daily Life",
    description:
      "Trace purpose, detail, and implied meaning in practical texts.",
  },
  {
    type: "academic-passage",
    title: "Read an Academic Passage",
    description:
      "Anchor claims, inferences, and relationships to textual evidence.",
  },
];
