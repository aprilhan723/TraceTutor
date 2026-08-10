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
  await expect(
    page.getByRole("dialog", { name: /one correction target/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip tour" }).click();
}

async function submitCurrent(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /submit this item/i }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function chooseByKeyboard(
  page: import("@playwright/test").Page,
  name: string | RegExp,
) {
  const radio = page.getByRole("radio", { name });
  await radio.focus();
  await radio.press("Space");
  await expect(radio).toBeChecked();
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
          .getItem("tracetutor.demo.study.v4")
          ?.includes('"typedAnswer":"er"'),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/student\/practice\/mission-/);
  await expect(page.getByLabel("Missing ending for low")).toHaveValue("er");
  await expect(page.getByText("2 of 6", { exact: true })).toBeVisible();
});

test("new student completes a full correction mission and earns a meaningful streak", async ({
  page,
}) => {
  await page.goto("/student/today");
  await completeStudentOnboarding(page);
  await page.getByRole("link", { name: /start today’s correction/i }).click();

  await page
    .getByRole("radio", { name: /to infer a sequence of community change/i })
    .check();
  await chooseByKeyboard(page, "Certain");
  await page.getByRole("button", { name: /evidence segment 3:/i }).click();
  await submitCurrent(page);

  for (const [label, ending] of [
    ["low", "er"],
    ["mois", "ture"],
    ["move", "ment"],
  ] as const) {
    await page.getByLabel(`Missing ending for ${label}`).fill(ending);
    await submitCurrent(page);
  }

  await page
    .getByRole("radio", { name: "To keep unprocessed donations separate" })
    .check();
  await chooseByKeyboard(page, "Certain");
  await page.getByRole("button", { name: /evidence segment 3:/i }).click();
  await submitCurrent(page);

  await page
    .getByRole("radio", {
      name: "Rooftop gardens can slow runoff during some storms",
    })
    .check();
  await page.getByRole("button", { name: /submit this item/i }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/today$/);
  await expect(
    page.getByRole("heading", { name: "Correction complete" }),
  ).toBeVisible();
  await expect(page.getByText(/Correction Streak · 2/).first()).toBeVisible();
});

test("demo clock exposes spaced Day 2 and Day 7 schedule without waiting", async ({
  page,
}) => {
  await page.goto("/student/today");
  await completeStudentOnboarding(page);
  const clock = page.getByLabel("Program date");
  await clock.fill("2026-08-12");
  await expect(clock).toHaveValue("2026-08-12");
  await page.getByRole("button", { name: /two-minute Light Day/i }).click();
  await page.getByRole("link", { name: /start today’s correction/i }).click();
  await expect(page.getByText("D2 return", { exact: true })).toBeVisible();
  await page
    .getByRole("radio", { name: /to infer a sequence of community change/i })
    .check();
  await chooseByKeyboard(page, "Certain");
  await page.getByRole("button", { name: /evidence segment 3:/i }).click();
  await page.getByRole("button", { name: /submit this item/i }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Correction complete" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Prepare Day 2/i }).click();

  await page.getByLabel("Program date").fill("2026-08-15");
  await page.getByRole("link", { name: /start today’s correction/i }).click();
  await expect(page.getByText("D7 return", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Original practice content — not official ETS material.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("PWA keeps an already-open mission draft resumable offline", async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium" || process.env.E2E_PRODUCTION !== "1",
    "Full offline navigation is covered once in the production Chromium run.",
  );
  await page.goto("/student/today");
  await completeStudentOnboarding(page);
  await expect
    .poll(() =>
      page.evaluate(async () => Boolean(await navigator.serviceWorker?.ready)),
    )
    .toBe(true);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
    )
    .toBe(true);
  await page.getByRole("link", { name: /start today’s correction/i }).click();
  await expect(page).toHaveURL(/\/student\/practice\//);
  const practiceUrl = page.url();
  await page.goto(practiceUrl);
  await page
    .getByRole("radio", { name: /to infer a sequence of community change/i })
    .check();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage
          .getItem("tracetutor.demo.study.v4")
          ?.includes('"selectedOptionId":"b"'),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () =>
        Boolean(await caches.match(window.location.href)),
      ),
    )
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("radio", {
      name: /to infer a sequence of community change/i,
    }),
  ).toBeChecked();
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(
    page.getByText(/Offline · saved work stays on this device/i),
  ).toBeVisible();
  await context.setOffline(false);
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
  await page.locator('a[href="/tutor/students"]:visible').click();
  await expect(page).toHaveURL(/\/tutor\/students$/);
  await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
});

test("tutor adjudicates a diagnosis and carries it into the lesson brief", async ({
  page,
}) => {
  await page.goto("/tutor/dashboard");
  await expect(
    page.getByRole("heading", { name: /today’s intervention queue/i }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /review diagnosis/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/tutor\/review\/case-scope-expansion$/);
  await expect(
    page.getByRole("heading", { name: /seed exchange · action/i }),
  ).toBeVisible();

  await page
    .getByLabel("Primary cause")
    .selectOption("outside-knowledge-added");
  await page.getByRole("button", { name: "Approve diagnosis" }).click();
  await expect(page.getByText("changed", { exact: true })).toBeVisible();

  await page
    .getByLabel("Different transfer item")
    .selectOption("transfer-evidence-01");
  await page.getByRole("button", { name: "Assign transfer" }).click();
  await expect(page.getByText(/assigned transfer-evidence-01/i)).toBeVisible();

  await page.getByRole("button", { name: "Add to next lesson" }).click();
  await expect(
    page.getByRole("button", { name: "Added to lesson brief" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: /open next lesson brief/i }).click();
  await expect(page).toHaveURL(/\/lesson-brief$/);
  await expect(page.getByRole("heading", { name: "Jamie Park" })).toBeVisible();
  await expect(page.getByText("Outside knowledge added")).toBeVisible();

  await page.goto("/student/weekly-report");
  await expect(
    page.getByRole("heading", { name: /jamie, here’s what changed/i }),
  ).toBeVisible();
  await expect(page.getByText("Outside knowledge added")).toBeVisible();
  await expect(
    page.getByText(/not an official TOEFL score/i).first(),
  ).toBeVisible();
});
