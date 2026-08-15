import { expect, test } from "@playwright/test";
import { enterStudentDemo, enterTutorDemo } from "./demo-session";

async function completeStudentOnboarding(
  page: import("@playwright/test").Page,
  style: "Daily Rhythm" | "Deep Focus" = "Daily Rhythm",
) {
  await expect(
    page.getByRole("dialog", {
      name: /build around the way you actually study/i,
    }),
  ).toBeVisible();
  await page
    .locator("label")
    .filter({ hasText: new RegExp(`^${style}`) })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Current Reading level").selectOption("3.5");
  await page.getByLabel("Target Reading score").selectOption("5");
  await page.getByLabel(/Target test date/i).fill("2026-09-15");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByLabel(/Default study time/i)
    .fill(style === "Deep Focus" ? "60" : "10");
  await page.getByLabel("Study days per week").selectOption("5");
  await page.getByLabel(/Preferred time/i).fill("19:30");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .locator("label")
    .filter({ hasText: /^Mistake review$/ })
    .click();
  await page.getByRole("button", { name: /build my plan/i }).click();
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

async function openTodayPractice(page: import("@playwright/test").Page) {
  const link = page.getByRole("link", { name: /start today’s correction/i });
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Today practice link is missing its destination");
  await link.click();
  try {
    await page.waitForURL(/\/student\/practice\/mission-/, { timeout: 5_000 });
  } catch (error) {
    if (process.env.E2E_PRODUCTION === "1") throw error;
    // Development's first dynamic-route compile can force one reload. The
    // production suite keeps the strict click-navigation assertion above.
    await page.goto(href);
  }
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
    .getByRole("link", {
      name: /try the student demo|explore the separate demo/i,
    })
    .first()
    .click();
  await expect(page).toHaveURL(/\/(demo|student\/today)$/);
  if (/\/demo$/.test(page.url())) {
    await page.getByRole("link", { name: /enter as student/i }).click();
  }
  await expect(page).toHaveURL(/\/student\/today$/);
  await completeStudentOnboarding(page);
  await expect(
    page.getByRole("heading", { name: /today, jamie/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo Mode", { exact: true }).first(),
  ).toBeVisible();
});

test("founding tutor pilot is transparent and reaches the demo", async ({
  page,
}) => {
  await page.goto("/pilot");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /spend the lesson on the right mistake/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("$49", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/pricing hypothesis, not a charge/i),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /explore the pilot demo|inspect both roles/i })
    .click();
  await expect(page).toHaveURL(/\/demo$/);
});

test("student onboarding and mission draft resume after refresh", async ({
  page,
}) => {
  await enterStudentDemo(page);
  await completeStudentOnboarding(page);

  await openTodayPractice(page);
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
          .getItem("tracetutor.demo.study.v5")
          ?.includes('"typedAnswer":"er"'),
      ),
    )
    .toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/student\/practice\/mission-/);
  await expect(page.getByLabel("Missing ending for low")).toHaveValue("er");
  await expect(page.getByText("2 of 6", { exact: true })).toBeVisible();
});

test("Deep Focus builds a block plan with breaks and resumes after leaving", async ({
  page,
}) => {
  await enterStudentDemo(page);
  await completeStudentOnboarding(page, "Deep Focus");
  // Compile the dynamic study route before exercising client navigation. In
  // development, a first-route Fast Refresh can otherwise cancel the click;
  // production builds do not have this compiler transition.
  await page.goto("/student/study/route-warmup");
  await expect(
    page.getByRole("heading", { name: "Session not found" }),
  ).toBeVisible();
  await page.goto("/student/study");
  await expect(
    page.getByRole("heading", { name: /study as long as today allows/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: "90 min" }).click();
  await page
    .locator("label")
    .filter({ hasText: /^Academic/ })
    .click();
  await page
    .getByRole("button", { name: /build my 90-minute session/i })
    .click();

  const sessionHeading = page.getByRole("heading", {
    name: /90-minute study session/i,
  });
  await expect(page).toHaveURL(/\/student\/study\/study-/, {
    timeout: 15_000,
  });
  await expect(sessionHeading).toBeVisible();
  await expect(page.getByText("Recovery break", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Daily Core", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: /pause and leave/i }).click();
  await expect(page).toHaveURL(/\/student\/today$/);
  await page.goto("/student/study");
  await expect(
    page.getByRole("heading", { name: /resume 90-minute plan/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /resume session/i }).click();
  await expect(page).toHaveURL(/\/student\/study\/study-/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /90-minute study session/i }),
  ).toBeVisible();
});

test("Daily Rhythm learner can start a 30-minute Focused Session", async ({
  page,
}) => {
  await enterStudentDemo(page);
  await completeStudentOnboarding(page, "Daily Rhythm");
  await page.goto("/student/study");
  await expect(
    page.getByRole("heading", { name: /study as long as today allows/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "30 min" }).click();
  await page
    .getByRole("button", { name: /build my 30-minute session/i })
    .click();
  await expect(
    page.getByRole("heading", { name: /30-minute study session/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Word-form speed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /pause and leave/i }).click();
  await page.goto("/student/study");
  await expect(
    page.getByRole("heading", { name: /resume 30-minute plan/i }),
  ).toBeVisible();
});

test("tutor recommendation stays advisory and learner-controlled", async ({
  page,
}) => {
  await enterStudentDemo(page);
  await completeStudentOnboarding(page);
  await page.goto("/tutor/dashboard");
  await page.getByRole("button", { name: /send recommendation/i }).click();
  await expect(
    page.getByRole("button", { name: /recommendation saved/i }),
  ).toBeVisible();

  await page.goto("/student/settings");
  await expect(
    page.getByRole("heading", { name: /suggested adjustment/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /keep my current plan/i }).click();
  await expect(
    page.getByRole("heading", { name: /suggested adjustment/i }),
  ).toBeHidden();
  await expect(page.getByText(/Weekly goal: 50 active minutes/i)).toBeVisible();
});

test("student navigation and personalized study fit a 390px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterStudentDemo(page);
  await completeStudentOnboarding(page);
  await expect(
    page.getByRole("img", { name: /Proof Sprout, .* stage/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/2-day review leaf (earned|waiting)/i),
  ).toBeVisible();
  await expect(
    page.locator('nav[aria-label="student mobile navigation"]'),
  ).toBeVisible();
  await page.goto("/student/study");
  await expect(
    page.getByRole("heading", { name: /study as long/i }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("new student completes a full correction mission and earns a meaningful streak", async ({
  page,
}) => {
  await enterStudentDemo(page);
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
  await expect(page.getByText(/Correction Streak · 1/).first()).toBeVisible();
});

test("demo clock exposes spaced Day 2 and Day 7 schedule without waiting", async ({
  page,
}) => {
  await enterStudentDemo(page);
  await completeStudentOnboarding(page);
  const clock = page.getByLabel("Program date");
  await clock.fill("2026-08-12");
  await expect(clock).toHaveValue("2026-08-12");
  await page.getByRole("button", { name: /two-minute Light Day/i }).click();
  await openTodayPractice(page);
  await expect(page.getByText("2-day review", { exact: true })).toBeVisible();
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
  await openTodayPractice(page);
  await expect(page.getByText("7-day review", { exact: true })).toBeVisible();
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
  await enterStudentDemo(page);
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
          .getItem("tracetutor.demo.study.v5")
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
  await enterStudentDemo(page);
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
  await enterTutorDemo(page);

  await expect(
    page.getByRole("heading", { name: /intervention queue/i }),
  ).toBeVisible();
  await page.locator('a[href="/tutor/students"]:visible').click();
  await expect(page).toHaveURL(/\/tutor\/students$/);
  await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
});

test("tutor sees an audited AI fixture while the student sees only the approved explanation", async ({
  page,
}) => {
  await enterTutorDemo(page);
  await page.goto("/tutor/review/case-scope-expansion");
  await expect(
    page.getByText("AI suggestion — tutor review pending", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Versioned demo fixture", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/live AI is off by default/i)).toBeVisible();
  await expect(page.getByText(/mock fixture — no API usage/i)).toBeHidden();

  await page.goto("/student/weekly-report");
  await expect(
    page.getByRole("heading", { name: /a cautious way to name the pattern/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/may have attached the right date/i),
  ).toBeVisible();
  await expect(page.getByText(/human verified/i)).toBeVisible();
});

test("tutor adjudicates a diagnosis and carries it into the lesson brief", async ({
  page,
}) => {
  await enterTutorDemo(page);
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
    .getByLabel("Main mistake", { exact: true })
    .selectOption("outside-knowledge-added");
  await page.getByRole("button", { name: "Approve diagnosis" }).click();
  await expect(page.getByText("changed", { exact: true })).toBeVisible();

  await page
    .getByLabel("Next practice item")
    .selectOption("transfer-evidence-01");
  await page.getByRole("button", { name: "Assign next practice" }).click();
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
