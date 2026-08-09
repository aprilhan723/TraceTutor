import type { ReadingTaskCoverage } from "@/domain/models";

export const taskCoverage: ReadingTaskCoverage[] = [
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
