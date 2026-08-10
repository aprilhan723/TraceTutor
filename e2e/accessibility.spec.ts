import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious,
    serious
      .map(
        (violation) =>
          `${violation.id}: ${violation.description} (${violation.nodes.length} nodes)`,
      )
      .join("\n"),
  ).toEqual([]);
}

async function onboard(page: Page) {
  await page.goto("/student/today");
  await page.getByLabel("Target test date").fill("2026-09-15");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /developing/i }).check();
  await page.getByRole("radio", { name: "10 minutes" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Preferred reminder time").fill("19:30");
  await page.getByRole("radio", { name: "Finding evidence" }).check();
  await page.getByRole("button", { name: /build my sprint/i }).click();
  await page.getByRole("button", { name: "Skip tour" }).click();
}

test("landing and trust surfaces have no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await page.goto("/trust");
  await expectNoSeriousAccessibilityViolations(page);
});

test("student Today and sprint roadmap have no serious accessibility violations", async ({
  page,
}) => {
  await onboard(page);
  await expectNoSeriousAccessibilityViolations(page);
  await page.goto("/student/sprint");
  await expect(
    page.getByRole("heading", { name: /work has an arc/i }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test("tutor action dashboard has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/tutor/dashboard");
  await expect(
    page.getByRole("heading", { name: /intervention queue/i }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});
