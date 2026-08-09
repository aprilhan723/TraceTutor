import type {
  DiagnosticProbe,
  DiagnosticProbeCode,
} from "@/domain/mistake-intelligence";

export const diagnosticProbes: DiagnosticProbe[] = [
  {
    code: "quantifier-modality",
    title: "Strength check",
    prompt: "Which option keeps the source claim at the same strength?",
    sourceText:
      "Some rooftop gardens may reduce heat during summer afternoons.",
    options: [
      {
        id: "same-strength",
        label: "Rooftop gardens may reduce some afternoon heat.",
        interpretation: "‘some’ and ‘may’ preserve the limited claim",
      },
      {
        id: "stronger",
        label: "All rooftop gardens always eliminate afternoon heat.",
        interpretation: "‘all’ and ‘always’ strengthen the source claim",
      },
      {
        id: "unrelated",
        label: "Rooftop gardens are expensive to build.",
        interpretation: "the statement adds an unrelated idea",
      },
    ],
    correctOptionId: "same-strength",
    estimatedSeconds: 20,
    distinguishes: ["scope-expanded", "modality-strengthened"],
  },
  {
    code: "source-vs-outside",
    title: "Source boundary",
    prompt: "Which statement can be concluded from the notice alone?",
    sourceText:
      "The repair café accepts lamps on Tuesday. Volunteers cannot repair phones this week.",
    options: [
      {
        id: "source-only",
        label: "A lamp can be brought on Tuesday.",
        interpretation: "the conclusion is directly supported by the notice",
      },
      {
        id: "outside",
        label: "Phone repairs require rarer tools than lamp repairs.",
        interpretation: "the explanation may sound plausible but is not stated",
      },
      {
        id: "opposite",
        label: "Phones will be repaired on Tuesday.",
        interpretation: "the conclusion contradicts the notice",
      },
    ],
    correctOptionId: "source-only",
    estimatedSeconds: 20,
    distinguishes: ["outside-knowledge-added", "evidence-misread"],
  },
  {
    code: "actor-match",
    title: "Actor check",
    prompt: "Who must bring the signed form?",
    sourceText:
      "Coaches submit the team list. Each player brings a signed health form.",
    options: [
      {
        id: "players",
        label: "Each player",
        interpretation: "the requirement is attached to the players",
      },
      {
        id: "coaches",
        label: "The coaches",
        interpretation: "coaches are mentioned, but their task is different",
      },
      {
        id: "both",
        label: "Coaches and players",
        interpretation: "the response expands the actor set",
      },
    ],
    correctOptionId: "players",
    estimatedSeconds: 15,
    distinguishes: ["actor-mismatch", "scope-expanded"],
  },
  {
    code: "date-vs-deadline",
    title: "Time check",
    prompt: "What happens on April 18?",
    sourceText:
      "Applications are due April 12. Selected artists install their work on April 18.",
    options: [
      {
        id: "installation",
        label: "Selected artists install their work.",
        interpretation: "April 18 is the event date",
      },
      {
        id: "deadline",
        label: "All applications are due.",
        interpretation: "April 12, not April 18, is the deadline",
      },
      {
        id: "selection",
        label: "The artists are selected.",
        interpretation: "the selection date is not stated",
      },
    ],
    correctOptionId: "installation",
    estimatedSeconds: 15,
    distinguishes: ["time-mismatch", "outside-knowledge-added"],
  },
  {
    code: "example-vs-main",
    title: "Claim check",
    prompt: "Which sentence states the main claim rather than an example?",
    sourceText:
      "Small design changes can make public spaces easier to use. For example, benches with armrests help some visitors stand up.",
    options: [
      {
        id: "main",
        label: "Small design changes can improve access.",
        interpretation: "this restates the broad claim",
      },
      {
        id: "example",
        label: "Every public space needs benches with armrests.",
        interpretation: "one example is expanded into a universal claim",
      },
      {
        id: "outside",
        label: "Armrests are inexpensive to manufacture.",
        interpretation: "the statement adds information not in the source",
      },
    ],
    correctOptionId: "main",
    estimatedSeconds: 20,
    distinguishes: ["example-main-point-confusion", "scope-expanded"],
  },
  {
    code: "negative-constraint",
    title: "Negative constraint",
    prompt: "Which action is NOT allowed?",
    sourceText:
      "Visitors may photograph the garden and sketch the plants, but they must not pick leaves.",
    options: [
      {
        id: "pick",
        label: "Picking leaves",
        interpretation: "‘must not’ marks the prohibited action",
      },
      {
        id: "photo",
        label: "Taking photographs",
        interpretation: "the source explicitly permits this action",
      },
      {
        id: "sketch",
        label: "Sketching plants",
        interpretation: "the source explicitly permits this action",
      },
    ],
    correctOptionId: "pick",
    estimatedSeconds: 15,
    distinguishes: ["polarity-negation-missed", "evidence-misread"],
  },
];

export function getDiagnosticProbe(code: DiagnosticProbeCode) {
  return diagnosticProbes.find((probe) => probe.code === code) ?? null;
}
