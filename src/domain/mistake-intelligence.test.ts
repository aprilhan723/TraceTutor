import { describe, expect, it } from "vitest";
import {
  behavioralContextTaxonomy,
  distractorRelationTaxonomy,
  errorCauseTaxonomy,
  mistakeTaxonomyV1,
  processStageTaxonomy,
  skillTaxonomy,
} from "@/domain/mistake-intelligence";

describe("versioned mistake taxonomy", () => {
  it("keeps each diagnostic axis typed and separate", () => {
    expect(mistakeTaxonomyV1.version).toBe(1);
    expect(skillTaxonomy).toHaveLength(8);
    expect(processStageTaxonomy).toHaveLength(6);
    expect(errorCauseTaxonomy).toHaveLength(16);
    expect(distractorRelationTaxonomy).toHaveLength(12);
    expect(behavioralContextTaxonomy).toHaveLength(8);

    const errorCauses = new Set<string>(errorCauseTaxonomy);
    expect(
      behavioralContextTaxonomy.filter((context) => errorCauses.has(context)),
    ).toEqual([]);
    expect(errorCauses.has("high-confidence")).toBe(false);
    expect(errorCauses.has("too-broad")).toBe(false);
    expect(errorCauses.has("inference")).toBe(false);
  });
});
