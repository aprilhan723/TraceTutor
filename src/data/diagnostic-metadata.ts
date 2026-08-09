import type {
  CompleteWordsMetadata,
  DiagnosticProbeCode,
  DistractorRelation,
  ErrorCause,
  ItemDiagnosticMetadata,
  Skill,
} from "@/domain/mistake-intelligence";
import { MISTAKE_TAXONOMY_VERSION } from "@/domain/mistake-intelligence";
import type { PracticeItem } from "@/domain/study";

interface MetadataOverride {
  skill?: Skill;
  preferredProbeCode?: DiagnosticProbeCode;
  tags?: Record<string, DistractorRelation>;
  causeHints?: Record<string, ErrorCause[]>;
}

const metadataOverrides: Record<string, MetadataOverride> = {
  "academic-01": {
    skill: "purpose",
    preferredProbeCode: "quantifier-modality",
    tags: {
      a: "unsupported",
      c: "half-true",
      d: "too-broad",
    },
    causeHints: {
      c: ["evidence-misread"],
      d: ["modality-strengthened", "scope-expanded"],
    },
  },
  "academic-03": {
    skill: "detail",
    preferredProbeCode: "quantifier-modality",
    tags: { a: "modality-shift", c: "unsupported", d: "unsupported" },
    causeHints: { a: ["scope-expanded", "modality-strengthened"] },
  },
  "academic-04": {
    skill: "detail",
    preferredProbeCode: "source-vs-outside",
    tags: {
      a: "unsupported",
      b: "opposite",
      d: "unsupported",
    },
  },
  "academic-05": {
    skill: "purpose",
    preferredProbeCode: "source-vs-outside",
  },
  "daily-01": {
    skill: "purpose",
    preferredProbeCode: "example-vs-main",
    tags: {
      a: "true-but-irrelevant",
      c: "true-but-irrelevant",
      d: "unsupported",
    },
    causeHints: { a: ["example-main-point-confusion"] },
  },
  "daily-02": {
    skill: "detail",
    preferredProbeCode: "quantifier-modality",
    tags: { b: "unsupported", c: "wrong-actor", d: "too-broad" },
    causeHints: {
      c: ["actor-mismatch"],
      d: ["scope-expanded", "modality-strengthened"],
    },
  },
  "daily-03": {
    skill: "detail",
    preferredProbeCode: "actor-match",
    tags: {
      a: "unsupported",
      b: "wrong-actor",
      d: "opposite",
    },
    causeHints: { b: ["actor-mismatch"] },
  },
  "daily-04": {
    skill: "purpose",
    preferredProbeCode: "source-vs-outside",
  },
  "daily-05": {
    skill: "purpose",
    preferredProbeCode: "date-vs-deadline",
    tags: {
      b: "unsupported",
      c: "wrong-actor",
      d: "wrong-time",
    },
    causeHints: { c: ["actor-mismatch"], d: ["time-mismatch"] },
  },
  "daily-06": {
    skill: "main-idea",
    preferredProbeCode: "example-vs-main",
    tags: {
      a: "too-broad",
      b: "unsupported",
      d: "half-true",
    },
    causeHints: { a: ["example-main-point-confusion", "scope-expanded"] },
  },
};

const relationCause: Record<DistractorRelation, ErrorCause[]> = {
  "true-but-irrelevant": ["example-main-point-confusion"],
  unsupported: ["outside-knowledge-added"],
  opposite: ["evidence-misread"],
  "too-broad": ["scope-expanded"],
  "too-narrow": ["scope-narrowed"],
  "half-true": ["evidence-misread"],
  "wrong-actor": ["actor-mismatch"],
  "wrong-time": ["time-mismatch"],
  "wrong-condition": ["condition-mismatch"],
  "modality-shift": ["modality-strengthened", "modality-weakened"],
  "causal-reversal": ["cause-effect-reversed"],
  "copied-phrase-wrong-relationship": ["evidence-misread"],
};

function defaultSkill(item: PracticeItem): Skill {
  if (item.kind === "complete-words") {
    return "complete-the-words-language-form";
  }
  if (item.mistakeCategory === "purpose-confusion") return "purpose";
  if (item.mistakeCategory === "inference-overreach") return "inference";
  return "detail";
}

export function getItemDiagnosticMetadata(
  item: PracticeItem,
): ItemDiagnosticMetadata {
  const override = metadataOverrides[item.id];
  const options = item.kind === "complete-words" ? [] : item.options;
  const correctOptionId =
    item.kind === "complete-words" ? null : item.correctOptionId;
  const optionDistractorTags = Object.fromEntries(
    options.map((option) => [
      option.id,
      option.id === correctOptionId
        ? null
        : (override?.tags?.[option.id] ?? "unsupported"),
    ]),
  );
  const optionErrorCauseHints = Object.fromEntries(
    options
      .filter((option) => option.id !== correctOptionId)
      .map((option) => {
        const relation = optionDistractorTags[option.id];
        return [
          option.id,
          override?.causeHints?.[option.id] ??
            (relation ? relationCause[relation] : []),
        ];
      }),
  );

  return {
    taxonomyVersion: MISTAKE_TAXONOMY_VERSION,
    itemId: item.id,
    taskType: item.taskType,
    skill: override?.skill ?? defaultSkill(item),
    likelyProcessStages:
      item.kind === "complete-words"
        ? ["constraint-application", "monitoring-verification"]
        : [
            "evidence-location",
            "evidence-interpretation",
            "option-comparison",
            "constraint-application",
          ],
    correctOptionId,
    correctEvidenceSegmentIds:
      item.kind === "reading-question" ? item.correctEvidenceSegmentIds : [],
    optionDistractorTags,
    optionErrorCauseHints,
    expectedSeconds:
      item.kind === "complete-words"
        ? { fastBelow: 3, slowAbove: 45 }
        : { fastBelow: 8, slowAbove: 90 },
    preferredProbeCode: override?.preferredProbeCode ?? null,
  };
}

export const completeWordsMetadata: Record<string, CompleteWordsMetadata> = {
  "ctw-01": {
    itemId: "ctw-01",
    intendedLemma: "lower",
    correctWord: "lower",
    targetForm: "base",
    correctPartOfSpeech: "verb",
    localGrammarCue: "The modal verb ‘can’ requires a base verb.",
    contextMeaning: "reduce a temperature",
    knownRelatedForms: ["lowered", "lowering", "low"],
  },
  "ctw-02": {
    itemId: "ctw-02",
    intendedLemma: "moisture",
    correctWord: "moisture",
    targetForm: "noun",
    correctPartOfSpeech: "noun",
    localGrammarCue: "A noun is needed as the subject before ‘helps.’",
    contextMeaning: "water collected from fog",
    knownRelatedForms: ["moist", "moisten"],
  },
  "ctw-03": {
    itemId: "ctw-03",
    intendedLemma: "move",
    correctWord: "movement",
    targetForm: "noun",
    correctPartOfSpeech: "noun",
    localGrammarCue: "‘The ___ of’ requires a noun.",
    contextMeaning: "the change in stone position",
    knownRelatedForms: ["move", "moved", "moving"],
  },
  "ctw-04": {
    itemId: "ctw-04",
    intendedLemma: "season",
    correctWord: "seasonal",
    targetForm: "adjective",
    correctPartOfSpeech: "adjective",
    localGrammarCue: "An adjective modifies ‘gathering.’",
    contextMeaning: "connected with a season",
    knownRelatedForms: ["season", "seasonally"],
  },
  "ctw-05": {
    itemId: "ctw-05",
    intendedLemma: "protect",
    correctWord: "protective",
    targetForm: "adjective",
    correctPartOfSpeech: "adjective",
    localGrammarCue: "An adjective modifies ‘layer.’",
    contextMeaning: "able to protect the leaf",
    knownRelatedForms: ["protect", "protection", "protectively"],
  },
  "ctw-06": {
    itemId: "ctw-06",
    intendedLemma: "active",
    correctWord: "activity",
    targetForm: "noun",
    correctPartOfSpeech: "noun",
    localGrammarCue: "‘The ___ of moths’ requires a noun.",
    contextMeaning: "the moths’ movement and visits",
    knownRelatedForms: ["active", "actively", "activate"],
  },
  "ctw-07": {
    itemId: "ctw-07",
    intendedLemma: "scientist",
    correctWord: "scientists",
    targetForm: "plural",
    correctPartOfSpeech: "noun",
    localGrammarCue: "‘Several’ requires a plural count noun.",
    contextMeaning: "researchers who placed sensors",
    knownRelatedForms: ["scientist", "science", "scientific"],
  },
  "ctw-08": {
    itemId: "ctw-08",
    intendedLemma: "gradual",
    correctWord: "gradually",
    targetForm: "adverb",
    correctPartOfSpeech: "adverb",
    localGrammarCue: "An adverb describes how the trees spread.",
    contextMeaning: "little by little",
    knownRelatedForms: ["gradual", "gradualness"],
  },
  "ctw-09": {
    itemId: "ctw-09",
    intendedLemma: "reflect",
    correctWord: "reflection",
    targetForm: "noun",
    correctPartOfSpeech: "noun",
    localGrammarCue: "The verb ‘increase’ needs a noun object.",
    contextMeaning: "the returning of sunlight",
    knownRelatedForms: ["reflect", "reflective", "reflected"],
  },
  "ctw-10": {
    itemId: "ctw-10",
    intendedLemma: "rely",
    correctWord: "reliable",
    targetForm: "adjective",
    correctPartOfSpeech: "adjective",
    localGrammarCue: "An adjective modifies ‘record.’",
    contextMeaning: "dependable for comparison",
    knownRelatedForms: ["rely", "reliability", "reliably"],
  },
  "ctw-11": {
    itemId: "ctw-11",
    intendedLemma: "migrate",
    correctWord: "migration",
    targetForm: "noun",
    correctPartOfSpeech: "noun",
    localGrammarCue: "‘The ___ of cranes’ requires a noun.",
    contextMeaning: "the birds’ seasonal movement",
    knownRelatedForms: ["migrate", "migrating", "migratory"],
  },
  "ctw-12": {
    itemId: "ctw-12",
    intendedLemma: "effect",
    correctWord: "effective",
    targetForm: "adjective",
    correctPartOfSpeech: "adjective",
    localGrammarCue: "A complement after ‘proved’ describes the schedule.",
    contextMeaning: "successful at saving water",
    knownRelatedForms: ["effect", "effectively", "effectiveness"],
  },
};

export function getCompleteWordsMetadata(itemId: string) {
  return completeWordsMetadata[itemId] ?? null;
}
