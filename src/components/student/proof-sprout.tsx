import { cn } from "@/lib/cn";

export type ProofSproutStage =
  "seed" | "sprout" | "leafing" | "budding" | "bloom";

interface ProofSproutState {
  streak: number;
  d2Passed?: boolean;
  d7Passed?: boolean;
  resolvedPatternCount?: number;
  recoveryPassAvailable?: boolean;
}

interface ProofSproutProps extends ProofSproutState {
  className?: string;
  decorative?: boolean;
  size?: "compact" | "card";
}

export const proofSproutStageLabels: Record<ProofSproutStage, string> = {
  seed: "Resting seed",
  sprout: "New sprout",
  leafing: "Leafing",
  budding: "Proof bud",
  bloom: "Proof bloom",
};

export function getProofSproutStage({
  streak,
  d7Passed = false,
}: Pick<ProofSproutState, "streak" | "d7Passed">): ProofSproutStage {
  if (d7Passed) return "bloom";
  if (streak >= 7) return "budding";
  if (streak >= 3) return "leafing";
  if (streak >= 1) return "sprout";
  return "seed";
}

export function describeProofSprout({
  streak,
  d2Passed = false,
  d7Passed = false,
  resolvedPatternCount = 0,
  recoveryPassAvailable = false,
}: ProofSproutState) {
  const stage =
    proofSproutStageLabels[
      getProofSproutStage({ streak, d7Passed })
    ].toLowerCase();
  const parts = [
    `Proof Sprout, ${stage} stage`,
    `${streak}-day Correction Streak`,
    d2Passed ? "Day 2 leaf earned" : "Day 2 leaf not yet earned",
    d7Passed ? "Day 7 bloom earned" : "Day 7 bloom not yet earned",
  ];
  if (resolvedPatternCount >= 3) {
    parts.push("three resolved-pattern sparks earned");
  }
  if (recoveryPassAvailable) {
    parts.push("Recovery dew available");
  }
  return `${parts.join(". ")}.`;
}

export function ProofSprout({
  streak,
  d2Passed = false,
  d7Passed = false,
  resolvedPatternCount = 0,
  recoveryPassAvailable = false,
  className,
  decorative = false,
  size = "card",
}: ProofSproutProps) {
  const stage = getProofSproutStage({ streak, d7Passed });
  const hasStem = stage !== "seed";
  const hasSecondLeaf = ["leafing", "budding", "bloom"].includes(stage);
  const hasBud = stage === "budding";
  const hasBloom = stage === "bloom";
  const hasResolvedSparks = resolvedPatternCount >= 3;

  return (
    <svg
      viewBox="0 0 180 180"
      className={cn(
        "shrink-0 overflow-visible",
        size === "compact" ? "size-7" : "size-28 sm:size-32",
        className,
      )}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : describeProofSprout({
              streak,
              d2Passed,
              d7Passed,
              resolvedPatternCount,
              recoveryPassAvailable,
            })
      }
      focusable="false"
    >
      <ellipse cx="90" cy="158" rx="55" ry="11" fill="#25211F" opacity="0.09" />

      <g className="proof-sprout-bob">
        {hasResolvedSparks ? (
          <g aria-hidden="true" fill="#6846C5">
            <path d="M37 50l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
            <path d="M141 38l2.5 5.5L149 46l-5.5 2.5L141 54l-2.5-5.5L133 46l5.5-2.5z" />
            <circle cx="151" cy="68" r="3.5" fill="#257453" />
          </g>
        ) : null}

        {hasStem ? (
          <g aria-hidden="true">
            <path
              d="M90 91C89 75 90 59 92 43"
              fill="none"
              stroke="#4C318F"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M91 65C76 48 60 49 53 54c7 17 22 24 38 17"
              fill="#D9F4E4"
              stroke="#25211F"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {d2Passed ? (
              <path
                d="M58 56c11 2 20 7 29 13"
                fill="none"
                stroke="#6846C5"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : null}
            {hasSecondLeaf ? (
              <g className="proof-sprout-leaf">
                <path
                  d="M92 56c14-17 31-18 39-12-6 18-22 26-39 19"
                  fill="#FF806B"
                  stroke="#25211F"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M126 47c-11 3-20 8-30 14"
                  fill="none"
                  stroke="#A73C34"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            ) : null}
            {hasBud ? (
              <path
                d="M92 46c-10-7-12-17-8-25 10 0 18 8 17 18 6-8 15-10 23-6-1 12-11 20-24 19z"
                fill="#EEE8FF"
                stroke="#25211F"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            ) : null}
            {hasBloom ? (
              <g className="proof-sprout-bloom">
                <circle
                  cx="94"
                  cy="36"
                  r="12"
                  fill="#FF806B"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle
                  cx="94"
                  cy="16"
                  r="13"
                  fill="#D9F4E4"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle
                  cx="112"
                  cy="27"
                  r="13"
                  fill="#D9F4E4"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle
                  cx="106"
                  cy="47"
                  r="13"
                  fill="#D9F4E4"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle
                  cx="82"
                  cy="47"
                  r="13"
                  fill="#D9F4E4"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle
                  cx="76"
                  cy="27"
                  r="13"
                  fill="#D9F4E4"
                  stroke="#25211F"
                  strokeWidth="3"
                />
                <circle cx="94" cy="36" r="8" fill="#6846C5" />
              </g>
            ) : null}
          </g>
        ) : (
          <path
            d="M84 80c0-11 7-19 17-22 3 10-1 21-11 26"
            fill="none"
            stroke="#6846C5"
            strokeWidth="6"
            strokeLinecap="round"
            aria-hidden="true"
          />
        )}

        <path
          d="M54 115c0-25 16-42 36-42s36 17 36 42-15 40-36 40-36-15-36-40z"
          fill="#FF806B"
          stroke="#25211F"
          strokeWidth="3.5"
          strokeLinejoin="round"
          aria-hidden="true"
        />
        <path
          d="M62 128c12 8 44 8 56 0"
          fill="none"
          stroke="#A73C34"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
          aria-hidden="true"
        />
        <g aria-hidden="true" fill="#25211F">
          <ellipse cx="77" cy="109" rx="4" ry="5" />
          <ellipse cx="103" cy="109" rx="4" ry="5" />
        </g>
        <path
          d="M82 121c5 6 11 6 16 0"
          fill="none"
          stroke="#25211F"
          strokeWidth="3.5"
          strokeLinecap="round"
          aria-hidden="true"
        />
        <circle
          cx="69"
          cy="119"
          r="5"
          fill="#FFE2DA"
          opacity="0.75"
          aria-hidden="true"
        />
        <circle
          cx="111"
          cy="119"
          r="5"
          fill="#FFE2DA"
          opacity="0.75"
          aria-hidden="true"
        />

        {recoveryPassAvailable ? (
          <g className="proof-sprout-dew" aria-hidden="true">
            <path
              d="M146 83c0 0-13 16-13 25a13 13 0 0 0 26 0c0-9-13-25-13-25z"
              fill="#EEE8FF"
              stroke="#25211F"
              strokeWidth="3"
            />
            <path
              d="M141 105c1-4 3-7 6-10"
              fill="none"
              stroke="#6846C5"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
