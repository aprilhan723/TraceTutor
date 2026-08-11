import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  describeProofSprout,
  getProofSproutStage,
  ProofSprout,
} from "@/components/student/proof-sprout";

describe("Proof Sprout", () => {
  it("maps meaningful streak and retention evidence to growth stages", () => {
    expect(getProofSproutStage({ streak: 0 })).toBe("seed");
    expect(getProofSproutStage({ streak: 2 })).toBe("sprout");
    expect(getProofSproutStage({ streak: 4 })).toBe("leafing");
    expect(getProofSproutStage({ streak: 7 })).toBe("budding");
    expect(getProofSproutStage({ streak: 3, d7Passed: true })).toBe("bloom");
  });

  it("describes every earned visual signal without color-only meaning", () => {
    expect(
      describeProofSprout({
        streak: 7,
        d2Passed: true,
        d7Passed: true,
        resolvedPatternCount: 3,
        recoveryPassAvailable: true,
      }),
    ).toBe(
      "Proof Sprout, proof bloom stage. 7-day Correction Streak. Day 2 leaf earned. Day 7 bloom earned. three resolved-pattern sparks earned. Recovery dew available.",
    );
  });

  it("renders the character as an accessible image", () => {
    render(<ProofSprout streak={3} d2Passed recoveryPassAvailable />);

    expect(
      screen.getByRole("img", {
        name: /Proof Sprout, leafing stage.*3-day Correction Streak.*Recovery dew available/i,
      }),
    ).toBeInTheDocument();
  });
});
