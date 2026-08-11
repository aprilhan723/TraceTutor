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
  await page.getByRole("radio", { name: /Daily Rhythm/i }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current Reading level").selectOption("3.5");
  await page.getByLabel("Target Reading score").selectOption("5");
  await page.getByLabel(/Target test date/i).fill("2026-09-15");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/Default study time/i).fill("10");
  await page.getByLabel("Study days per week").selectOption("5");
  await page.getByLabel(/Preferred time/i).fill("19:30");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .locator("label")
    .filter({ hasText: /^Mistake review$/ })
    .click();
  await page.getByRole("button", { name: /build my plan/i }).click();
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
