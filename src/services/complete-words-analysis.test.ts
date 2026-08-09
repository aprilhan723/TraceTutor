import { describe, expect, it } from "vitest";
import type { CompleteWordsMetadata } from "@/domain/mistake-intelligence";
import { analyzeCompleteWordsResponse } from "@/services/complete-words-analysis";

const adjectiveMetadata: CompleteWordsMetadata = {
  itemId: "test-adjective",
  intendedLemma: "protect",
  correctWord: "protective",
  targetForm: "adjective",
  correctPartOfSpeech: "adjective",
  localGrammarCue: "An adjective modifies the following noun.",
  contextMeaning: "able to protect",
  knownRelatedForms: ["protect", "protection", "protectively"],
};

const pastMetadata: CompleteWordsMetadata = {
  itemId: "test-past",
  intendedLemma: "survey",
  correctWord: "surveyed",
  targetForm: "past-tense",
  correctPartOfSpeech: "verb",
  localGrammarCue: "The completed event requires past tense.",
  contextMeaning: "examined in the past",
  knownRelatedForms: ["survey", "surveying"],
};

describe("Complete the Words layered analysis", () => {
  it.each([
    {
      name: "correct lemma with a misspelling",
      metadata: adjectiveMetadata,
      response: "protectiv",
      cause: "spelling-failure",
      layer: "spelling-edit-distance",
    },
    {
      name: "base form instead of past tense",
      metadata: pastMetadata,
      response: "survey",
      cause: "grammar-morphology-failure",
      layer: "inflection-tense",
    },
    {
      name: "wrong part of speech",
      metadata: adjectiveMetadata,
      response: "protection",
      cause: "grammar-morphology-failure",
      layer: "derivational-form",
    },
    {
      name: "contextually wrong word",
      metadata: adjectiveMetadata,
      response: "safe",
      cause: "lexical-meaning-failure",
      layer: "wider-context",
    },
  ])("classifies $name", ({ metadata, response, cause, layer }) => {
    const analysis = analyzeCompleteWordsResponse(metadata, "", response);
    expect(analysis.primaryCause).toBe(cause);
    expect(analysis.primaryLayer).toBe(layer);
  });

  it("recognizes the fully correct form across all six layers", () => {
    const analysis = analyzeCompleteWordsResponse(
      adjectiveMetadata,
      "",
      "  Protective ",
    );
    expect(analysis.correct).toBe(true);
    expect(
      Object.values(analysis.layers).every((value) => value === "secure"),
    ).toBe(true);
  });
});
