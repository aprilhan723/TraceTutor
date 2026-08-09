import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "@/components/ui/progress";

describe("Progress", () => {
  it("exposes a normalized value to assistive technology", () => {
    render(<Progress value={140} label="Mission progress" />);

    expect(
      screen.getByRole("progressbar", { name: "Mission progress" }),
    ).toHaveAttribute("aria-valuenow", "100");
  });
});
