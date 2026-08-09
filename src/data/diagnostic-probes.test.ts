import { describe, expect, it } from "vitest";
import { diagnosticProbes } from "@/data/diagnostic-probes";
import type { DiagnosticProbeCode } from "@/domain/mistake-intelligence";

const requiredProbeCodes: DiagnosticProbeCode[] = [
  "quantifier-modality",
  "source-vs-outside",
  "actor-match",
  "date-vs-deadline",
  "example-vs-main",
  "negative-constraint",
];

describe("structured diagnostic probes", () => {
  it("provides every required original contrast in under 30 seconds", () => {
    expect(diagnosticProbes.map((probe) => probe.code)).toEqual(
      requiredProbeCodes,
    );
    for (const probe of diagnosticProbes) {
      expect(probe.estimatedSeconds).toBeLessThan(30);
      expect(probe.options).toHaveLength(3);
      expect(
        probe.options.some((option) => option.id === probe.correctOptionId),
      ).toBe(true);
      expect(probe.distinguishes.length).toBeGreaterThanOrEqual(2);
    }
  });
});
