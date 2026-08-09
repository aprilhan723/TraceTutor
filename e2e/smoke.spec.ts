import { expect, test } from "@playwright/test";

async function completeStudentOnboarding(
  page: import("@playwright/test").Page,
) {
  await expect(
    page.getByRole("dialog", {
      name: /give today’s correction a destination/i,
    }),
  ).toBeVisible();
  await page.getByLabel("Target test date").fill("2026-09-15");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("radio", { name: /developing/i }).check();
  await page.getByRole("radio", { name: "10 minutes" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Preferred reminder time").fill("19:30");
  await page.getByRole("radio", { name: "Finding evidence" }).check();
  await page.getByRole("button", { name: /build my sprint/i }).click();
  await expect(
    page.getByRole("heading", { name: /today, jamie/i }),
  ).toBeVisible();
}

test("student can enter the demo from the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /practice less randomly/i,
    }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /try the student demo/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/student\/today$/);
  await completeStudentOnboarding(page);
  await expect(
    page.getByRole("heading", { name: /today, jamie/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo Mode", { exact: true }).first(),
  ).toBeVisible();
});

test("student onboarding and mission draft resume after refresh", async ({
  page,
}) => {
  await page.goto("/student/today");
  await completeStudentOnboarding(page);

  await page.getByRole("link", { name: /start today’s correction/i }).click();
  await expect(page).toHaveURL(/\/student\/practice\/mission-/);
  await expect(
    page.getByText("Original practice content — not official ETS material.", {
      exact: true,
    }),
  ).toBeVisible();

  await page
    .getByRole("radio", { name: /to infer a sequence of community change/i })
    .check();
  const confidence = page.getByRole("radio", { name: "Think so" });
  await confidence.focus();
  await confidence.press("Space");
  await expect(confidence).toBeChecked();
  await page.getByRole("button", { name: /evidence segment 3:/i }).click();
  await page.getByRole("button", { name: /submit this item/i }).click();
  await expect(page.getByRole("heading", { name: "Secure" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const endingInput = page.getByLabel("Missing ending for low");
  await endingInput.fill("er");
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage
          .getItem("tracetutor.demo.study.v3")
          ?.includes('"typedAnswer":"er"'),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/student\/practice\/mission-/);
  await expect(page.getByLabel("Missing ending for low")).toHaveValue("er");
  await expect(page.getByText("2 of 6", { exact: true })).toBeVisible();
});

test("wrong certain answer runs a probe and immediate transfer", async ({
  page,
}) => {
  await page.goto("/student/today");
  await completeStudentOnboarding(page);

  await page.getByRole("link", { name: /start today’s correction/i }).click();
  await page
    .getByRole("radio", { name: "To date each rock with complete precision" })
    .check();

  const confidence = page.getByRole("radio", { name: "Certain" });
  await confidence.focus();
  await confidence.press("Space");
  await page.getByRole("button", { name: /evidence segment 3:/i }).click();
  await page.getByRole("button", { name: /submit this item/i }).click();

  await expect(page.getByRole("heading", { name: "Diagnose" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Observed facts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Strength check" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Complete probe", exact: true }),
  ).toBeDisabled();

  await page
    .getByRole("radio", {
      name: "Rooftop gardens may reduce some afternoon heat.",
    })
    .check();
  await page.getByRole("button", { name: /update the diagnosis/i }).click();

  await expect(
    page.getByRole("heading", { name: "Likely diagnosis" }),
  ).toBeVisible();
  await expect(page.getByText(/likely: modality strengthened/i)).toBeVisible();
  await expect(page.getByText(/immediate transfer next/i)).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Which statement preserves the notice’s limits?",
    }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "Some shaded paths may reopen after a check" })
    .check();
  await page.getByRole("button", { name: /submit this item/i }).click();

  await expect(page.getByRole("heading", { name: "Secure" })).toBeVisible();
  await expect(page.getByText(/transfer secure/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Correction schedule" }),
  ).toBeVisible();
  await expect(page.getByText("Day 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Day 7", { exact: true })).toBeVisible();
});

test("tutor shell navigation is reachable", async ({ page }) => {
  await page.goto("/tutor/dashboard");

  await expect(
    page.getByRole("heading", { name: /intervention queue/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Students" }).first().click();
  await expect(page).toHaveURL(/\/tutor\/students$/);
  await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
});
