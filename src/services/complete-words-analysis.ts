import type {
  CompleteWordsAnalysis,
  CompleteWordsDiagnosticLayer,
  CompleteWordsMetadata,
} from "@/domain/mistake-intelligence";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, "");
}

export function editDistance(leftValue: string, rightValue: string) {
  const left = normalize(leftValue);
  const right = normalize(rightValue);
  const rows = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let row = 0; row <= left.length; row += 1) rows[row]![0] = row;
  for (let column = 0; column <= right.length; column += 1) {
    rows[0]![column] = column;
  }
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row]![column] = Math.min(
        rows[row - 1]![column]! + 1,
        rows[row]![column - 1]! + 1,
        rows[row - 1]![column - 1]! + substitution,
      );
    }
  }
  return rows[left.length]![right.length]!;
}

function initialLayers(): CompleteWordsAnalysis["layers"] {
  return {
    "intended-lemma": "not-established",
    "inflection-tense": "not-established",
    "derivational-form": "not-established",
    "spelling-edit-distance": "not-established",
    "local-grammar": "not-established",
    "wider-context": "not-established",
  };
}

function withPrimaryRisk(
  layers: CompleteWordsAnalysis["layers"],
  primary: CompleteWordsDiagnosticLayer,
) {
  return { ...layers, [primary]: "risk" as const };
}

export function analyzeCompleteWordsResponse(
  metadata: CompleteWordsMetadata,
  wordPrefix: string,
  response: string,
): CompleteWordsAnalysis {
  const normalizedResponse = normalize(response);
  const normalizedPrefix = normalize(wordPrefix);
  const candidateWord = normalizedResponse.startsWith(normalizedPrefix)
    ? normalizedResponse
    : `${normalizedPrefix}${normalizedResponse}`;
  const correctWord = normalize(metadata.correctWord);
  const distance = editDistance(candidateWord, correctWord);
  const relatedForms = metadata.knownRelatedForms.map(normalize);
  const intendedLemma = normalize(metadata.intendedLemma);
  const intendedLemmaKnown =
    candidateWord === intendedLemma ||
    relatedForms.includes(candidateWord) ||
    (intendedLemma.length >= 4 && candidateWord.startsWith(intendedLemma));
  let layers = initialLayers();

  if (candidateWord === correctWord) {
    for (const key of Object.keys(layers) as CompleteWordsDiagnosticLayer[]) {
      layers[key] = "secure";
    }
    return {
      candidateWord,
      correct: true,
      intendedLemmaKnown: true,
      editDistance: 0,
      primaryLayer: null,
      primaryCause: null,
      layers,
      observations: [
        {
          code: "complete-word-correct",
          label: "Form and context align",
          detail: `“${candidateWord}” matches the required word and form.`,
        },
      ],
      supportingEvidence: [metadata.localGrammarCue, metadata.contextMeaning],
      tutorReviewRequired: false,
    };
  }

  layers["intended-lemma"] = intendedLemmaKnown ? "secure" : "risk";
  layers["wider-context"] = intendedLemmaKnown ? "secure" : "risk";

  if (
    intendedLemmaKnown &&
    distance <= 2 &&
    !relatedForms.includes(candidateWord)
  ) {
    layers = withPrimaryRisk(layers, "spelling-edit-distance");
    return {
      candidateWord,
      correct: false,
      intendedLemmaKnown,
      editDistance: distance,
      primaryLayer: "spelling-edit-distance",
      primaryCause: "spelling-failure",
      layers,
      observations: [
        {
          code: "lemma-known-spelling",
          label: "Likely spelling mismatch",
          detail: `The response is ${distance} edit${distance === 1 ? "" : "s"} from “${correctWord}” while preserving its lexical base.`,
        },
      ],
      supportingEvidence: [
        "The intended word is recognizable, but the letter sequence does not match.",
      ],
      tutorReviewRequired: false,
    };
  }

  if (intendedLemmaKnown) {
    const inflectional =
      metadata.targetForm === "past-tense" || metadata.targetForm === "plural";
    const primaryLayer: CompleteWordsDiagnosticLayer = inflectional
      ? "inflection-tense"
      : "derivational-form";
    layers = withPrimaryRisk(layers, primaryLayer);
    layers["local-grammar"] = "risk";
    return {
      candidateWord,
      correct: false,
      intendedLemmaKnown,
      editDistance: distance,
      primaryLayer,
      primaryCause: "grammar-morphology-failure",
      layers,
      observations: [
        {
          code: inflectional ? "inflection-mismatch" : "derivation-mismatch",
          label: inflectional
            ? "Lemma known; inflection differs"
            : "Lemma known; part of speech differs",
          detail: `The response belongs to the intended word family, but this sentence requires the ${metadata.targetForm} form.`,
        },
      ],
      supportingEvidence: [metadata.localGrammarCue],
      tutorReviewRequired: false,
    };
  }

  layers = withPrimaryRisk(layers, "wider-context");
  layers["local-grammar"] = "not-established";
  return {
    candidateWord,
    correct: false,
    intendedLemmaKnown: false,
    editDistance: distance,
    primaryLayer: "wider-context",
    primaryCause: "lexical-meaning-failure",
    layers,
    observations: [
      {
        code: "context-word-mismatch",
        label: "Contextual word mismatch",
        detail:
          "The response does not preserve the intended lemma, so spelling alone cannot explain the mismatch.",
      },
    ],
    supportingEvidence: [
      `The wider context calls for ${metadata.contextMeaning}.`,
      metadata.localGrammarCue,
    ],
    tutorReviewRequired: true,
  };
}
